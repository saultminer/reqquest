import type { Queryable } from 'mysql2-async'
import db from 'mysql2-async/db'
import { findIndex, groupby, keyby } from 'txstate-utils'
import {
  Application, applicationComputedRow, ApplicationPhase, ApplicationRequirement, ApplicationStatus, AppRequest, AppRequestPhase, appRequestPhaseReached,
  AppRequestStatus, AppRequestStatusDB, appRequestTransaction, deriveApplicationStatus, getAppRequestData, getAppRequests,
  getPeriodWorkflowStages, IneligiblePhases, PeriodWorkflowStage, programRegistry, promptComputedRow, promptRegistry, PromptVisibility, RequirementPrompt,
  requirementComputedRow, RequirementStatus, RequirementType, syncApplications, syncPromptRecords, syncRequirementRecords, updateAppRequestComputed,
  updateApplicationsComputed, updatePromptComputed, updateRequirementComputed, type AppRequestData, type ProgramContext, type ProgramSelector, type ResolveResult
} from '../internal.js'

/**
 * Which slice of the lifecycle an application is being evaluated for. Decides which requirements
 * are consulted and how their resolution maps onto the application's status and phase.
 */
type EvaluationPhase = 'applicant' | 'review' | 'blocking' | 'acceptance' | 'nonblocking' | 'complete'

/** The verdict of the requirements that influence eligibility: first DISQUALIFYING wins, then first PENDING, else pass. */
type RequirementsResolution = 'pending' | 'fail' | 'pass'

/**
 * Everything an evaluation reads, loaded once. The lookups are read-only; the appRequest,
 * applications, requirements and prompts are the mutable objects the evaluation writes its
 * results onto and that persistEvaluation saves at the end.
 */
interface EvaluationContext {
  appRequest: AppRequest
  data: AppRequestData
  applications: Application[]
  requirements: ApplicationRequirement[]
  prompts: RequirementPrompt[]
  reqLookup: Record<string, ApplicationRequirement[]>
  promptLookup: Record<string, RequirementPrompt[]>
  workflowStages: PeriodWorkflowStage[]
  workflowStageLookup: Record<string, PeriodWorkflowStage>
  /** prompt and requirement configurations from this appRequest's period, by definition key */
  configLookup: Record<string, any>
  /**
   * prompt keys the applicant owns somewhere in this request. A prompt can be shared between an
   * applicant requirement and a reviewer requirement, and data the applicant provided can't read as review progress.
   */
  applicantPromptKeys: Set<string>
  /**
   * the computed columns as they were loaded, serialized per row, so persistEvaluation can write
   * back only the rows the evaluation actually changed
   */
  baseline: {
    applications: Map<number, string>
    requirements: Map<number, string>
    prompts: Map<number, string>
  }
  /**
   * `resolve` results from earlier in this evaluation, keyed by requirement key plus the prompt keys
   * whose data was in hand. A requirement shared by several programs sees identical input in each,
   * so the first program to reach a given input does the work and the rest reuse it, unless the
   * requirement read program context - then only programs with the same values for what it read reuse it.
   */
  resolveCache: Map<string, ResolveCacheEntry>
}

interface ResolveCacheEntry {
  /** the result when the requirement never asked for program context */
  pure?: ResolveResult
  /** results that depended on program context, with the properties read and their values at the time */
  contextual: { props: (keyof ProgramContext)[], valueKey: string, result: ResolveResult }[]
}

/** The requirements of one application, split by type and workflow role, plus the cumulative sets each phase consults. */
interface RequirementBuckets {
  prequal: ApplicationRequirement[]
  qualification: ApplicationRequirement[]
  postqual: ApplicationRequirement[]
  preapproval: ApplicationRequirement[]
  approval: ApplicationRequirement[]
  acceptance: ApplicationRequirement[]
  blockingWorkflow: ApplicationRequirement[]
  nonblockingWorkflow: ApplicationRequirement[]
  /** requirements belonging to the application's currently active workflow stage */
  currentWorkflow: ApplicationRequirement[]
  /** non-blocking workflow requirements whose emergence phase the request has reached */
  emergedNonblocking: ApplicationRequirement[]
  presubmit: ApplicationRequirement[]
  review: ApplicationRequirement[]
  accept: ApplicationRequirement[]
}

interface ResolutionSummary {
  firstFailing?: ApplicationRequirement
  firstPending?: ApplicationRequirement
  nonPassing?: ApplicationRequirement
  resolution: RequirementsResolution
}

/** State that legitimately crosses applications while they are evaluated in order. */
interface RequestAccumulators {
  /**
   * prompt keys already surfaced by an earlier application. ORDER-SENSITIVE: it is what makes a
   * shared prompt read as REQUEST_DUPE in later applications, so the same Set must flow through
   * every application in ctx.applications order.
   */
  promptsSeenInRequest: Set<string>
  /**
   * prompt keys whose requirement has been locked by any application. Applied to every prompt only
   * after all applications are evaluated, because a shared prompt locked in one place is locked everywhere.
   */
  promptKeysLocked: Set<string>
  /** applications where a reviewer has data on file, so the request-level rollup reads as in-progress rather than awaiting review */
  reviewStartedApplicationIds: Set<string>
}

export const applicantRequirementTypes = new Set<RequirementType>([
  RequirementType.PREQUAL,
  RequirementType.QUALIFICATION,
  RequirementType.POSTQUAL,
  RequirementType.ACCEPTANCE
])

/**
 * This method will fill in any missing application, requirement, or prompt records for the appRequest.
 * It will be called upon creation of an appRequest and each time it is evaluated, in case the system has
 * added a requirement since the last evaluation.
 */
