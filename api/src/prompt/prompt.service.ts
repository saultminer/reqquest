import { BaseService } from '@txstate-mws/graphql-server'
import { OneToManyLoader, PrimaryKeyLoader } from 'dataloader-factory'
import { equal, Cache } from 'txstate-utils'
import {
  AppRequestService, ApplicationRequirement, AuthService, Prompt, RequirementPrompt, promptRegistry,
  getRequirementPrompts, ValidatedAppRequestResponse, getPeriodPrompts, PeriodPrompt,
  requirementRegistry, AppRequestStatusDB, AppRequest, updateAppRequestData, getAppRequests,
  getAppRequestData, appRequestTransaction, recordAppRequestActivity, appConfig, AppRequestData,
  AppRequestStatus, ApplicationPhase, ApplicationService, setRequirementPromptsInvalid,
  AppRequestServiceInternal, AppRequestPhase, appRequestPhaseReached, nonBlockingSunsetReached, RequirementType, periodConfigCache, programRegistry, resolveProgramLabels,
  statusVisibleToApplicant, applicantRequirementTypes, setRequirementPromptsValid,
  RQContext,
  RequirementPromptFilter,
  PromptPreStagingRecurrence,
  PromptPrestagePackage,
  PromptPrestageServerData,
  PromptPrestageClientData,
  PromptPrestageDataNodes,
  PROMPT_PRESTAGE_NS,
  PreviousRequestService,
  previewAppRequestEvaluation,
  ApplicationRequirementService,
  PromptStatusReason,
  PromptVisibility,
  type Application
} from '../internal.js'
import { DEFAULT_EXPIRY, SignedPackage, signJsonPackage, verifySignedJsonPackage } from '../util/crypto/hmac.js'

/**
 * What each requirement has to say about one prompt, in the shape `updatePrompt` returns it.
 *
 * A requirement that named answers in its `blame` speaks only about the prompts it named; one that
 * named nothing speaks about every prompt of its own that is currently reachable. This is the same
 * rule the UI applies when it builds each prompt's status reasons from a loaded request.
 *
 * `requirements` must already be filtered and redacted for the viewer.
 */
export function promptStatusReasons (promptKey: string, applications: Pick<Application, 'internalId' | 'title'>[], requirements: ApplicationRequirement[], prompts: RequirementPrompt[]): PromptStatusReason[] {
  const programNames = new Map(applications.map(a => [a.internalId, a.title]))
  const reachable = new Set(prompts.filter(p => p.key === promptKey && p.visibility !== PromptVisibility.UNREACHABLE).map(p => p.requirementInternalId))
  const reasons: PromptStatusReason[] = []
  for (const requirement of requirements) {
    const programName = programNames.get(requirement.applicationInternalId)
    if (programName == null) continue
    const blamed = !!requirement.blameFields?.length
    const entries = requirement.blameFields?.filter(b => b.promptKey === promptKey) ?? []
    if (blamed ? !entries.length : !reachable.has(requirement.internalId)) continue
    reasons.push({
      status: requirement.status,
      statusReason: requirement.statusReason,
      programName,
      blamed,
      fieldReasons: entries.filter(b => b.fields?.length).map(b => ({ fields: b.fields!, message: b.message, status: b.status }))
    })
  }
  return reasons
}

const byInternalIdLoader = new PrimaryKeyLoader({
  fetch: async (ids: number[]) => {
    return await getRequirementPrompts({ ids: ids.map(String) })
  },
  extractId: (row: RequirementPrompt) => row.internalId
})

const byRequirementIdLoader = new OneToManyLoader({
  fetch: async (requirementIds: string[], filters?: RequirementPromptFilter) => {
    return await getRequirementPrompts({ ...filters, requirementIds })
  },
  extractKey: row => row.requirementId,
  idLoader: byInternalIdLoader
})

const byAppRequestInternalIdLoader = new OneToManyLoader({
  fetch: async (appRequestIds: string[], filters?: RequirementPromptFilter) => {
    return await getRequirementPrompts({ ...filters, appRequestIds })
  },
  extractKey: (row: RequirementPrompt) => row.appRequestId,
  idLoader: [byInternalIdLoader]
})

