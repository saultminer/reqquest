import { AppRequest, AppRequestPhase, appRequestPhaseOrder, appRequestPhaseReached, assertNoKeyCollisions, assertNoProgramTitleCollisions, requirementRegistry } from '../internal.js'
import type { RequirementKey } from './keys.js'

export interface ProgramDefinition {
  /**
   * A globally unique, human and machine readable key. Use lowercase snake_case, alphanumeric and
   * underscore only.
   *
   * You may omit this when you hand your programs to `RQServer.start` as a keyed object, in which
   * case the name the program is registered under becomes its key:
   *
   * ```ts
   * const adopt_a_dog_program: ProgramDefinition = { title: '...', requirementKeys: [...] }
   * export const programs = { adopt_a_dog_program, adopt_a_cat_program }
   * ```
   *
   * Note that programs must be handed over as an **ordered object literal**, never as a module
   * (`import * as programs`). A module namespace iterates its keys alphabetically rather than in
   * declaration order, and program order is meaningful - it is persisted as
   * `applications.evaluationOrder`. `RQServer.start` rejects a namespace here for that reason.
   *
   * BEWARE that the key is persisted and is what the UI registers components against. When the key
   * comes from the name, renaming that name renames the key along with it. Set `key` explicitly
   * whenever a key needs to outlive a rename.
   */
  key?: string
  /**
   * The name of the program.
   *
   * This is the default. Administrators may override it for a single period on the period
   * configuration screen without touching the key, and each app request shows the name from its own
   * period. Overrides lock along with the rest of the period's configuration once it has app requests.
   *
   * Code that reads `title` from the definition gets this default. For the name in a given period, use
   * `Application.title` or `PeriodProgram.title`, which apply the override.
   */
  title: string
  /**
   * Display title for the program in the navigation. You probably want it to be shorter than
   * the full title. If not provided, the title will be used.
   *
   * Like `title`, it can be overridden per period. When only the title is overridden, the overriding
   * title is used here too, so the old short name does not linger in navigation.
   */
  navTitle?: string
  /**
   * A brief description of the program, written for applicants. Shown in applicant-facing
   * screens where the program title alone doesn't carry enough context, such as the tooltip
   * on the applicant's program review screen.
   */
  applicantDescription?: string
  /**
   * When an applicant is disqualified from a program before submitting, all they see by
   * default is the statusReason from the first requirement that failed - something like
   * "Applicant must be under 21". They may never have seen the program's own prompts, so
   * they have no sense of what the program is or what else it would have asked of them.
   * Provide a prose summary of the applicant-side requirements here and it will be shown
   * alongside the failing reason wherever the program is listed as ineligible pre-submission
   * (currently the "Ineligible benefits" panel).
   *
   * Keep it general rather than quoting specific configuration values - configuration can
   * change each period and this description will not, so a quoted value could silently
   * contradict the actual requirement.
   */
  eligibilityDescription?: string
  /**
   * Set to false to hide this program wherever an applicant was screened out of it before submitting.
   * Useful when there are many programs and most applicants qualify for only a few: reviewers are not
   * shown dozens of programs nobody needs to look at. Defaults to true.
   *
   * An application is hidden while all of these hold:
   * - it is ineligible because of an applicant requirement (PREQUAL, QUALIFICATION or POSTQUAL)
   * - that ineligibility is pre-submission: the request has not been submitted yet, or the application
   *   was already ineligible at the moment it was submitted
   *
   * An application disqualified by a reviewer after submission (for instance by editing an applicant's
   * answer) is never hidden, so the reviewer can still see and undo it. An application that becomes
   * eligible again is shown again immediately.
   *
   * Hiding is read-path only - evaluation and the app request's status are unaffected. Reviewers and other
   * non-owners never receive hidden applications from the API. The applicant does, flagged with
   * `hiddenIneligiblePreSubmit`, because their prompt navigation is built from every application and they
   * must still be able to change the answer that disqualified them. The UI leaves the program out of the
   * applicant's program lists, except a program the applicant opted out of, which stays listed since that is
   * the only place they can opt back in.
   */
  showIneligiblePreSubmit?: boolean
  /**
   * The list of requirements for this program, carefully ordered so that
   * the users are presented them in a logical order.
   *
   * This order is the applicant's order: it is persisted as `application_requirements.evaluationOrder`,
   * it decides which requirement's first prompt the applicant sees next, and which failing
   * requirement's reason they are shown. On the reviewer screen it only decides the order *within*
   * each panel - requirements are grouped into panels by type there, so a reviewer requirement listed
   * between two applicant requirements is NOT shown between them. Use `reviewSections` on the UI's
   * `ProgramDefinition` (`@reqquest/ui`) for that - the layout is pure presentation and lives there.
   */
  requirementKeys: RequirementKey[]
  /**
   * Add one or more workflow stages for this program. A workflow stage is a set of requirements and prompts
   * intended to audit the review process. The audit workflow needs to be completed regardless of whether the
   * application is found to be eligible or ineligible, since ineligible applications should still be audited
   * for correctness of process. If no workflow stages are specified, the program will not have
   * an auditing workflow.
   */
  workflowStages?: WorkflowStage[]
}