export async function ensureAppRequestRecords (appRequest: AppRequest, db: Queryable) {
  const disabledPrograms = new Set(await db.getvals<string>('SELECT programKey FROM period_programs WHERE periodId = ? AND disabled = 1', [appRequest.periodId]))
  const disabledRequirements = await db.getall<{ programKey: string, requirementKey: string }>('SELECT programKey, requirementKey FROM period_program_requirements WHERE periodId = ? AND disabled = 1', [appRequest.periodId])
  const disabledRequirementLookup = disabledRequirements.reduce((acc, { programKey, requirementKey }) => ({ ...acc, [programKey]: { ...acc[programKey], [requirementKey]: true } }), {} as Record<string, Record<string, boolean>>)
  const programs = programRegistry.list().filter(program => !disabledPrograms.has(program.key))
  const reqKeyLookup: Record<string, Set<string>> = {}
  for (const program of programs) {
    reqKeyLookup[program.key] ??= new Set()
    for (const rkey of program.requirementKeys) {
      if (!disabledRequirementLookup[program.key]?.[rkey]) {
        reqKeyLookup[program.key].add(rkey)
      }
    }
    for (const rkey of program.workflowStages?.flatMap(stage => stage.requirementKeys) ?? []) {
      if (!disabledRequirementLookup[program.key]?.[rkey]) {
        reqKeyLookup[program.key].add(rkey)
      }
    }
  }
  const applications = await syncApplications(appRequest.internalId, new Set(programs.map(p => p.key)), db)
  const requirements = await syncRequirementRecords(appRequest.internalId, applications, reqKeyLookup, db)
  const prompts = await syncPromptRecords(appRequest.internalId, requirements, db)
  return { applications, requirements, prompts }
}

export async function tagAppRequest (appRequestInternalId: number, data: AppRequestData, prompts: RequirementPrompt[], tdb: Queryable = db) {
  const tagRows = []
  const seenPrompts = new Set<string>()
  for (const prompt of prompts) {
    if (seenPrompts.has(prompt.key)) continue
    seenPrompts.add(prompt.key)
    for (const category of prompt.definition.tags ?? []) {
      for (const tag of category.extract(data)) tagRows.push({ category: category.category, tag: tag, indexOnly: 0 })
    }
    for (const index of prompt.definition.indexes ?? []) {
      for (const idx of index.extract(data)) tagRows.push({ category: index.category, tag: idx, indexOnly: 1 })
    }
  }

  if (tagRows.length > 0) {
    const ibinds: any[] = []
    await tdb.insert(`
      INSERT INTO app_request_tags (appRequestId, indexOnly, category, tag)
      VALUES ${tdb.in(ibinds, tagRows.map(r => [appRequestInternalId, r.indexOnly, r.category, r.tag]))}
      ON DUPLICATE KEY UPDATE appRequestId = appRequestId
    `, ibinds)
    const dbinds: any[] = [appRequestInternalId]
    await tdb.delete(`
      DELETE FROM app_request_tags
      WHERE appRequestId = ? AND (category, tag) NOT IN (${tdb.in(dbinds, tagRows.map(r => [r.category, r.tag]))})
    `, dbinds)
  } else {
    await tdb.delete('DELETE FROM app_request_tags WHERE appRequestId = ?', [appRequestInternalId])
  }
}

/**
 * After an appRequest is created and each time it is modified, we evaluate requirement status and
 * update application and appRequest status accordingly, then save all those results to the database
 * for indexing and querying.
 *
 * Returns each application's phase as it stood before this evaluation, keyed by program, so callers
 * can react to phase transitions.
 */
export async function evaluateAppRequest (appRequestInternalId: number, tdb?: Queryable) {
  async function action (db: Queryable) {
    const ctx = await loadEvaluationContext(appRequestInternalId, db)
    if (!ctx) return

    const previousApplicationPhases = snapshotApplicationPhases(ctx.applications)

    await tagAppRequest(ctx.appRequest.internalId, ctx.data, ctx.prompts, db)
    await markPromptsAnswered(ctx, db)

    const acc: RequestAccumulators = {
      promptsSeenInRequest: new Set(),
      promptKeysLocked: new Set(),
      reviewStartedApplicationIds: new Set()
    }
    for (const application of ctx.applications) evaluateApplication(ctx, application, acc)
    applyPromptLocks(ctx.prompts, acc.promptKeysLocked)

    rollupAppRequest(ctx, acc)

    await persistEvaluation(ctx, db)
    return previousApplicationPhases
  }

  if (tdb) return await action(tdb)
  return await appRequestTransaction(appRequestInternalId, action)
}

/**
 * Load the appRequest and everything the evaluation reads. Returns undefined when the request is
 * not OPEN: a closed request is not evaluated. COMPLETE requests are still evaluated because an
 * application can be RESCINDED or restored after completion and the request-level status has to follow it.
 */