const periodPromptByPeriodIdAndPromptKeyLoader = new PrimaryKeyLoader({
  fetch: async (periodPromptKeys: { periodId: string, promptKey: string }[]) => {
    return await getPeriodPrompts({ periodPromptKeys })
  },
  extractId: row => ({ periodId: row.periodId, promptKey: row.key })
})

const periodPromptByPeroidIdLoader = new OneToManyLoader({
  fetch: async (periodIds: string[]) => {
    return await getPeriodPrompts({ periodIds })
  },
  extractKey: row => row.periodId,
  idLoader: periodPromptByPeriodIdAndPromptKeyLoader
})

const preSubmitTypes = new Set<RequirementType>([
  RequirementType.PREQUAL,
  RequirementType.QUALIFICATION,
  RequirementType.POSTQUAL
])

const reviewTypes = new Set<RequirementType>([
  RequirementType.APPROVAL,
  RequirementType.PREAPPROVAL
])

export class PromptService extends AuthService<Prompt> {
  async find () {
    return promptRegistry.list().map(prompt => new Prompt(prompt))
  }

  protected mayView (prompt: Prompt): boolean {
    return true
  }
}

export class RequirementPromptServiceInternal extends BaseService<RequirementPrompt> {
  async findByInternalId (internalId: number) {
    const prompt = await this.loaders.get(byInternalIdLoader).load(internalId)
    if (prompt) prompt.appRequestTags = await this.svc(AppRequestService).getTags(prompt.appRequestId)
    return prompt
  }

  async findById (id: string) {
    return await this.findByInternalId(Number(id))
  }

  async findByAppRequest (appRequest: AppRequest, filters?: RequirementPromptFilter) {
    const prompts = await this.loaders.get(byAppRequestInternalIdLoader, filters).load(appRequest.id)
    for (const prompt of prompts) prompt.appRequestTags = appRequest.tags
    return prompts
  }

  async findByApplicationRequirement (requirement: ApplicationRequirement, filters?: RequirementPromptFilter) {
    const prompts = await this.loaders.get(byRequirementIdLoader, filters).load(requirement.id)
    for (const prompt of prompts) prompt.appRequestTags = requirement.appRequestTags
    return prompts
  }
}

export class RequirementPromptService extends AuthService<RequirementPrompt> {
  raw = this.svc(RequirementPromptServiceInternal)

  async findByInternalId (internalId: number) {
    const prompt = await this.raw.findByInternalId(internalId)
    return this.removeUnauthorized(prompt)
  }

  async findById (id: string) {
    return await this.findByInternalId(Number(id))
  }

  async findByAppRequest (appRequest: AppRequest, filters?: RequirementPromptFilter) {
    const prompts = await this.raw.findByAppRequest(appRequest, filters)
    return this.removeUnauthorized(prompts)
  }

  async findByApplicationRequirement (requirement: ApplicationRequirement, filters?: RequirementPromptFilter) {
    const prompts = await this.raw.findByApplicationRequirement(requirement, filters)
    return this.removeUnauthorized(prompts)
  }

  async hasSavedData (requirementPrompt: RequirementPrompt) {
    const data = await this.svc(AppRequestServiceInternal).getData(requirementPrompt.appRequestInternalId)
    return data[requirementPrompt.key] != null
  }

  async getPreloadData (requirementPrompt: RequirementPrompt) {
    const [appRequest, allPeriodConfig, data] = await this.getRequirementPromptSupportDetail(requirementPrompt)
    const config = allPeriodConfig[requirementPrompt.key] ?? {}
    if (!appRequest) throw new Error('AppRequest not found')
    if (requirementPrompt.definition.preload != null) {
      const preloadData = await requirementPrompt.definition.preload(appRequest, config, data, allPeriodConfig, this.ctx, this.svc(PreviousRequestService).selector(appRequest, requirementPrompt.key))
      const mergedData = (data[requirementPrompt.key] != null) ? { ...preloadData, ...data[requirementPrompt.key] } : preloadData
      return mergedData
    }
    return data[requirementPrompt.key]
  }

  async getFetchData (requirementPrompt: RequirementPrompt) {
    const [appRequest, allPeriodConfig, data] = await this.getRequirementPromptSupportDetail(requirementPrompt)
    const config = allPeriodConfig[requirementPrompt.key] ?? {}
    if (!appRequest) throw new Error('AppRequest not found')
    if (requirementPrompt.definition.fetch != null) {
      return requirementPrompt.definition.fetch(appRequest, config, data, allPeriodConfig, this.ctx, this.svc(PreviousRequestService).selector(appRequest, requirementPrompt.key))
    }
  }