export interface WorkflowStage {
  /**
   * Give each workflow stage a unique, permanent key so that we can refer to it in the database
   * even if the workflow stages are reordered. It is stored in `applications.workflowStage`,
   * `period_workflow_stages.workflowStageKey`, and `application_requirements.workflowStage`, so it
   * has to stay stable across releases.
   *
   * Required, deliberately - unlike `PromptDefinition`, `RequirementDefinition` and
   * `ProgramDefinition`, which default their key to the name they are registered under. Stages are a
   * different shape and none of that machinery fits them.
   */
  key: string
  /**
   * By default workflow stages are blocking, meaning that the application status remains
   * PENDING until the stage is completed. Further, this means that the applicant is not notified
   * of the application status until the workflow is complete and failing a requirement in this
   * workflow stage will result in the application being disqualified.
   *
   * If this is set to true, the stage is non-blocking, meaning that the application status
   * will resolve to ELIGIBLE or INELIGIBLE regardless of this stage's completion. In fact, the
   * request can be approved and offered to the applicant without this stage being completed. This
   * is useful for stages that are purely for out-of-band auditing, such as to identify process
   * improvements or training opportunities.
   *
   * Non-blocking does not mean optional. The request cannot reach COMPLETE until every non-blocking
   * requirement on every application has resolved to something other than PENDING, and that includes
   * applications denied during review, blocking workflow, or acceptance - the audit of the reviewer's
   * work is needed whether or not the applicant was approved. The one exception is an application
   * screened out before submission (a PREQUAL or QUALIFICATION requirement failed): no reviewer ever
   * touched it, so it skips non-blocking workflow entirely. If a stage genuinely does not apply to a
   * denied application, have its requirement return NOT_APPLICABLE rather than leaving it PENDING, or
   * the request will never complete.
   */
  nonBlocking?: boolean
  /**
   * For workflows that are set nonBlocking: true, this property identifies in what AppRequestPhase
   * these workflow requirements first become visible/editable.  Once visible these workflows remain visible
   * for the remainder of the AppRequest lifecycle, and editable until `nonBlockingSunset` (if any) is
   * reached or their program is marked complete. Defaults to WORKFLOW_NONBLOCKING,
   * which preserves the legacy behavior of only surfacing non-blocking workflow requirements once the
   * request reaches the WORKFLOW_NONBLOCKING phase.
   */
  nonBlockingEmergence?: AppRequestPhase.STARTED | AppRequestPhase.SUBMITTED | AppRequestPhase.ACCEPTANCE | AppRequestPhase.WORKFLOW_NONBLOCKING
  /**
   * For workflows that are set nonBlocking: true, this closes the stage early: it identifies the
   * AppRequestPhase at which this stage's prompts stop being editable. It is the opposite of
   * `nonBlockingEmergence`. Once the request reaches this phase, nobody can edit the stage's prompts
   * any more - not even with `update_anytime` - though the stage and its answers stay visible.
   *
   * Every non-blocking stage is locked anyway once a reviewer marks its program complete, and so
   * once the request is COMPLETE, which is why COMPLETE is not an option here. Leave this unset and
   * the stage simply stays editable until then.
   *
   * It must come after the emergence phase, or the stage would never be editable; that is checked
   * at startup. A stage with no `nonBlockingEmergence` emerges at WORKFLOW_NONBLOCKING, the last
   * phase a sunset may name, so it cannot have a sunset at all - give it an earlier emergence first.
   *
   * The sunset only stops edits. It does not change evaluation: a requirement still PENDING when
   * its stage sunsets keeps holding the request back from COMPLETE, exactly as described under
   * `nonBlocking`. Moving the request back to a phase before the sunset makes the stage editable
   * again. A program whose non-blocking stages have all sunset has nothing left for a reviewer to
   * change, so it completes on its own instead of waiting to be marked complete, and cannot be
   * reopened.
   */
  nonBlockingSunset?: AppRequestPhase.SUBMITTED | AppRequestPhase.ACCEPTANCE | AppRequestPhase.WORKFLOW_NONBLOCKING
  /**
   * The title of the stage, displayed to the user.
   */
  title: string
  /**
   * The list of requirement keys that must be met to complete this stage.
   */
  requirementKeys: RequirementKey[]
}