async function loadEvaluationContext (appRequestInternalId: number, db: Queryable): Promise<EvaluationContext | undefined> {
  const appRequest = (await getAppRequests({ internalIds: [appRequestInternalId] }, db))[0]
  if (!appRequest) throw new Error(`AppRequest ${appRequestInternalId} not found`)
  if (appRequest.dbStatus !== AppRequestStatusDB.OPEN) return undefined

  const data = (await getAppRequestData([appRequest.internalId], db))[0].data

  // all of the objects returned here are considered mutable - the evaluation updates them and
  // persistEvaluation saves them back to the database at the end
  const { applications, requirements, prompts } = await ensureAppRequestRecords(appRequest, db)

  const workflowStages = await getPeriodWorkflowStages({ periodIds: [appRequest.periodId] }, db)

  const configurations = await db.getall<{ definitionKey: string, data: string }>('SELECT definitionKey, data FROM period_configurations WHERE periodId = ?', [appRequest.periodId])
  const configLookup: Record<string, any> = {}
  for (const c of configurations) configLookup[c.definitionKey] = JSON.parse(c.data ?? '{}')

  return {
    appRequest,
    data,
    applications,
    requirements,
    prompts,
    reqLookup: groupby(requirements, 'applicationId'),
    promptLookup: groupby(prompts, 'requirementId'),
    workflowStages,
    workflowStageLookup: keyby(workflowStages, 'key'),
    configLookup,
    applicantPromptKeys: new Set(prompts.filter(p => applicantRequirementTypes.has(p.requirementType)).map(p => p.key)),
    baseline: {
      applications: snapshotComputed(applications, applicationComputedRow),
      requirements: snapshotComputed(requirements, requirementComputedRow),
      prompts: snapshotComputed(prompts, promptComputedRow)
    },
    resolveCache: new Map()
  }
}

/** Serialize each row's computed columns, keyed by internal id. Must run before anything mutates the models. */
function snapshotComputed<T extends { internalId: number }> (models: T[], toRow: (model: T) => object) {
  return new Map(models.map(m => [m.internalId, JSON.stringify(toRow(m))]))
}

/** The models whose computed columns differ from the snapshot taken at load. */
function changedSinceLoad<T extends { internalId: number }> (models: T[], toRow: (model: T) => object, baseline: Map<number, string>) {
  return models.filter(m => baseline.get(m.internalId) !== JSON.stringify(toRow(m)))
}

/** Must run before anything mutates the applications. */
function snapshotApplicationPhases (applications: Application[]) {
  const phases: Record<string, ApplicationPhase> = {}
  for (const app of applications) phases[app.programKey] = app.phase
  return phases
}

/**
 * Decide `prompt.answered` for every prompt in the request: the prompt's own validation passes
 * without errors, with one exception for untouched applicant prompts.
 */
async function markPromptsAnswered (ctx: EvaluationContext, db: Queryable) {
  const { data, configLookup } = ctx
  // a prompt shared by several requirements validates identically everywhere, so validate each key once
  const validByKey = new Map<string, boolean>()
  const validates = (prompt: RequirementPrompt) => {
    let valid = validByKey.get(prompt.key)
    if (valid == null) {
      const validationMessages = prompt.definition.validate?.(data[prompt.key] ?? {}, configLookup[prompt.key] ?? {}, data, configLookup, db) ?? []
      valid = !validationMessages.some(m => m.type === 'error')
      validByKey.set(prompt.key, valid)
    }
    return valid
  }
  for (const prompt of ctx.prompts) {
    if (
      /**
       * Some applicant prompts may be optional - as in there are no required fields in them.
       *
       * In this case, they will be undefined upon request creation and {} after being viewed and saved
       * without filling in any fields.
       *
       * We want to consider these prompts unanswered until the applicant has at least seen the screen
       * and hit save. Otherwise the UI may skip over the prompt entirely and the user will never have
       * a chance to fill it in.
       *
       * Reviewers are allowed to leave prompts blank without interacting because their interface is
       * always an overview of all the prompts in an application, so there is no risk of skipping over one.
       *
       * I'm intentionally avoiding using promptRegistry.isUserPrompt() here because in the rare case a
       * prompt is shared between an applicant requirement and a reviewer requirement, we only want the
       * applicant version of the prompt to be answered=false.
       */
      (data[prompt.key] == null && applicantRequirementTypes.has(prompt.requirementType))
    ) {
      prompt.answered = false
    } else {
      prompt.answered = validates(prompt)
    }
  }
}

/**
 * Evaluate one application: resolve its requirements (which also sets prompt visibility), then
 * derive its status, phase and ineligiblePhase, and record which prompts it locks. This is the
 * only place application fields are written, in dependency order.
 */
function evaluateApplication (ctx: EvaluationContext, application: Application, acc: RequestAccumulators) {
  const activeWorkflowStage = application.workflowStageKey ? ctx.workflowStageLookup[application.workflowStageKey] : undefined
  const phase = classifyEvaluationPhase(ctx.appRequest, application, activeWorkflowStage)
  const buckets = bucketRequirements(ctx, application)
  const { sortedRequirements, displayedRequirements } = selectRequirements(phase, buckets)

  const { firstAwaitingCorrectionRequirement } = resolveRequirements(ctx, application, sortedRequirements, displayedRequirements, acc)
  application.awaitingCorrection = firstAwaitingCorrectionRequirement != null

  const summary = summarizeResolution(sortedRequirements)

  // status intentionally ignores invalidation: it is the best assessment of the data currently
  // on file, so disqualified applications remain INELIGIBLE while a correction is outstanding.
  // awaitingCorrection carries the "must be re-answered" fact and holds back the phase below.
  application.computedStatus = computeApplicationStatus(phase, summary, application.computedStatus)

  // computedStatus is what gets persisted; status carries the rescind override and is what the
  // request-level rollup reads, so it has to be refreshed after every recomputation
  application.status = deriveApplicationStatus(application.computedStatus, application.rescindedStatus)

  application.statusReason = summary.firstFailing?.statusReason ?? summary.firstPending?.statusReason

  const reviewInProgress = detectReviewInProgress(ctx, buckets.approval)
  // remember even when the phase below lands somewhere else. Once every APPROVAL requirement
  // resolves the application moves on to READY_FOR_WORKFLOW, and reversing a workflow drops it
  // back here with all of that reviewer data still on file. request status
  // must still read as in review rather than awaiting a reviewer.
  if (phase === 'review' && reviewInProgress) acc.reviewStartedApplicationIds.add(application.id)

  // a program with nothing after submission - no reviewer, workflow or acceptance requirements - needs no one to act on it once submitted
  const noTrailingWork = !buckets.preapproval.length && !buckets.approval.length && !buckets.acceptance.length && !buckets.blockingWorkflow.length && !buckets.nonblockingWorkflow.length

  // phase reads the ineligiblePhase from the previous evaluation, so it is computed before ineligiblePhase is refreshed
  application.phase = computeApplicationPhase(phase, application, summary, firstAwaitingCorrectionRequirement, reviewInProgress, buckets.nonblockingWorkflow.length > 0, noTrailingWork)
  application.ineligiblePhase = computeIneligiblePhase(phase, summary, application.ineligiblePhase)

  for (const requirement of requirementsToLock(phase, application, buckets)) {
    for (const prompt of ctx.promptLookup[requirement.id] ?? []) acc.promptKeysLocked.add(prompt.key)
  }
}