  async getConfigData (requirementPrompt: RequirementPrompt) {
    const allPeriodConfig = await periodConfigCache.get(requirementPrompt.periodId)
    return allPeriodConfig[requirementPrompt.key]
  }

  async getGatheredConfigData (requirementPrompt: RequirementPrompt) {
    const allPeriodConfig = await periodConfigCache.get(requirementPrompt.periodId)
    const gatherConfig = promptRegistry.get(requirementPrompt.key)?.gatherConfig ?? promptRegistry.get(requirementPrompt.key)?.gatherConfigForApplicant
    return (this.mayViewUnredacted(requirementPrompt) ? gatherConfig?.(allPeriodConfig) : promptRegistry.get(requirementPrompt.key)?.gatherConfigForApplicant?.(allPeriodConfig)) ?? {}
  }

  async getRequirementPromptSupportDetail (requirementPrompt: RequirementPrompt) {
    return await Promise.all([
      this.svc(AppRequestServiceInternal).findByInternalId(requirementPrompt.appRequestInternalId), // appRequest
      periodConfigCache.get(requirementPrompt.periodId), // allPeriodConfig
      this.svc(AppRequestServiceInternal).getData(requirementPrompt.appRequestInternalId) // appRequestData
    ])
  }

  async getPrestage (requirementPrompt: RequirementPrompt) {
    const [appRequest, allPeriodConfig] = await this.getRequirementPromptSupportDetail(requirementPrompt)
    if (!appRequest) throw new Error('AppRequest not found')
    if (await this.requiresPrestaging(requirementPrompt)) {
      const config = allPeriodConfig[requirementPrompt.key] ?? {}
      const fetch = ('fetch' in requirementPrompt.definition.prestage!) ? requirementPrompt.definition.prestage.fetch : requirementPrompt.definition.prestage
      const prestageData = await fetch!(appRequest, config, allPeriodConfig, this.ctx, this.svc(PreviousRequestService).selector(appRequest, requirementPrompt.key))
      return this.signPrestageData(appRequest.internalId, requirementPrompt.key, prestageData, appRequest.dataVersion)
    }
  }

  async requiresPrestaging (requirementPrompt: RequirementPrompt) {
    if (requirementPrompt.definition.prestage != null) {
      const data = await this.svc(AppRequestServiceInternal).getData(requirementPrompt.appRequestInternalId)
      const recur = ('recur' in requirementPrompt.definition.prestage) ? requirementPrompt.definition.prestage.recur : false
      if (data[requirementPrompt.key]?.[PROMPT_PRESTAGE_NS] == null) return true // first occurence should always run no matter the recur setting, since there is no existing prestageData
      if (recur === true || recur === PromptPreStagingRecurrence.ALWAYS) return true
      if (recur === PromptPreStagingRecurrence.INVALID && requirementPrompt.invalidated) return true
    }
    return false
  }

  signPrestageData (appRequestId: number, promptKey: string, data: any, dataVersion: number): PromptPrestagePackage {
    const server = new PromptPrestageServerData(appRequestId, promptKey)
    const client = new PromptPrestageClientData(data, dataVersion)
    const prestageDataNodes: PromptPrestageDataNodes = { server, client }
    const { signature } = signJsonPackage(prestageDataNodes, process.env.PROMPT_SIGNING_KEY!)
    return { signature, nodes: { client } } // only send client node data, not server node specific info
  }

  async verifyPrestageData (appRequestId: number, promptKey: string, pkg: PromptPrestagePackage, dataVersion?: number) {
    const server = new PromptPrestageServerData(appRequestId, promptKey) // returned package will not have server data, so need to append to validate sig
    const signedPackage = { signature: pkg.signature, data: { server, client: pkg.nodes.client } }
    if (verifySignedJsonPackage(signedPackage, process.env.PROMPT_SIGNING_KEY!)) { // confirms it's a valid signed package, but doesn't check expiry or data version since could be current (stored) or latest
      const data = await this.svc(AppRequestServiceInternal).getData(appRequestId)
      if (data[promptKey]?.[PROMPT_PRESTAGE_NS] && data[promptKey][PROMPT_PRESTAGE_NS].signature === pkg.signature) return true // stored signed package so no expiry or data version check required
      return ((pkg.nodes.client.__exp > Math.floor(Date.now() / 1000)) && ((dataVersion) ? pkg.nodes.client.__dv === dataVersion : true)) // if we are here, means we are checking latest, so ensure expiry and data versions are valid
    }
    return false
  }