/**
 * Refuse to start with a stage whose emergence/sunset settings could never do what they say. The
 * union types on the interface already limit each setting to phases that make sense on their own;
 * this checks them against each other and against `nonBlocking`.
 */
function assertValidNonBlockingWindow (programKey: string, stage: WorkflowStage) {
  const where = `Workflow stage '${stage.key}' in program '${programKey}'`
  if (!stage.nonBlocking) {
    if (stage.nonBlockingEmergence != null) throw new Error(`${where} sets nonBlockingEmergence but is not nonBlocking: true. Emergence only applies to non-blocking stages.`)
    if (stage.nonBlockingSunset != null) throw new Error(`${where} sets nonBlockingSunset but is not nonBlocking: true. Sunset only applies to non-blocking stages.`)
    return
  }
  if (stage.nonBlockingSunset == null) return
  if ((stage.nonBlockingSunset as AppRequestPhase) === AppRequestPhase.COMPLETE) throw new Error(`${where} has nonBlockingSunset COMPLETE. That is not needed: a non-blocking stage is always locked once its program is marked complete. Remove nonBlockingSunset.`)
  const emergence = stage.nonBlockingEmergence ?? AppRequestPhase.WORKFLOW_NONBLOCKING
  if (appRequestPhaseOrder.indexOf(stage.nonBlockingSunset) <= appRequestPhaseOrder.indexOf(emergence)) {
    if (stage.nonBlockingEmergence == null) throw new Error(`${where} has nonBlockingSunset ${stage.nonBlockingSunset} but no nonBlockingEmergence, so it emerges at ${emergence} (the default) and would never be editable. Remove nonBlockingSunset, or set an earlier nonBlockingEmergence.`)
    throw new Error(`${where} has nonBlockingSunset ${stage.nonBlockingSunset}, which is not after its emergence phase ${emergence}. The stage would never be editable. Phases in order: ${appRequestPhaseOrder.join(', ')}.`)
  }
}

export function nonBlockingSunsetReached (stage: WorkflowStage | undefined, phase: AppRequestPhase) {
  return stage?.nonBlockingSunset != null && appRequestPhaseReached(phase, stage.nonBlockingSunset)
}