function classifyEvaluationPhase (appRequest: AppRequest, application: Application, activeWorkflowStage: PeriodWorkflowStage | undefined): EvaluationPhase {
  // checked before 'complete': an application auto-completed at submission must be re-evaluated when the request is returned to the applicant
  if (appRequest.phase === AppRequestPhase.STARTED) return 'applicant'
  if (application.phase === ApplicationPhase.COMPLETE || application.phase === ApplicationPhase.READY_TO_COMPLETE) return 'complete'
  if (appRequest.phase === AppRequestPhase.ACCEPTANCE) return 'acceptance'
  if (application.workflowStageKey) return activeWorkflowStage?.blocking ? 'blocking' : 'nonblocking'
  if (appRequest.phase === AppRequestPhase.WORKFLOW_NONBLOCKING) return 'nonblocking'
  return 'review'
}

/**
 * In the reviewer's view, we will often want related requirements to be grouped together, so created default buckets and order here
 */
function bucketRequirements (ctx: EvaluationContext, application: Application): RequirementBuckets {
  const requirements = ctx.reqLookup[application.id] ?? []
  const prequal = requirements.filter(req => req.type === RequirementType.PREQUAL)
  const qualification = requirements.filter(req => req.type === RequirementType.QUALIFICATION)
  const postqual = requirements.filter(req => req.type === RequirementType.POSTQUAL)
  const preapproval = requirements.filter(req => req.type === RequirementType.PREAPPROVAL)
  const approval = requirements.filter(req => req.type === RequirementType.APPROVAL)
  const acceptance = requirements.filter(req => req.type === RequirementType.ACCEPTANCE)
  const blockingWorkflow = requirements.filter(req => req.workflowStageKey ? ctx.workflowStageLookup[req.workflowStageKey]?.blocking : false)
  const nonblockingWorkflow = requirements.filter(req => req.workflowStageKey ? !ctx.workflowStageLookup[req.workflowStageKey]?.blocking : false)
  const currentWorkflow = requirements.filter(req => req.workflowStageKey === application.workflowStageKey)
  const presubmit = [...prequal, ...qualification, ...postqual]
  const review = [...presubmit, ...preapproval, ...approval]
  const accept = [...review, ...blockingWorkflow, ...acceptance]
  const emergedNonblocking = nonblockingWorkflow.filter(req => {
    const emergence = programRegistry.getWorkflowStageByKey(req.workflowStageKey)?.nonBlockingEmergence ?? AppRequestPhase.WORKFLOW_NONBLOCKING
    return appRequestPhaseReached(ctx.appRequest.phase, emergence)
  })
  return { prequal, qualification, postqual, preapproval, approval, acceptance, blockingWorkflow, nonblockingWorkflow, currentWorkflow, emergedNonblocking, presubmit, review, accept }
}

/**
 * Pick the requirements this phase evaluates. *
 * `sortedRequirements` are the ones that decide eligibility. *
 * `displayedRequirements` adds the non-blocking workflow requirements whose emergence phase has been reached. They are appended after sortedRequirements and excluded from eligibility decisions.
 */
function selectRequirements (phase: EvaluationPhase, buckets: RequirementBuckets) {
  const sortedRequirements = resolutionRequirements(phase, buckets)
  const emergedExtraRequirements = phase !== 'nonblocking' && phase !== 'complete'
    ? buckets.emergedNonblocking.filter(req => !sortedRequirements.includes(req))
    : []
  return { sortedRequirements, displayedRequirements: [...sortedRequirements, ...emergedExtraRequirements] }
}

function resolutionRequirements (phase: EvaluationPhase, buckets: RequirementBuckets): ApplicationRequirement[] {
  switch (phase) {
  case 'complete': return []
  case 'applicant': return buckets.presubmit
  case 'acceptance': return buckets.accept
  case 'nonblocking': return buckets.nonblockingWorkflow
  case 'blocking': return buckets.currentWorkflow
  case 'review': return buckets.review
  }
}

/**
 * Resolve each displayed requirement in order, tracking whether an earlier requirement has already
 * disqualified the application (which makes later prompts moot) and the first requirement holding
 * an invalidated prompt the user can currently reach.
 */