  isOwn (prompt: RequirementPrompt): boolean {
    return prompt.userInternalId === this.user?.internalId
  }

  mayView (prompt: RequirementPrompt): boolean {
    return this.mayViewUnredacted(prompt) || (
      this.isOwn(prompt)
      && prompt.definition.exposeToApplicant != null
      && prompt.appRequestDbPhase !== AppRequestPhase.SUBMITTED
    )
  }

  mayViewAsReviewer (prompt: RequirementPrompt) {
    if (this.isOwn(prompt) && !this.hasControl('AppRequest', 'review_own', prompt.appRequestTags)) return false
    return this.hasControl('PromptAnswer', 'view', { ...prompt.authorizationKeys, ...prompt.appRequestTags })
  }

  mayViewUnredacted (prompt: RequirementPrompt) {
    if (this.isOwn(prompt) && promptRegistry.isUserPrompt(prompt.key)) return true
    return this.mayViewAsReviewer(prompt)
  }

  mayViewForApplicant (prompt: RequirementPrompt) {
    return promptRegistry.isUserPrompt(prompt.key) || (prompt.definition.exposeToApplicant != null && prompt.appRequestDbPhase !== AppRequestPhase.SUBMITTED)
  }

  /**
   * true when this prompt row hangs off a requirement that listed it in promptKeysNoDisplay. The
   * applicant is never shown such a prompt, so should not answer it either, even
   * though the requirement it belongs to is one of their own.
   */
  isNoDisplay (prompt: RequirementPrompt) {
    return requirementRegistry.get(prompt.requirementKey)?.noDisplayPromptKeySet.has(prompt.key) ?? false
  }

  mayUpdate (prompt: RequirementPrompt): boolean {
    if (prompt.appRequestDbStatus !== AppRequestStatusDB.OPEN) return false
    if (prompt.locked) return false
    if (this.isOwn(prompt)) {
      if (!this.isNoDisplay(prompt)) {
        if (prompt.appRequestDbPhase === AppRequestPhase.STARTED && preSubmitTypes.has(prompt.requirementType)) return true
        if (prompt.appRequestDbPhase === AppRequestPhase.ACCEPTANCE && prompt.requirementType === RequirementType.ACCEPTANCE) return true
      }
      if (!this.hasControl('AppRequest', 'review_own', prompt.appRequestTags)) return false
    }
    const hasUpdate = this.hasControl('PromptAnswer', 'update', { ...prompt.authorizationKeys, ...prompt.appRequestTags })
    const hasUpdateAnytime = this.hasControl('PromptAnswer', 'update_anytime', { ...prompt.authorizationKeys, ...prompt.appRequestTags })
    // non-blocking workflow stages are editable from their emergence phase until their sunset phase or until their program is marked complete, whichever comes first
    if (prompt.requirementType === RequirementType.WORKFLOW) {
      const stage = programRegistry.getWorkflowStageByKey(prompt.workflowStage)
      if (stage?.nonBlocking) {
        if (nonBlockingSunsetReached(stage, prompt.appRequestDbPhase)) return false
        if (prompt.applicationPhase === ApplicationPhase.COMPLETE) return false
        const emergence = stage.nonBlockingEmergence ?? AppRequestPhase.WORKFLOW_NONBLOCKING
        if (appRequestPhaseReached(prompt.appRequestDbPhase, emergence)) return hasUpdate || hasUpdateAnytime
      }
    }
    if (prompt.appRequestDbPhase === AppRequestPhase.SUBMITTED) {
      if (prompt.requirementType === RequirementType.WORKFLOW) {
        if (prompt.workflowStage === prompt.applicationWorkflowStage) {
          return hasUpdate || hasUpdateAnytime
        }
      } else if (preSubmitTypes.has(prompt.requirementType) || reviewTypes.has(prompt.requirementType)) {
        if (prompt.applicationPhase !== ApplicationPhase.REVIEW_COMPLETE) return hasUpdate || hasUpdateAnytime
      }
    } else if (prompt.appRequestDbPhase === AppRequestPhase.ACCEPTANCE) {
      if (prompt.requirementType === RequirementType.ACCEPTANCE) {
        return hasUpdate || hasUpdateAnytime
      }
    } else if (prompt.appRequestDbPhase === AppRequestPhase.STARTED) {
      if (preSubmitTypes.has(prompt.requirementType)) {
        return hasUpdateAnytime
      }
    } else if (prompt.appRequestDbPhase === AppRequestPhase.WORKFLOW_NONBLOCKING) {
      if (prompt.workflowStage === prompt.applicationWorkflowStage) {
        return hasUpdate || hasUpdateAnytime
      }
    }
    return false
  }