/**
 * A program definition after registration, when its key - either the one it declared or the name it
 * was registered under - has been resolved and stamped onto it.
 */
export interface ProgramDefinitionProcessed extends ProgramDefinition {
  key: string
}

export class ProgramRegistry {
  private programs: Record<string, ProgramDefinitionProcessed> = {}
  private programList: ProgramDefinitionProcessed[] = []
  private activeList: ProgramDefinitionProcessed[] = []
  public workflowStagesByKey: Record<string, WorkflowStage> = {}
  public allRequirementKeys: Record<string, Set<string>> = {}
  public workflowStageByProgramAndRequirementKey: Record<string, Record<string, WorkflowStage | undefined>> = {}
  /**
   * Requirement keys that more than one program uses, set by `finalize`. Only these can reuse a
   * `resolve` result across programs, so evaluation skips the resolve cache for everything else.
   * Built from the definitions, so a requirement shared here may be used by a single program in a
   * period that disables the others; it still goes through the cache, which is correct, just a miss.
   */
  public sharedRequirementKeys = new Set<string>()

  /**
   * `registeredName` is the name the definition was handed over under - its property name in the
   * ordered object passed to `RQServer.start`. It becomes the program's key unless the definition
   * carries an explicit one.
   */
  public register (program: ProgramDefinition, active: boolean, registeredName?: string) {
    const key = program.key ?? registeredName
    if (key == null) throw new Error('Registered a program with no key. Either set `key` on the definition, or pass your programs to RQServer.start as an ordered object literal (e.g. `programs: myPrograms`) so the name each is declared under can be used.')
    const processed = program as ProgramDefinitionProcessed
    processed.key = key
    this.programs[key] = processed
    this.programList.push(processed)
    if (active) this.activeList.push(processed)
    for (const requirementKey of program.requirementKeys) {
      this.allRequirementKeys[key] ??= new Set()
      this.allRequirementKeys[key].add(requirementKey)
    }
    for (const stage of program.workflowStages ?? []) {
      for (const requirementKey of stage.requirementKeys) {
        this.allRequirementKeys[key] ??= new Set()
        this.allRequirementKeys[key].add(requirementKey)
      }
    }
  }

  public get (key: string): ProgramDefinitionProcessed {
    return this.programs[key]
  }

  public list (): ProgramDefinitionProcessed[] {
    return this.programList
  }

  public finalize () {
    assertNoKeyCollisions()
    for (const program of this.programList) {
      program.navTitle ??= program.title
      program.showIneligiblePreSubmit ??= true
      for (const stage of program.workflowStages ?? []) {
        assertValidNonBlockingWindow(program.key, stage)
        this.workflowStagesByKey[stage.key] = stage
        for (const requirementKey of stage.requirementKeys) {
          this.workflowStageByProgramAndRequirementKey[program.key] ??= {}
          this.workflowStageByProgramAndRequirementKey[program.key][requirementKey] = stage
        }
      }
    }
    const seenRequirementKeys = new Set<string>()
    for (const requirementKeys of Object.values(this.allRequirementKeys)) {
      for (const requirementKey of requirementKeys) {
        if (seenRequirementKeys.has(requirementKey)) this.sharedRequirementKeys.add(requirementKey)
        else seenRequirementKeys.add(requirementKey)
      }
    }
    assertNoProgramTitleCollisions()
    requirementRegistry.finalize()
  }

  public get reachable () {
    return this.activeList
  }

  public keys () {
    return Object.keys(this.programs)
  }

  public getWorkflowStageByKey (key: string | undefined) {
    return key ? this.workflowStagesByKey[key] : undefined
  }

  public getWorkflowStageByProgramAndRequirementKey (programKey: string, requirementKey: string) {
    return this.workflowStageByProgramAndRequirementKey[programKey]?.[requirementKey]
  }
}
export const programRegistry = new ProgramRegistry()