function resolveRequirements (ctx: EvaluationContext, application: Application, sortedRequirements: ApplicationRequirement[], displayedRequirements: ApplicationRequirement[], acc: RequestAccumulators) {
  const promptsSeenInApplication = new Set<string>()
  const resolutionRequirementSet = new Set(sortedRequirements)
  // statuses settled so far in this application, offered to later requirements through the program selector
  const priorStatuses: Record<string, RequirementStatus> = {}
  let applicationIsIneligible = false
  let firstAwaitingCorrectionRequirement: ApplicationRequirement | undefined
  for (const requirement of displayedRequirements) {
    // identify if requirement influences eligibility (accommodate emerged non blocking that may be mixed in)
    const isResolutionRequirement = resolutionRequirementSet.has(requirement)
    // a prior requirement already disqualified this application, so nothing in this requirement can change its outcome
    const promptsAreMoot = applicationIsIneligible && requirement.type !== RequirementType.WORKFLOW

    const { disqualifying, awaitingCorrection } = resolveRequirement(ctx, application, requirement, priorStatuses, promptsAreMoot, { application: promptsSeenInApplication, request: acc.promptsSeenInRequest })
    priorStatuses[requirement.key] = requirement.status

    if (disqualifying && isResolutionRequirement) applicationIsIneligible = true

    if (isResolutionRequirement && firstAwaitingCorrectionRequirement == null && !promptsAreMoot && awaitingCorrection) {
      firstAwaitingCorrectionRequirement = requirement
    }
  }
  return { firstAwaitingCorrectionRequirement }
}

/**
 * Resolve a single requirement against the data on file, revealing its prompts one at a time.
 *
 * Prompts are gated in three groups and the requirement's resolve() is re-run as each group's
 * data becomes available: noDisplay prompts first (never shown, their data is simply present or
 * not), then anyOrder prompts (all shown together), then regular prompts one by one - each answered
 * regular prompt re-resolves, and the first unanswered one hides everything after it. Sets each
 * prompt's visibility and moot flag and the requirement's status, reason and blame.
 */
function resolveRequirement (ctx: EvaluationContext, application: Application, requirement: ApplicationRequirement, priorStatuses: Record<string, RequirementStatus>, promptsAreMoot: boolean, seen: { application: Set<string>, request: Set<string> }) {
  const { data } = ctx
  const prompts = ctx.promptLookup[requirement.id] ?? []
  const anyOrderPrompts = prompts.filter(p => requirement.definition.anyOrderPromptKeySet.has(p.key))
  const noDisplayPrompts = prompts.filter(p => requirement.definition.noDisplayPromptKeySet.has(p.key))
  const regularPrompts = prompts.filter(p => !requirement.definition.anyOrderPromptKeySet.has(p.key) && !requirement.definition.noDisplayPromptKeySet.has(p.key))

  const requiredData = {} as AppRequestData
  let hasUnanswered = false
  let resolveInfo: ResolveResult

  const resolve = () => resolveWithCache(ctx, application, requirement, priorStatuses, requiredData)
  const markSeen = (prompt: RequirementPrompt) => {
    if (promptsAreMoot) return
    seen.application.add(prompt.key)
    seen.request.add(prompt.key)
  }

  function gateNoDisplayPrompts () {
    for (const prompt of noDisplayPrompts) {
      prompt.visibility = PromptVisibility.UNREACHABLE
      if (prompt.answered) requiredData[prompt.key] = data[prompt.key]
      else if (!requirement.definition.ungatedPromptKeySet.has(prompt.key)) hasUnanswered = true
    }
    resolveInfo = resolve()
  }

  function gateAnyOrderPrompts () {
    const anyOrderAllAnswered = anyOrderPrompts.every(p => p.answered)
    for (const prompt of anyOrderPrompts) {
      prompt.moot = promptsAreMoot
      prompt.visibility = PromptVisibility.UNREACHABLE
      if (!hasUnanswered && resolveInfo.status === RequirementStatus.PENDING) {
        if (anyOrderAllAnswered) requiredData[prompt.key] = data[prompt.key]
        prompt.visibility = PromptVisibility.AVAILABLE
        markSeen(prompt)
      }
    }
    if (!hasUnanswered && anyOrderAllAnswered && anyOrderPrompts.length) resolveInfo = resolve()
    hasUnanswered ||= !anyOrderAllAnswered
  }

  function gateRegularPrompts () {
    for (const prompt of regularPrompts) {
      prompt.moot = promptsAreMoot && !promptRegistry.get(prompt.key).optOut
      if ((hasUnanswered || resolveInfo.status !== RequirementStatus.PENDING) && !promptRegistry.get(prompt.key).optOut) prompt.visibility = PromptVisibility.UNREACHABLE
      else {
        if (seen.application.has(prompt.key)) prompt.visibility = PromptVisibility.APPLICATION_DUPE
        else if (seen.request.has(prompt.key)) prompt.visibility = PromptVisibility.REQUEST_DUPE
        else prompt.visibility = PromptVisibility.AVAILABLE
        markSeen(prompt)
        if (prompt.answered) {
          requiredData[prompt.key] = data[prompt.key]
          resolveInfo = resolve()
        } else hasUnanswered = true
      }
    }
  }

  gateNoDisplayPrompts()
  gateAnyOrderPrompts()
  gateRegularPrompts()

  requirement.status = resolveInfo!.status
  requirement.statusReason = resolveInfo!.reason
  requirement.blame = resolveInfo!.blame?.length ? resolveInfo!.blame : undefined

  return {
    disqualifying: requirement.status === RequirementStatus.DISQUALIFYING,
    awaitingCorrection: prompts.some(p => p.invalidated && p.visibility === PromptVisibility.AVAILABLE)
  }
}