  removeProperties (prompt: RequirementPrompt) {
    if (this.mayViewAsReviewer(prompt)) return prompt
    if (statusVisibleToApplicant(prompt.applicationPhase, prompt.appRequestDbPhase) && applicantRequirementTypes.has(prompt.requirementType)) return prompt
    const newPrompt = RequirementPrompt.clone(prompt)
    newPrompt.invalidated = false
    newPrompt.invalidatedReason = undefined
    return newPrompt
  }

  async update (prompt: RequirementPrompt, data: any, validateOnly = false, dataVersion?: number, overrideInvalidated?: boolean) {
    data ??= {}
    if (!this.mayUpdate(prompt)) throw new Error('You are not allowed to update this prompt.')
    if ((PROMPT_PRESTAGE_NS in data) && !await this.verifyPrestageData(prompt.appRequestInternalId, prompt.key, data[PROMPT_PRESTAGE_NS], dataVersion)) throw new Error('Invalid prompt signed data.')
    if (!promptRegistry.validate(prompt.key, data)) throw new Error('Invalid prompt data.')
    const response = new ValidatedAppRequestResponse()
    const allConfigData = await periodConfigCache.get(prompt.periodId)
    let updated = false
    let savedData: any
    let previousAppRequestStatus: AppRequestStatus | undefined
    let previousAppPhases: Record<string, ApplicationPhase> = {}
    let appRequestData: AppRequestData | undefined
    let attempted = false
    let preview: Awaited<ReturnType<typeof previewAppRequestEvaluation>>
    await appRequestTransaction(prompt.appRequestInternalId, async db => {
      // a deadlock retries this callback, but preProcessData may have already consumed the upload streams,
      // and running it again would save the prompt as if no files were sent
      if (attempted && this.ctx.filesRead) throw new Error('Your files could not be saved because of a temporary conflict. Please try again.')
      attempted = true
      const [[appRequest], [appRequestDataPair]] = await Promise.all([
        getAppRequests({ internalIds: [prompt.appRequestInternalId] }, db),
        getAppRequestData([prompt.appRequestInternalId], db)
      ])
      appRequestData = appRequestDataPair?.data ?? {}
      if (!appRequest) throw new Error('AppRequest not found')
      for (const message of prompt.definition.preValidate?.(data, allConfigData[prompt.key] ?? {}, appRequestData, allConfigData, db) ?? []) response.addMessage(message.message, message.arg, message.type)
      if (response.hasErrors()) return
      const processedData = prompt.definition.preProcessData ? await prompt.definition.preProcessData(data, this.ctx, appRequest, appRequestData, allConfigData, db, validateOnly, this.svc(PreviousRequestService).selector(appRequest, prompt.key)) : data
      for (const message of prompt.definition.validate?.(processedData, allConfigData[prompt.key] ?? {}, appRequestData, allConfigData, db) ?? []) response.addMessage(message.message, message.arg, message.type)
      if (dataVersion != null && appRequest.dataVersion !== dataVersion) {
        response.addMessage('Someone else is working on the same request and made changes since you loaded. Copy any unsaved work into another document and reload the page to see what has changed.')
        return
      }
      if (validateOnly) {
        // requirement feedback is a courtesy on top of validation, so a failure here must never
        // take the validation response down with it
        try {
          preview = await previewAppRequestEvaluation(appRequest.internalId, prompt.key, processedData, db)
        } catch (err) {
          console.error(err)
        }
        return
      }
      response.success = true // if we got this far, it's saving the data, so that's a success even if the data isn't quite valid yet
      if (!equal(appRequestData[prompt.key], processedData) || (prompt.invalidated && overrideInvalidated)) {
        updated = true
        previousAppRequestStatus = appRequest.status
        savedData = appRequestData[prompt.key]
        appRequestData[prompt.key] = processedData
        const promptsToInvalidate = promptRegistry.getInvalidatedPrompts(prompt.key, appRequestData, allConfigData)
        await setRequirementPromptsInvalid(appRequest.internalId, promptsToInvalidate, db)
        const promptsToRevalidate = promptRegistry.getRevalidatedPrompts(prompt.key, appRequestData, allConfigData)
        if (prompt.invalidated && overrideInvalidated) promptsToRevalidate.push(prompt.key) // used as a positive confirmation that this previously invalidated prompt requires no changes to be valid again
        await setRequirementPromptsValid(appRequest.internalId, promptsToRevalidate.concat([prompt.key]), db)
        previousAppPhases = (await updateAppRequestData(appRequest.internalId, appRequestData, dataVersion, db))!
        const programDef = programRegistry.get(prompt.programKey)
        recordAppRequestActivity(appRequest.internalId, this.user!.internalId, 'Updated', { data, description: programDef ? `${resolveProgramLabels(programDef, allConfigData[prompt.programKey]).navTitle}: ${prompt.title}` : prompt.title, impersonatedBy: this.impersonationUser?.internalId }, db)
      }
    })
    this.loaders.clear()
    const updatedAppRequest = (await this.svc(AppRequestService).findByInternalId(prompt.appRequestInternalId))!

    // run hooks
    try {
      if (updated) {
        const applications = await this.svc(ApplicationService).findByAppRequest(updatedAppRequest)
        await appConfig.hooks?.updatePrompt?.(this.ctx, updatedAppRequest, appRequestData!, prompt.key, savedData)
        if (updatedAppRequest.status !== previousAppRequestStatus) {
          await appConfig.hooks?.appRequestStatus?.(this.ctx, updatedAppRequest, previousAppRequestStatus)
        }
        for (const app of applications) {
          if (app.phase !== previousAppPhases[app.programKey]) {
            await appConfig.hooks?.applicationPhase?.(this.ctx, updatedAppRequest, app.programKey, previousAppPhases[app.programKey])
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
    response.appRequest = updatedAppRequest
    try {
      const requirementSvc = this.svc(ApplicationRequirementService)
      if (validateOnly) {
        if (preview) {
          for (const requirement of preview.requirements) requirement.appRequestTags = prompt.appRequestTags
          response.statusReasons = promptStatusReasons(prompt.key, preview.applications, requirementSvc.authorize(preview.requirements), preview.prompts)
        }
      } else {
        const [applications, requirements, prompts] = await Promise.all([
          this.svc(ApplicationService).findByAppRequest(updatedAppRequest),
          requirementSvc.findByAppRequest(updatedAppRequest),
          this.raw.findByAppRequest(updatedAppRequest)
        ])
        response.statusReasons = promptStatusReasons(prompt.key, applications, requirements, prompts)
      }
    } catch (err) {
      console.error(err)
    }
    return response
  }
}

export class PeriodPromptService extends AuthService<Prompt> {
  async findByPeriodId (periodId: string) {
    return this.removeUnauthorized(await this.loaders.get(periodPromptByPeroidIdLoader).load(periodId))
  }

  async findByPeriodIdAndRequirementKey (periodId: string, requirementKey: string) {
    const prompts = await this.findByPeriodId(periodId)
    const reqDef = requirementRegistry.get(requirementKey)
    return prompts.filter(prompt => reqDef.promptKeySet.has(prompt.key)).map(prompt => new PeriodPrompt(periodId, prompt.key))
  }

  async findByPeriodIdAndPromptKey (periodId: string, promptKey: string) {
    return this.removeUnauthorized(await this.loaders.get(periodPromptByPeriodIdAndPromptKeyLoader).load({ periodId, promptKey }))
  }

  mayView (prompt: PeriodPrompt) {
    return this.hasControl('Prompt', 'view', prompt.authorizationKeys)
  }

  mayConfigure (prompt: PeriodPrompt): boolean {
    if (prompt.definition.configuration == null) return false
    return this.hasControl('Prompt', 'configure', prompt.authorizationKeys)
  }
}