/**
 * Call the requirement's `resolve`, reusing an earlier result from this evaluation when nothing the
 * requirement could observe differs.
*/
function resolveWithCache (ctx: EvaluationContext, application: Application, requirement: ApplicationRequirement, priorStatuses: Record<string, RequirementStatus>, requiredData: AppRequestData): ResolveResult {
  const cacheKey = `${requirement.key}|${Object.keys(requiredData).sort().join(',')}`
  let entry = ctx.resolveCache.get(cacheKey)
  if (entry?.pure) return entry.pure

  let context: ProgramContext | undefined
  const getContext = () => {
    context ??= {
      key: application.programKey,
      title: application.title,
      navTitle: application.navTitle,
      requirementIndex: requirement.evaluationOrder,
      priorStatuses: { ...priorStatuses }
    }
    return context
  }
  const valueKeyFor = (props: (keyof ProgramContext)[]) => JSON.stringify(props.map(prop => getContext()[prop]))

  if (entry) {
    for (const cached of entry.contextual) {
      if (valueKeyFor(cached.props) === cached.valueKey) return cached.result
    }
  }

  const propsRead = new Set<keyof ProgramContext>()
  const program: ProgramSelector = select => {
    const picked = {} as Pick<ProgramContext, keyof ProgramContext>
    for (const prop of Object.keys(select) as (keyof ProgramContext)[]) {
      if (!(select as Record<string, boolean>)[prop]) continue
      propsRead.add(prop)
      ;(picked as any)[prop] = getContext()[prop]
    }
    return picked
  }

  const result = requirement.definition.resolve(requiredData, ctx.configLookup[requirement.definition.key] ?? {}, ctx.configLookup, program)

  entry ??= { contextual: [] }
  if (propsRead.size === 0) entry.pure = result
  else {
    const props = [...propsRead].sort()
    entry.contextual.push({ props, valueKey: valueKeyFor(props), result })
  }
  ctx.resolveCache.set(cacheKey, entry)
  return result
}

function summarizeResolution (sortedRequirements: ApplicationRequirement[]): ResolutionSummary {
  const firstFailing = sortedRequirements.find(r => r.status === RequirementStatus.DISQUALIFYING)
  const firstPending = sortedRequirements.find(r => r.status === RequirementStatus.PENDING)
  return {
    firstFailing,
    firstPending,
    nonPassing: firstFailing ?? firstPending,
    resolution: firstFailing != null ? 'fail' : firstPending != null ? 'pending' : 'pass'
  }
}

function computeApplicationStatus (phase: EvaluationPhase, summary: ResolutionSummary, current: ApplicationStatus): ApplicationStatus {
  const { resolution } = summary
  // eligibility is settled by the time these phases are reached; the status carries over
  if (phase === 'nonblocking' || phase === 'complete') return current

  if (phase === 'acceptance') {
    switch (resolution) {
    case 'pass': return ApplicationStatus.ACCEPTED
    case 'fail': return summary.firstFailing!.type === RequirementType.ACCEPTANCE ? ApplicationStatus.REJECTED : ApplicationStatus.INELIGIBLE
    case 'pending': return ApplicationStatus.ELIGIBLE
    }
  }

  switch (resolution) {
  case 'pass': return ApplicationStatus.ELIGIBLE
  case 'fail': return ApplicationStatus.INELIGIBLE
  case 'pending': return ApplicationStatus.PENDING
  }
}

function detectReviewInProgress (ctx: EvaluationContext, approvalRequirements: ApplicationRequirement[]) {
  return approvalRequirements.some(req => (ctx.promptLookup[req.id] ?? [])
    .some(p => !ctx.applicantPromptKeys.has(p.key) && p.answered && ctx.data[p.key] != null))
}

const applicantRequirementIneligiblePhases: IneligiblePhases[] = [IneligiblePhases.PREQUAL, IneligiblePhases.QUALIFICATION]

/** ruled out before submission (PREQUAL or QUALIFICATION), so a reviewer has nothing to decide for it */
export function isPresubmissionIneligible (application: Application) {
  return !!application.ineligiblePhase && applicantRequirementIneligiblePhases.includes(application.ineligiblePhase)
}

function computeApplicationPhase (
  phase: EvaluationPhase,
  application: Application,
  summary: ResolutionSummary,
  firstAwaitingCorrectionRequirement: ApplicationRequirement | undefined,
  reviewInProgress: boolean,
  hasNonblockingWorkflowRequirements: boolean,
  noTrailingWork: boolean
): ApplicationPhase {
  const settled = summary.resolution !== 'pending' && !application.awaitingCorrection
  const attentionRequirement = summary.nonPassing ?? firstAwaitingCorrectionRequirement
  // a review the reviewer already marked complete stays complete; otherwise a finished review is ready for workflow
  const reviewDonePhase = application.phase === ApplicationPhase.REVIEW_COMPLETE ? ApplicationPhase.REVIEW_COMPLETE : ApplicationPhase.READY_FOR_WORKFLOW
  switch (phase) {
  case 'complete':
    return ApplicationPhase.COMPLETE
  case 'nonblocking':
    if (isPresubmissionIneligible(application)) return ApplicationPhase.READY_TO_COMPLETE
    // not `settled`: that reads the aggregate resolution, where a fail outranks a pending, and here a failed requirement must never hide a pending one
    if (summary.firstPending != null || application.awaitingCorrection) return ApplicationPhase.WORKFLOW_NONBLOCKING
    return hasNonblockingWorkflowRequirements ? ApplicationPhase.READY_FOR_WORKFLOW : ApplicationPhase.READY_TO_COMPLETE
  case 'acceptance':
    return settled ? ApplicationPhase.READY_TO_ACCEPT : ApplicationPhase.ACCEPTANCE
  case 'applicant':
    if (settled) return ApplicationPhase.READY_TO_SUBMIT
    return attentionRequirement?.type === RequirementType.PREQUAL ? ApplicationPhase.PREQUAL : ApplicationPhase.QUALIFICATION
  case 'review':
    // eligible or not, there is nothing left for anyone to do on this application
    if (settled && noTrailingWork) return ApplicationPhase.COMPLETE
    if (settled) return reviewDonePhase
    if (attentionRequirement?.type === RequirementType.PREAPPROVAL) return ApplicationPhase.PREAPPROVAL
    return reviewInProgress ? ApplicationPhase.REVIEW_IN_PROGRESS : ApplicationPhase.APPROVAL
  case 'blocking':
      // a failing blocking stage holds the application in the workflow rather than sending it back
    return summary.resolution === 'pass' && !application.awaitingCorrection ? reviewDonePhase : ApplicationPhase.WORKFLOW_BLOCKING
  }
}

/** The phase a disqualification is attributed to, that of the requirement that failed, wherever the failure is noticed. */
function ineligiblePhaseForType (type: RequirementType): IneligiblePhases {
  switch (type) {
  case RequirementType.PREQUAL: return IneligiblePhases.PREQUAL
  case RequirementType.QUALIFICATION:
  case RequirementType.POSTQUAL: return IneligiblePhases.QUALIFICATION
  case RequirementType.PREAPPROVAL: return IneligiblePhases.PREAPPROVAL
  case RequirementType.APPROVAL: return IneligiblePhases.APPROVAL
  case RequirementType.WORKFLOW: return IneligiblePhases.WORKFLOW
  case RequirementType.ACCEPTANCE: return IneligiblePhases.ACCEPTANCE
  }
}

 // Where the application was disqualified. Only the phases that re-evaluate eligibility may set or clear it, and the answer comes from the first failing requirement, not from the phase doing the evaluating
function computeIneligiblePhase (phase: EvaluationPhase, summary: ResolutionSummary, current: IneligiblePhases | undefined): IneligiblePhases | undefined {
  // these phases no longer re-evaluate eligibility, so whatever was decided earlier stands
  if (phase === 'nonblocking' || phase === 'complete') return current

  if (summary.resolution !== 'fail') {
    // a non-failing result clears an earlier disqualification, except in a blocking stage, which never re-judges review eligibility
    return phase === 'blocking' ? current : undefined
  }

  switch (phase) {
  case 'blocking':
    // a blocking stage only evaluates itself, so an earlier disqualification wins over a failing workflow stage
    return current ?? IneligiblePhases.WORKFLOW
  case 'applicant':
  case 'review':
  case 'acceptance':
    // requirements are summarized in lifecycle order, so the first failure is the earliest phase that denied it
    return ineligiblePhaseForType(summary.firstFailing!.type)
  }
}

/** Requirements whose prompts may no longer be edited given where the application now stands. */
function requirementsToLock (phase: EvaluationPhase, application: Application, buckets: RequirementBuckets): ApplicationRequirement[] {
  if (application.phase === ApplicationPhase.REVIEW_COMPLETE) return buckets.review
  if (application.phase === ApplicationPhase.READY_TO_COMPLETE || application.phase === ApplicationPhase.COMPLETE) return buckets.accept
  if (phase === 'blocking') {
    // review is over and every blocking stage before the active one has been passed
    const activeStageIndex = findIndex(buckets.blockingWorkflow, r => r.workflowStageKey === application.workflowStageKey) ?? buckets.blockingWorkflow.length
    return [...buckets.review, ...buckets.blockingWorkflow.slice(0, activeStageIndex)]
  }
  // never lock non-blocking workflow requirements, once emerged they stay editable for the remainder of the lifecycle.
  if (phase === 'nonblocking') return [...buckets.review, ...buckets.blockingWorkflow, ...buckets.acceptance]
  if (phase === 'acceptance') return [...buckets.review, ...buckets.blockingWorkflow]
  return []
}

function applyPromptLocks (prompts: RequirementPrompt[], promptKeysLocked: Set<string>) {
  for (const prompt of prompts) prompt.locked = promptKeysLocked.has(prompt.key)
}

/** Roll the applications up into the request-level awaitingCorrection, status and readyToComplete. */
function rollupAppRequest (ctx: EvaluationContext, acc: RequestAccumulators) {
  const { appRequest, applications } = ctx

  appRequest.awaitingCorrection = applications.some(a => a.awaitingCorrection)
  const allDead = applications.every(a => a.status === ApplicationStatus.INELIGIBLE || a.status === ApplicationStatus.REJECTED || a.status === ApplicationStatus.RESCINDED)
  appRequest.status = allDead ? deadApplicationsStatus(ctx, acc) : liveApplicationsStatus(ctx, acc)
  appRequest.readyToComplete = appRequest.phase === AppRequestPhase.WORKFLOW_NONBLOCKING && applications.every(a => a.phase === ApplicationPhase.READY_TO_COMPLETE || a.phase === ApplicationPhase.COMPLETE)
}

/**
 * special case for single-program systems with no blocking workflow stages - the appRequest reads as REVIEW_COMPLETE so
 * the reviewers can do the appRequest-level "Complete Review" right away instead of having to advance the application first.
 */
function singleProgramReviewFinished (ctx: EvaluationContext) {
  const { applications, workflowStages } = ctx
  return applications.length === 1 && !workflowStages.filter(s => s.blocking).length && (applications[0].phase === ApplicationPhase.READY_FOR_WORKFLOW || applications[0].phase === ApplicationPhase.REVIEW_COMPLETE)
}

export function allApplicationsAutoCompleted (applications: Application[]) {
  return applications.length > 0 && applications.every(a => a.phase === ApplicationPhase.COMPLETE)
}

function autoCompletedReviewFinished (ctx: EvaluationContext) {
  const { appRequest, applications } = ctx
  return appRequest.phase === AppRequestPhase.SUBMITTED && !appRequest.awaitingCorrection
    && applications.some(a => a.phase === ApplicationPhase.COMPLETE)
    && applications.every(a => a.phase === ApplicationPhase.COMPLETE || a.phase === ApplicationPhase.REVIEW_COMPLETE || isPresubmissionIneligible(a))
}

/** Request status when every application is INELIGIBLE, REJECTED or RESCINDED. */
function deadApplicationsStatus (ctx: EvaluationContext, acc: RequestAccumulators): AppRequestStatus {
  const { appRequest, applications } = ctx
  if (appRequest.phase === AppRequestPhase.SUBMITTED) {
    if (appRequest.awaitingCorrection) return AppRequestStatus.APPROVAL
    if (singleProgramReviewFinished(ctx)) return AppRequestStatus.REVIEW_COMPLETE
    if (autoCompletedReviewFinished(ctx)) return AppRequestStatus.REVIEW_COMPLETE
    if (applications.every(a => a.phase === ApplicationPhase.REVIEW_COMPLETE || isPresubmissionIneligible(a))) return AppRequestStatus.REVIEW_COMPLETE
    return acc.reviewStartedApplicationIds.size ? AppRequestStatus.REVIEW_IN_PROGRESS : AppRequestStatus.APPROVAL
  }
  if (applications.some(a => a.ineligiblePhase === IneligiblePhases.ACCEPTANCE)) return AppRequestStatus.NOT_ACCEPTED
  if (applications.some(a => a.ineligiblePhase === IneligiblePhases.APPROVAL || a.ineligiblePhase === IneligiblePhases.WORKFLOW)) return AppRequestStatus.NOT_APPROVED
  if (applications.some(a => a.status === ApplicationStatus.RESCINDED)) return AppRequestStatus.NOT_APPROVED
  return AppRequestStatus.DISQUALIFIED
}

/**
 * Request status when at least one application is still live. The order of these checks is the semantics: each earlier condition deliberately trumps the ones below it.
 */
function liveApplicationsStatus (ctx: EvaluationContext, acc: RequestAccumulators): AppRequestStatus {
  const { appRequest, applications } = ctx
  const anyPending = applications.some(a => a.status === ApplicationStatus.PENDING)
  if (applications.some(a => a.phase === ApplicationPhase.READY_TO_SUBMIT) && !anyPending && !appRequest.awaitingCorrection) return AppRequestStatus.READY_TO_SUBMIT
  if (appRequest.phase === AppRequestPhase.SUBMITTED && singleProgramReviewFinished(ctx) && !appRequest.awaitingCorrection) return AppRequestStatus.REVIEW_COMPLETE
  if (autoCompletedReviewFinished(ctx)) return AppRequestStatus.REVIEW_COMPLETE
  // once a reviewer has begun their work on any application, the whole request reads as in-progress so this trumps review-phase statuses
  if (applications.some(a => a.phase === ApplicationPhase.REVIEW_IN_PROGRESS)) return AppRequestStatus.REVIEW_IN_PROGRESS
  // exclude prequal and qual ineligible applications from affecting AppRequestStatus, since they never require approval to the next step and we don't want them blocking the appRequest from moving forward
  // a reviewer who has answered everything or reversed a workflow back into review is mid-review, not awaiting review
  if (appRequest.phase === AppRequestPhase.SUBMITTED && applications.filter(a => a.status !== ApplicationStatus.INELIGIBLE || (a.ineligiblePhase && [IneligiblePhases.APPROVAL].includes(a.ineligiblePhase))).some(a => a.phase === ApplicationPhase.READY_FOR_WORKFLOW)) return acc.reviewStartedApplicationIds.size ? AppRequestStatus.REVIEW_IN_PROGRESS : AppRequestStatus.APPROVAL
  if (applications.some(a => a.phase === ApplicationPhase.REVIEW_COMPLETE) && !anyPending && !appRequest.awaitingCorrection) return AppRequestStatus.REVIEW_COMPLETE
  if (applications.some(a => a.phase === ApplicationPhase.READY_TO_ACCEPT) && !anyPending && !appRequest.awaitingCorrection) return AppRequestStatus.READY_TO_ACCEPT
  if (applications.some(a => a.phase === ApplicationPhase.ACCEPTANCE)) return AppRequestStatus.ACCEPTANCE
  if (applications.some(a => a.phase === ApplicationPhase.PREAPPROVAL)) return AppRequestStatus.PREAPPROVAL
  if (applications.some(a => a.phase === ApplicationPhase.WORKFLOW_BLOCKING)) return AppRequestStatus.APPROVAL
  if (applications.some(a => a.phase === ApplicationPhase.APPROVAL)) return AppRequestStatus.APPROVAL
  const anyAccepted = applications.some(a => a.status === ApplicationStatus.ACCEPTED)
  if (applications.some(a => a.phase === ApplicationPhase.WORKFLOW_NONBLOCKING || a.phase === ApplicationPhase.READY_FOR_WORKFLOW)) return anyAccepted ? AppRequestStatus.ACCEPTED : AppRequestStatus.APPROVED
  if (applications.every(a => a.phase === ApplicationPhase.COMPLETE || a.phase === ApplicationPhase.READY_TO_COMPLETE)) return anyAccepted ? AppRequestStatus.ACCEPTED : AppRequestStatus.APPROVED
  return AppRequestStatus.STARTED
}

/** save the results of the evaluation to the database, writing only the rows whose computed columns changed */
async function persistEvaluation (ctx: EvaluationContext, db: Queryable) {
  await updateAppRequestComputed(ctx.appRequest, db)
  await updateApplicationsComputed(changedSinceLoad(ctx.applications, applicationComputedRow, ctx.baseline.applications), db)
  await updateRequirementComputed(changedSinceLoad(ctx.requirements, requirementComputedRow, ctx.baseline.requirements), db)
  await updatePromptComputed(changedSinceLoad(ctx.prompts, promptComputedRow, ctx.baseline.prompts), db)
}
