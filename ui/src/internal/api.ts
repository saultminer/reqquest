import { PUBLIC_API_BASE, PUBLIC_AUTH_REDIRECT, PUBLIC_SHOW_DUPLICATE_PROMPTS } from '$env/static/public'
import { error } from '@sveltejs/kit'
import { APIBase, type MutationResponseFromAPI } from '@txstate-mws/sveltekit-utils'
import type { Feedback } from '@txstate-mws/svelte-forms'
import { DateTime } from 'luxon'
import { keyby, omit, pick } from 'txstate-utils'
import {
  createClient, enumAppRequestIndexDestination, enumIneligiblePhases, enumPromptVisibility, enumRequirementStatus, enumRequirementType,
  type AccessRoleGrantCreate, type AccessRoleGrantUpdate, type AccessRoleGroup, type AccessRoleInput, type AccessUserFilter,
  type AppRequestActivityFilters, type AppRequestFilter, type IneligiblePhases, type Pagination, type PeriodUpdate, type PromptVisibility,
  type RequirementStatus, type RequirementType, type PhaseChangeMutations, type CompletionStatus, type StatusReason,
  type PeriodFilters
} from '$lib'
import { applicantVisiblePromptVisibilities } from './status-utils.js'

export const showDupePrompts = PUBLIC_SHOW_DUPLICATE_PROMPTS.trim() === 'true'
// the per-key configuration fields attached to prompt instances client-side, see API.attachPromptConfigs
export type PromptConfig = { configurationData: Record<string, any>, gatheredConfigData: Record<string, any> }
export type DashboardAppRequest = Awaited<ReturnType<typeof api.getApplicantRequests>>[number]
export type AppRequestForExportResponse = Awaited<ReturnType<typeof api.getAppRequestForExport>>
export type PromptForEditing = Awaited<ReturnType<typeof api.getApplicantPrompt>>['prompt']
export type ReviewData = Awaited<ReturnType<typeof api.getReviewData>>
export type PromptDataLegion = Awaited<ReturnType<typeof api.getPromptDataLegion>>
export type BasicRequestData = Awaited<ReturnType<typeof api.getBasicRequestData>>

class API extends APIBase {
  baseUrl = PUBLIC_API_BASE
  client = createClient({
    url: this.baseUrl,
    fetcher: async operation => {
      if (Array.isArray(operation)) throw new Error('Batching not supported')
      const data = await this.graphql(operation.query, operation.variables)
      return { data }
    }
  })

  async getDownloadTicket () {
    const resp = await this.post<{ ticket: string }>('/ticket')
    return resp.ticket
  }

  async getAccess () {
    const response = await this.client.query({
      __name: 'GetAccess',
      access: {
        user: {
          login: true,
          fullname: true
        },
        createPeriod: true,
        createRole: true,
        viewRoleManagement: true,
        viewPeriodManagement: true,
        viewReviewerInterface: true,
        viewApplicantDashboard: true,
        viewAppRequestList: true,
        createAppRequestSelf: true,
        createAppRequestOther: true,
        viewAnnouncementManagement: true,
        manageAnnouncements: true,
        viewMetrics: true
      }
    })
    return response.access
  }

  async getAccessUser (login: string) {
    const filter: AccessUserFilter =  { logins: [login] }
    const response = await this.client.query({
      __name: 'GetAccessUser',
      accessUsers: {
        __args: { filter },
        login: true,
        fullname: true,
        otherInfo: true
      }
    })
    return response.accessUsers[0]
  }
  
  async getAccessUsers (accessUsersFilter: AccessUserFilter, pageFilter: Pagination) {
    const filter = accessUsersFilter
    const paged = pageFilter
    const response = await this.client.query({
      __name: 'GetAccessUsers',
      accessUsers: {
        __args: { filter, paged },
        login: true,
        fullname: true,
        groups: true,
        roles: {
          name: true
        },
        otherIdentifiers: {
          id: true,
          label: true
        },
        otherInfo: true
      },
      pageInfo: {
        accessUsers: {
          currentPage: true,
          totalItems: true,
          hasNextPage: true,
          perPage: true,
          categories: {
            tags: {
              tag: true,
              label: true
            },
            category: true,
            label: true,
            useInFilters: true,
            useInList: true
          }
        }
      }
    })
    return { users: response.accessUsers, pageInfo: response.pageInfo.accessUsers }
  }

  async getApplicantRequests (additionalFilters: AppRequestFilter = {}) {    
    const filter: AppRequestFilter = { ...additionalFilters }
    const response = await this.client.query({
      __name: 'GetApplicantRequests',
      appRequests: {
        __args: { filter },
        id: true,
        status: true,
        phase: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        applicant: {
          login: true,
          fullname: true,
          otherIdentifiers: {
            id: true
          }
        },
        period: {
          id: true,
          name: true,
          openDate: true,
          closeDate: true
        },
        applications: {
          id: true,
          title: true,
          status: true,
          rescindedStatus: true,
          statusReason: true,
          ineligiblePhase: true,
          requirements: {
            id: true,
            type: true,
            status: true,
            statusReason: true,
            prompts: {
              id: true,
              visibility: true,
              moot: true,
              invalidated: true,
              invalidatedReason: true
            }
          }
        },
        actions: {
          acceptOffer: true,
          cancel: true,
          reopen: true,
          returnToApplicant: true,
          returnToOffer: true,
          submit: true
        }
      }
    })
    return response.appRequests
  }

  async getReviewerDashboardRequests (filter: AppRequestFilter = {}, paged?: Pagination) {
    const response = await this.client.query({
      __name: 'GetReviewerDashboardRequests',
      appRequestIndexes: {
        __args: { for: enumAppRequestIndexDestination.REVIEWER_DASHBOARD },
        category: true,
        categoryLabel: true,
        reviewerDashboardPriority: true,
        listable: true,
        values: {
          value: true,
          label: true
        }
      },
      appRequests: {
        __args: { filter, paged },
        id: true,
        phase: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        closedAt: true,
        indexCategories: {
          __args: { for: enumAppRequestIndexDestination.REVIEWER_DASHBOARD },
          categoryLabel: true,
          values: {
            label: true
          }
        },
        applicant: {
          login: true,
          fullname: true,
          otherIdentifiers: {
            id: true
          }
        },
        period: {
          name: true
        },
        applications: {
          id: true,
          title: true,
          programKey: true,
          status: true,
          rescindedStatus: true
        },
        actions: {
          review: true
        }
      },
      pageInfo: {
        appRequests: {
          totalItems: true
        }
      }
    })

    return response
  }

  /** First-time vs returning applicant counts (an applicant's first request in a period is first-time). */
  async getAppRequestApplicantCounts (filter: AppRequestFilter = {}) {
    const response = await this.client.query({
      __name: 'GetAppRequestApplicantCounts',
      countAppRequestApplicants: {
        __args: { filter },
        firstTime: true,
        returning: true
      }
    })
    return response.countAppRequestApplicants
  }

  /** Average seconds from submission to decision across applications, from the Metrics API. Requires access.viewMetrics. */
  async getReviewDecisionTiming () {
    const response = await this.client.query({
      __name: 'GetReviewDecisionTiming',
      applicationMetrics: {
        toDecision: {
          avg: true
        }
      }
    })
    return response.applicationMetrics.toDecision.avg ?? null
  }

  async getPrograms () {
    const response = await this.client.query({
      __name: 'GetPrograms',
      programs: {
        key: true,
        title: true
      }
    })
    return response.programs
  }

  async getApplicationCount (filter: AppRequestFilter = {}) {
    const response = await this.client.query({
      __name: 'GetApplicationCount',
      countAppRequests: {
        __args: { filter }
      }
    })
    return response.countAppRequests
  }

  async getApplicantPrompt (appRequestId: string, promptId: string) {
    const response = await this.client.query({
      __name: 'GetApplicantPrompt',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        data: true,
        dataVersion: true,
        prompt: {
              __args: { promptId },
              id: true,
              key: true,
              title: true,
              description: true,
              answered: true,
              visibility: true,
              hasSavedData: true,
              preloadData: true,
              prestageData: true,
              fetchedData: true,
              configurationData: true,
              gatheredConfigData: true,
              invalidated: true,
              invalidatedReason: true
        }
      }
    }) 
    return { appRequest: response.appRequests[0], prompt: response.appRequests[0].prompt }
  }

  async stagePrompt (promptId: string, dataVersion?: number) {
    const response = await this.graphqlWithUploads<{ stagePrompt: MutationResponseFromAPI }>(`
      mutation StagePrompt($promptId: ID!, $dataVersion: Int) {
        stagePrompt(promptId: $promptId, dataVersion: $dataVersion) {
          success
          messages {
            message
            type
            arg
          }
        }
      }
    `, { promptId, dataVersion })
    return this.mutationForDialog(response.stagePrompt)
  }

  async updatePrompt (promptId: string, data: any, validateOnly: boolean, dataVersion?: number, overrideInvalidated?: boolean) {
    const response = await this.graphqlWithUploads<{ updatePrompt: MutationResponseFromAPI }>(`
      mutation UpdatePrompt($promptId: ID!, $data: JsonData!, $validateOnly: Boolean!, $dataVersion: Int, $overrideInvalidated: Boolean) {
        updatePrompt(promptId: $promptId, data: $data, validateOnly: $validateOnly, dataVersion: $dataVersion, overrideInvalidated: $overrideInvalidated) {
          success
          messages {
            message
            type
            arg
          }
          appRequest {
            data
            dataVersion
          }
        }
      }
    `, { promptId, data, validateOnly, dataVersion, overrideInvalidated })
    return { ...this.mutationForDialog(response.updatePrompt), data: response.updatePrompt.appRequest.data, dataVersion: response.updatePrompt.appRequest.dataVersion as number | undefined }
  }

  async updateConfiguration (periodId: string, definitionKey: string, data: any, validateOnly: boolean) {
    const response = await this.client.mutation({
      __name: 'UpdateConfiguration',
      updateConfiguration: {
        __args: { periodId, key: definitionKey, data, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.updateConfiguration)
  }

  async getAppRequestData (appRequestId: string) {
    const response = await this.client.query({
      __name: 'GetAppRequestData',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        id: true,
        data: true,
        applications: {
          requirements: {
            prompts: {
              key: true,
              gatheredConfigData: true
            }
          }
        }
      }
    })
    if (response.appRequests.length === 0) return { data: {}, applications: [] as typeof response.appRequests[0]['applications'] }
    const appRequest = response.appRequests[0]
    return appRequest
  }

  static splitPromptsForApplicant<P extends { id: string, key: string, visibility: PromptVisibility, moot: boolean }, R extends { type: RequirementType, status: RequirementStatus, statusReason: string | null, blame?: string[] | null, prompts: P[] }, A extends { title: string, ineligiblePhase: IneligiblePhases | null, requirements: R[] }>(applications: A[]) {
    type ReturnPrompt = P & { statusReasons: StatusReason[] }
    type ReturnRequirement = R & { prompts: ReturnPrompt[] }
    type ReturnApplication = A & { requirements: ReturnRequirement[], completionStatus: CompletionStatus, hasWarning: boolean, warningReasons: string[], ineligibleReasons: string[], metReasons: string[]}
    const prequalPrompts: ReturnPrompt[] = []
    const postqualPrompts: ReturnPrompt[] = []
    const qualPrompts: ReturnPrompt[] = []
    const applicationsReviewWithDupes: ReturnApplication[] = []
    const applicationsReviewNoDupes: ReturnApplication[] = []
    const applicationsForNavWithDupes: ReturnApplication[] = []
    const applicationsForNavNoDupes: ReturnApplication[] = []
    const applicationsAcceptWithDupes: ReturnApplication[] = []
    const applicationsAcceptNoDupes: ReturnApplication[] = []
    const promptsById: Record<string, ReturnPrompt> = {}
    const promptsByKey: Record<string, ReturnPrompt[]> = {}
    // every prompt object we hand out, dupes included, so the status reasons pass below reaches all of them
    const allPromptRefs: ReturnPrompt[] = []

    const seenForReview = new Set<string>()
    const seenForNav = new Set<string>()
    const seenForAccept = new Set<string>()

    const requirementTypesForNavigation = new Set<RequirementType>([enumRequirementType.PREQUAL, enumRequirementType.POSTQUAL, enumRequirementType.QUALIFICATION])
    const requirementTypesForReview = new Set<RequirementType>([enumRequirementType.QUALIFICATION, enumRequirementType.PREAPPROVAL, enumRequirementType.APPROVAL, enumRequirementType.WORKFLOW])
    for (const application of applications) {
      const requirementsReviewWithDupes: ReturnRequirement[] = []
      const requirementsReviewNoDupes: ReturnRequirement[] = []
      const requirementsForNavWithDupes: ReturnRequirement[] = []
      const requirementsForNavNoDupes: ReturnRequirement[] = []
      const requirementsAcceptWithDupes: ReturnRequirement[] = []
      const requirementsAcceptNoDupes: ReturnRequirement[] = []
      for (const requirement of application.requirements) {
        const promptsForNavWithDupes: ReturnPrompt[] = []
        const promptsForNavNoDupes: ReturnPrompt[] = []
        const promptsReviewNoDupes: ReturnPrompt[] = []
        const promptsReviewWithDupes: ReturnPrompt[] = []
        const promptsAcceptWithDupes: ReturnPrompt[] = []
        const promptsAcceptNoDupes: ReturnPrompt[] = []
        for (const prompt of requirement.prompts) {
          const retPrompt: ReturnPrompt = { ...prompt, statusReasons: [] }
          const withDupesPrompt = { ...retPrompt }
          allPromptRefs.push(retPrompt, withDupesPrompt)
          promptsById[prompt.id] = retPrompt
          if (prompt.moot || prompt.visibility === enumPromptVisibility.UNREACHABLE) continue
          promptsByKey[prompt.key] ??= []
          promptsByKey[prompt.key].push(retPrompt)
          if (!applicantVisiblePromptVisibilities.has(prompt.visibility)) continue
          promptsReviewWithDupes.push(withDupesPrompt)
          if (requirementTypesForNavigation.has(requirement.type)) promptsForNavWithDupes.push(withDupesPrompt)
          if (requirement.type === enumRequirementType.ACCEPTANCE) promptsAcceptWithDupes.push(withDupesPrompt)
          if (!seenForReview.has(prompt.key)) promptsReviewNoDupes.push(retPrompt)
          seenForReview.add(prompt.key)
          if (requirementTypesForNavigation.has(requirement.type)) {
            if (!seenForNav.has(prompt.key)) promptsForNavNoDupes.push(retPrompt)
            seenForNav.add(prompt.key)
          }
          if (requirement.type === enumRequirementType.ACCEPTANCE) {
            if (!seenForAccept.has(prompt.key)) promptsAcceptNoDupes.push(retPrompt)
            seenForAccept.add(prompt.key)
          }
        }
        if (requirement.type === enumRequirementType.PREQUAL) prequalPrompts.push(...promptsForNavNoDupes)
        else if (requirement.type === enumRequirementType.POSTQUAL) postqualPrompts.push(...promptsForNavNoDupes)
        else if (requirementTypesForReview.has(requirement.type)) {
          requirementsReviewWithDupes.push({ ...requirement, prompts: promptsReviewWithDupes })
          requirementsReviewNoDupes.push({ ...requirement, prompts: promptsReviewNoDupes })
          if (requirement.type === enumRequirementType.QUALIFICATION) {
            qualPrompts.push(...promptsForNavNoDupes)
            requirementsForNavWithDupes.push({ ...requirement, prompts: promptsForNavWithDupes })
            requirementsForNavNoDupes.push({ ...requirement, prompts: promptsForNavNoDupes })
          }
        } else if (requirement.type === enumRequirementType.ACCEPTANCE) {
          requirementsAcceptWithDupes.push({ ...requirement, prompts: promptsAcceptWithDupes })
          requirementsAcceptNoDupes.push({ ...requirement, prompts: promptsAcceptNoDupes })
        }
      }
      const reqsForCompletion = application.requirements.filter(r => r.type !== enumRequirementType.POSTQUAL)
      let completionStatus: CompletionStatus = (application.ineligiblePhase) ? 'INELIGIBLE' : 'ELIGIBLE' // ineligible is always precise state, while eligible could be in eligible or pending state
      let completionStatusForNav: CompletionStatus = (application.ineligiblePhase) ? 'INELIGIBLE' : 'ELIGIBLE' // ineligible is always precise state, while eligible could be in eligible or pending state
      const warningReasons: string[] = []
      const warningReasonsFull: string[] = []
      const ineligibleReasons: string[] = []
      const ineligibleReasonsFull: string[] = []
      const metReasons: string[] = []
      const metReasonsFull: string[] = []
      let hasWarning = false
      let hasWarningForNav = false
      for (const req of reqsForCompletion) {
        const showWarnings = application.ineligiblePhase !== enumIneligiblePhases.PREQUAL || req.type === enumRequirementType.PREQUAL  
        // PENDING only demotes ELIGIBLE; INELIGIBLE is precise and PENDING just remains. The two statuses are
        // demoted independently: the first PENDING requirement may be a non-navigation type (e.g. an APPROVAL
        // requirement interleaved between QUALIFICATION ones), and that must not stop a later PENDING
        // QUALIFICATION requirement from marking the nav status PENDING.
        if (req.status === enumRequirementStatus.PENDING) {
          if (completionStatus === 'ELIGIBLE') completionStatus = 'PENDING'
          if (completionStatusForNav === 'ELIGIBLE' && requirementTypesForNavigation.has(req.type)) completionStatusForNav = 'PENDING'
        }
        //WARNING makes no completion status changes, whatever application state remains (pending, inel, eli), just append warning reasons
        else if (req.status === enumRequirementStatus.WARNING) {
          hasWarning = true
          if (requirementTypesForNavigation.has(req.type)) hasWarningForNav = true
          if (req.statusReason && showWarnings) {
            if (requirementTypesForNavigation.has(req.type)) warningReasons.push(req.statusReason)
            warningReasonsFull.push(req.statusReason)
          }
        // DISQUALIFYING, eligibility is already known by app ineligiblePhase, but always log ineligible reasons
        // showWarnings above already limits PREQUAL-dead apps to their PREQUAL requirements' reasons
        } else if (req.status === enumRequirementStatus.DISQUALIFYING) {
          if (req.statusReason && showWarnings) {
            if (requirementTypesForNavigation.has(req.type)) ineligibleReasons.push(req.statusReason)
            ineligibleReasonsFull.push(req.statusReason)
          }
        // MET, eligibility is already known by app ineligiblePhase, but always log MET reasons
        } else if (req.status === enumRequirementStatus.MET) {
          if (req.statusReason) {
            if (requirementTypesForNavigation.has(req.type)) metReasons.push(req.statusReason)
            metReasonsFull.push(req.statusReason)
          }   
        // NOT APPLICABLE, reference here is for completness, but not implemented as not_applicable currently changes nothing, nor logs reasons
        } //else if (req.status === enumRequirementStatus.NOT_APPLICABLE) {
        //}        
      }      
      applicationsReviewWithDupes.push({ ...application, requirements: requirementsReviewWithDupes, completionStatus, warningReasons: warningReasonsFull, ineligibleReasons: ineligibleReasonsFull, metReasons: metReasonsFull, hasWarning })
      applicationsReviewNoDupes.push({ ...application, requirements: requirementsReviewNoDupes, completionStatus, warningReasons: warningReasonsFull, ineligibleReasons: ineligibleReasonsFull, metReasons: metReasonsFull, hasWarning })
      applicationsForNavWithDupes.push({ ...application, requirements: requirementsForNavWithDupes, completionStatus: completionStatusForNav, warningReasons, ineligibleReasons, metReasons: metReasonsFull, hasWarning: hasWarningForNav })
      applicationsForNavNoDupes.push({ ...application, requirements: requirementsForNavNoDupes, completionStatus: completionStatusForNav, warningReasons, ineligibleReasons, metReasons: metReasonsFull, hasWarning: hasWarningForNav })
      applicationsAcceptWithDupes.push({ ...application, requirements: requirementsAcceptWithDupes, completionStatus, warningReasons: warningReasonsFull, ineligibleReasons: ineligibleReasonsFull, metReasons: metReasonsFull, hasWarning })
      applicationsAcceptNoDupes.push({ ...application, requirements: requirementsAcceptNoDupes, completionStatus, warningReasons: warningReasonsFull, ineligibleReasons: ineligibleReasonsFull, metReasons: metReasonsFull, hasWarning })
    }
    const reasonsByKey: Record<string, StatusReason[]> = {}
    for (const application of applications) {
      for (const requirement of application.requirements) {
        const blamed = !!requirement.blame?.length
        const targets = blamed
          ? requirement.blame!
          : requirement.prompts.filter(p => p.visibility !== enumPromptVisibility.UNREACHABLE).map(p => p.key)
        for (const key of targets) {
          (reasonsByKey[key] ??= []).push({ ...pick(requirement, 'status', 'statusReason'), programName: application.title, blamed })
        }
      }
    }
    for (const prompt of allPromptRefs) prompt.statusReasons = reasonsByKey[prompt.key] ?? []
    return { prequalPrompts, postqualPrompts, qualPrompts, applicationsReviewWithDupes, applicationsReviewNoDupes, applicationsForNavWithDupes, applicationsForNavNoDupes, applicationsAcceptWithDupes, applicationsAcceptNoDupes, promptsByKey, promptsById }
  }

  async getAppRequestForExport (appRequestId: string) {
    const response = await this.client.query({
      __name: 'GetAppRequestForExport',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        id: true,
        status: true,
        phase: true,
        closedAt: true,
        data: true,
        dataVersion: true,
        period: {
          name: true
        },
        applications: {
          id: true,
          status: true,
          rescindedStatus: true,
          ineligiblePhase: true,
          hiddenIneligiblePreSubmit: true,
          statusReason: true,
          title: true,
          navTitle: true,
          applicantDescription: true,
          eligibilityDescription: true,
          requirements: {
            id: true,
            type: true,
            status: true,
            statusReason: true,
            blame: true,
            prompts: {
              id: true,
              key: true,
              title: true,
              navTitle: true,
              answered: true,
              visibility: true,
              moot: true,
              invalidated: true,
              invalidatedReason: true,
              optOut: true
            }
          }
        },
        actions: {
          viewApplyUI: true,
          viewAcceptUI: true
        }
      }
    })
    if (response.appRequests.length === 0) throw error(404, 'Application request not found')
    type ResponseAppRequest = (typeof response)['appRequests'][0]
    type ResponseApplication = ResponseAppRequest['applications'][0] & { requirements: ResponseRequirement[] }
    type ResponseRequirement = ResponseAppRequest['applications'][0]['requirements'][0] & { prompts: ResponsePrompt[] }
    type ResponsePrompt = ResponseAppRequest['applications'][0]['requirements'][0]['prompts'][0] & PromptConfig

    // configuration is per prompt key, not per prompt instance, so it is fetched once per key rather than
    // repeated under every program and requirement that shares the prompt
    const applications = (response.appRequests[0]?.applications ?? []) as ResponseApplication[]
    await this.attachPromptConfigs(appRequestId, applications)

    const splitInfo = API.splitPromptsForApplicant<ResponsePrompt, ResponseRequirement, ResponseApplication>(applications)
    return {
      ...omit(splitInfo, 'applicationsForNavNoDupes', 'applicationsForNavWithDupes', 'applicationsReviewNoDupes', 'applicationsReviewWithDupes'),
      applicationsForNav: showDupePrompts ? splitInfo.applicationsForNavWithDupes : splitInfo.applicationsForNavNoDupes,
      applicationsReview: showDupePrompts ? splitInfo.applicationsReviewWithDupes : splitInfo.applicationsReviewNoDupes,
      applicationsAccept: showDupePrompts ? splitInfo.applicationsAcceptWithDupes : splitInfo.applicationsAcceptNoDupes,
      appRequest: response.appRequests[0]
    }
  }

  async createAppRequest (periodId?: string, login?: string, validateOnly?: boolean) {
    const messages: Feedback[] = []
    if (!periodId) messages.push({ message: 'You must select a period to create an application.', type: 'error', path: 'periodId' })
    if (!login) messages.push({ message: 'You must provide a login to create an application.', type: 'error', path: 'login' })
    if (messages.length > 0) return { success: false, messages, data: { periodId, login }, id: undefined }

    const response = await this.client.mutation({
      __name: 'CreateAppRequest',
      createAppRequest: {
        __args: { periodId: periodId!, login: login!, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        },
        appRequest: {
          id: true
        }
      }
    })
    return { ...this.mutationForDialog(response.createAppRequest), id: response.createAppRequest.appRequest?.id }
  }

  async appRequestPhaseChange (appRequestId: string, phaseChange: PhaseChangeMutations) {
    const response = await this.graphql<Record<string, { success: boolean, messages: { message: string, type: 'error' | 'warning' | 'success', arg?: string }[] }>>(`
      mutation AppRequestPhaseChange($appRequestId: ID!) {
        ${phaseChange}(appRequestId: $appRequestId) {
          success
          messages {
            message
            type
            arg
          }
        }
      }
    `, { appRequestId })
    return this.mutationForDialog(response[phaseChange])
  }

  async cancelAppRequest (appRequestId: string, dataVersion?: number) {
    const response = await this.client.mutation({
      __name: 'CancelAppRequest',
      cancelAppRequest: {
        __args: { appRequestId, dataVersion },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.cancelAppRequest)
  }

  async reopenAppRequest (appRequestId: string) {
    const response = await this.client.mutation({
      __name: 'ReopenAppRequest',
      reopenAppRequest: {
        __args: { appRequestId },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.reopenAppRequest)
  }

  async advanceWorkflow (applicationId: string) {
    const response = await this.client.mutation({
      __name: 'AdvanceWorkflow',
      advanceWorkflow: {
        __args: { applicationId },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.advanceWorkflow)
  }

  async reverseWorkflow (applicationId: string) {
    const response = await this.client.mutation({
      __name: 'ReverseWorkflow',
      reverseWorkflow: {
        __args: { applicationId },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.reverseWorkflow)
  }

  async rescind (applicationId: string, reason: string, validateOnly?: boolean) {
    const response = await this.client.mutation({
      __name: 'Rescind',
      rescind: {
        __args: { applicationId, reason, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.rescind)
  }

  async restore (applicationId: string, reason: string, validateOnly?: boolean) {
    const response = await this.client.mutation({
      __name: 'Restore',
      restore: {
        __args: { applicationId, reason, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.restore)
  }

  async addNote (appRequestId: string, content: string, persistent?: boolean, validateOnly?: boolean) {
    const response = await this.client.mutation({
      __name: 'AddNote',
      addNote: {
        __args: { appRequestId, content, persistent, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.addNote, { dataName: 'note' })
  }

  async updateNote (noteId: string, content: string) {
    const response = await this.client.mutation({
      __name: 'UpdateNote',
      updateNote: {
        __args: { noteId, content },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.updateNote, { dataName: 'note' })
  }

  async togglePersistence (noteId: string) {
    const response = await this.client.mutation({
      __name: 'TogglePersistence',
      togglePersistence: {
        __args: { noteId },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.togglePersistence, { dataName: 'note' })
  }

  async deleteNote (noteId: string) {
    const response = await this.client.mutation({
      __name: 'DeleteNote',
      deleteNote: {
        __args: { noteId }
      }
    })
    return response.deleteNote
  }

  async closeAppRequest (appRequestId: string) {
    const response = await this.client.mutation({
      __name: 'CloseAppRequest',
      closeAppRequest: {
        __args: { appRequestId },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.closeAppRequest)
  }

  async getAppRequests (
    filter?: Omit<AppRequestFilter, 'indexes'> & { indexes?: Record<string, string[]> },
    paged?: Pagination,
    dest = enumAppRequestIndexDestination.APP_REQUEST_LIST) {
    const processedFilter = {
      ...filter,
      indexes: filter?.indexes ? Object.entries(filter.indexes).map(([category, tags]) => ({ category, tags })) : undefined
    }
    const response = await this.client.query({
      __name: 'GetAppRequests',
      appRequests: {
        __args: { filter: processedFilter, paged },
        id: true,
        phase: true,
        createdAt: true,
        closedAt: true,
        updatedAt: true,
        applications: {
          title: true,
          programKey: true,
          status: true,
          rescindedStatus: true
        },
        applicant: {
          login: true,
          fullname: true
        },
        status: true,
        statusReason: true,
        period: {
          id: true,
          name: true
        },
        indexCategories: {
          __args: { for: dest },
          category: true,
          categoryLabel: true,
          values: {
            value: true,
            label: true
          }
        },
        actions: {
          review: true
        }
      },
      appRequestIndexes: {
        category: true,
        categoryLabel: true,
        appRequestListPriority: true,
        listFiltersPriority: true,
        listable: true,
        values: {
          __args: { inUse: true },
          value: true,
          label: true
        }
      },
      pageInfo: {
        appRequests: {
          currentPage: true,
          totalItems: true,
          hasNextPage: true,
          perPage: true,
          categories: {
            tags: {
              tag: true,
              label: true
            },
            category: true,
            label: true,
            useInFilters: true,
            useInList: true
          }
        }
      }

    })
    return response
  }

  async searchIndexItems (category: string, search: string) {
    const response = await this.client.query({
      __name: 'SearchIndexItems',
      appRequestIndexes: {
        __args: { categories: [category] },
        values: {
          __args: { search },
          value: true,
          label: true
        }
      }
    })
    return response.appRequestIndexes[0]?.values ?? []
  }

  async getBasicRequestData (appRequestId: string) {
    const response = await this.client.query({
      __name: 'GetBasicRequestData',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        status: true,
        phase: true,
        closedAt: true,
        applicant: {
          login: true,
          fullname: true,
          otherIdentifiers: {
            id: true,
            label: true
          },
          otherInfo: true
        },
        period: {
          id: true,
          name: true,
          code: true,
          openDate: true,
          closeDate: true,
          archiveDate: true
        },
        applications: {
          id: true,
          navTitle: true,
          programKey: true,
          status: true,
          ineligiblePhase: true
        },
        actions: {
          acceptOffer: true,
          cancel: true,
          close: true,
          completeRequest: true,
          completeReview: true,
          reopen: true,
          returnToApplicant: true,
          returnToNonBlocking: true,
          returnToOffer: true,
          returnToReview: true,
          review: true,
          submit: true
        }
      }
    })
    if (response.appRequests.length === 0) return undefined
    return response.appRequests[0]
  }

  async getReviewData (appRequestId: string, programKey?: string) {
    const response = await this.client.query({
      __name: 'GetReviewData',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        id: true,
        dataVersion: true,
        status: true,
        phase: true,
        createdAt: true,
        submittedAt: true,
        closedAt: true,
        data: true,
        applications: {
          ...(programKey ? { __args: { programKeys: [programKey] } } : {}),
          id: true,
          phase: true,
          status: true,
          statusReason: true,
          title: true,
          navTitle: true,
          programKey: true,
          rescindedStatus: true,
          workflowStage: {
            key: true,
            blocking: true
          },
          nextWorkflowStage: {
            key: true,
            title: true
          },
          previousWorkflowStage: {
            key: true,
            title: true
          },
          actions: {
            advanceWorkflow: true,
            reverseWorkflow: true,
            rescindApplication: true,
            restoreApplication: true
          },
          requirements: {
            id: true,
            key: true,
            type: true,
            title: true,
            status: true,
            statusReason: true,
            blame: true,
            workflowStage: {
              key: true,
              title: true,
              blocking: true
            },
            prompts: {
              id: true,
              key: true,
              title: true,
              navTitle: true,
              answered: true,
              visibility: true,
              moot: true,
              invalidated: true,
              invalidatedReason: true,
              optOut: true,
              noDisplay: true,
              actions: {
                update: true
              }
            }
          }
        },
        notes: {
          id: true,
          content: true,
          persistent: true,
          createdAt: true,
          author: {
            login: true,
            fullname: true
          }
        },
        actions: {
          acceptOffer: true,
          cancel: true,
          close: true,
          completeRequest: true,
          completeReview: true,
          reopen: true,
          returnToApplicant: true,
          returnToNonBlocking: true,
          returnToOffer: true,
          returnToReview: true,
          review: true,
          submit: true,
          createNote: true,
          createPersistentNote: true
        }
      }
    })
    if (response.appRequests.length === 0) return undefined
    const appRequest = response.appRequests[0]
    type ResponsePrompt = (typeof appRequest)['applications'][0]['requirements'][0]['prompts'][0] & PromptConfig
    type ResponseRequirement = Omit<(typeof appRequest)['applications'][0]['requirements'][0], 'prompts'> & { prompts: ResponsePrompt[] }
    type ResponseApplication = Omit<(typeof appRequest)['applications'][0], 'requirements'> & { requirements: ResponseRequirement[] }
    const applications = appRequest.applications as ResponseApplication[]
    await this.attachPromptConfigs(appRequestId, applications)
    return { ...appRequest, applications }
  }

  async getRequestActivity (appRequestId: string, filters?: AppRequestActivityFilters, paged?: Pagination) {
    const response = await this.client.query({
      __name: 'GetRequestActivity',
      appRequestActivity: {
        __args: { id: appRequestId, filters, paged },
        id: true,
        user: {
          login: true,
          fullname: true
        },
        impersonatedBy: {
          login: true,
          fullname: true
        },
        action: true,
        description: true,
        data: true,
        createdAt: true
      },
      pageInfo: {
        appRequestsActivity: {
          currentPage: true,
          totalItems: true,
          hasNextPage: true,
          perPage: true
        }
      }
    })
    return {
      activity: response.appRequestActivity,
      pageInfo: response.pageInfo.appRequestsActivity
    }
  }

  async getPromptData (appRequestId: string, promptId: string) {
    const response = await this.client.query({
      __name: 'GetPromptData',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        dataVersion: true,
        prompt: {
          __args: { promptId },
          data: true,
          preloadData: true,
          prestageData: true,
          configurationData: true,
          gatheredConfigData: true,
          fetchedData: true
        }
      }
    })
    const appRequest = response.appRequests[0]
    return { ...appRequest.prompt, dataVersion: appRequest.dataVersion }
  }

  /**
   * What the reviewer sidebar's "Ineligibility Information" dialog shows: every application's outcome plus
   * the statuses behind it. Loaded when the dialog opens, since the review page itself only carries the
   * displayed program.
   */
  async getIneligibilityInfo (appRequestId: string) {
    const response = await this.client.query({
      __name: 'GetIneligibilityInfo',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        id: true,
        phase: true,
        closedAt: true,
        applications: {
          id: true,
          title: true,
          status: true,
          statusReason: true,
          rescindedStatus: true,
          requirements: {
            id: true,
            status: true,
            statusReason: true,
            prompts: {
              optOut: true
            }
          }
        }
      }
    })
    return response.appRequests[0]
  }

  async getPromptConfigs (appRequestId: string, promptIds: string[]) {
    if (!promptIds.length) return []
    const response = await this.client.query({
      __name: 'GetPromptConfigs',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        applications: {
          requirements: {
            prompts: {
              __args: { filter: { ids: promptIds } },
              id: true,
              key: true,
              configurationData: true,
              gatheredConfigData: true
            }
          }
        }
      }
    })
    return response.appRequests[0]?.applications.flatMap(a => a.requirements.flatMap(r => r.prompts)) ?? []
  }

  private async attachPromptConfigs<P extends { id: string, key: string, visibility: PromptVisibility, moot: boolean | null }> (appRequestId: string, applications: { requirements: { prompts: P[] }[] }[]) {
    const representativeByKey: Record<string, string> = {}
    const instancesByKey: Record<string, P[]> = {}
    for (const application of applications) {
      for (const requirement of application.requirements) {
        for (const prompt of requirement.prompts) {
          (instancesByKey[prompt.key] ??= []).push(prompt)
          if (representativeByKey[prompt.key] == null && !prompt.moot && prompt.visibility !== enumPromptVisibility.UNREACHABLE) representativeByKey[prompt.key] = prompt.id
        }
      }
    }
    const configs = await this.getPromptConfigs(appRequestId, Object.values(representativeByKey))
    const configByKey = keyby(configs, 'key')
    for (const [key, instances] of Object.entries(instancesByKey)) {
      const config = configByKey[key]
      for (const prompt of instances) {
        (prompt as P & PromptConfig).configurationData = config?.configurationData ?? {}
        ;(prompt as P & PromptConfig).gatheredConfigData = config?.gatheredConfigData ?? {}
      }
    }
  }

  async getPromptDataLegion (appRequestId: string, promptIds: string[]) {
    const response = await this.client.query({
      __name: 'GetPromptDataLegion',
      appRequests: {
        __args: { filter: { ids: [appRequestId] } },
        applications: {
          requirements: {
            prompts: {
              __args: { filter: { ids: promptIds } },
              id: true,
              data: true,
              preloadData: true,
              prestageData: true,
              configurationData: true,
              gatheredConfigData: true,
              fetchedData: true
            }
          }
        }        
      }
    })
    const appRequest = response.appRequests[0]
    return appRequest.applications.flatMap(req => req.requirements.flatMap(r => r.prompts))
  }

  async getPeriodList (filter?: PeriodFilters) {
    const response = await this.client.query({
      __name: 'GetPeriodList',
      periods: {
        __args: { filter },
        id: true,
        name: true,
        code: true,
        openDate: true,
        closeDate: true,
        archiveDate: true,
        reviewed: true,
        actions: {
          update: true,
          delete: true,
          createAppRequest: true
        }
      }
    })
    return response.periods
  }

  async getOpenPeriods (filter?: PeriodFilters) {
    const response = await this.client.query({
      __name: 'GetOpenPeriods',
      periods: {
        __args: { filter: { ...filter, openNow: true } },
        id: true,
        name: true,
        code: true,
        openDate: true,
        closeDate: true,
        archiveDate: true,
        reviewed: true
      }
    })
    return response.periods
  }

  async createPeriod (period: PeriodUpdate, validateOnly: boolean, copyPeriodId?: string) {
    const response = await this.client.mutation({
      __name: 'CreatePeriod',
      createPeriod: {
        __args: { period, validateOnly, copyPeriodId },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return api.mutationForDialog(response.createPeriod, { prefix: 'period' })
  }

  async updatePeriod (periodId: string, period: PeriodUpdate, validateOnly: boolean) {
    const response = await this.client.mutation({
      __name: 'UpdatePeriod',
      updatePeriod: {
        __args: { periodId, update: period, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.updatePeriod, { prefix: 'period' })
  }

  async markPeriodReviewed (periodId: string, validateOnly: boolean) {
    const response = await this.client.mutation({
      __name: 'MarkPeriodReviewed',
      markPeriodReviewed: {
        __args: { periodId, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.markPeriodReviewed, { prefix: 'period' })
  }

  async deletePeriod (periodId: string) {
    const response = await this.client.mutation({
      __name: 'DeletePeriod',
      deletePeriod: {
        __args: { periodId },
        success: true
      }
    })
    return response.deletePeriod.success
  }

  async disablePeriodProgramRequirements (periodId: string, requirementKey: string, disabled: boolean) {
    const response = await this.client.mutation({
      __name: 'updatePeriodProgram',
      updatePeriodRequirement: {
        __args: { periodId, requirementKey, disabled },
        success: true
      }
    })
    return response.updatePeriodRequirement.success
  }

  async getPeriodConfigurations (periodId: string) {
    const response = await this.client.query({
      __name: 'GetPeriodConfigurations',
      periods: {
        __args: { filter: { ids: [periodId] } },
        id: true,
        name: true,
        code: true,
        openDate: true,
        closeDate: true,
        archiveDate: true,
        reviewed: true,
        programs: {
          key: true,
          title: true,
          navTitle: true,
          enabled: true,
          configuration: {
            data: true,
            actions: {
              update: true
            }
          },
          requirements: {
            key: true,
            title: true,
            description: true,
            enabled: true,
            type: true,
            configuration: {
              data: true,
              actions: {
                update: true
              }
            },
            prompts: {
              key: true,
              title: true,
              description: true,
              configuration: {
                data: true,
                actions: {
                  update: true
                }
              }
            }
          }
        }
      }
    })
    if (!response.periods.length) return { period: undefined, programs: [] }
    const period = response.periods[0]
    return { programs: period.programs, period }
  }

  async getConfigurationFetched (periodId: string, definitionKey: string) {
    const response = await this.client.query({
      __name: 'GetConfigurationFetched',
      periods: {
        __args: { filter: { ids: [periodId] } },
        configurations: {
          __args: { filter: { keys: [definitionKey] } },
          fetchedData: true
        }
      }
    })
    return response.periods[0].configurations[0]?.fetchedData ?? {}
  }

  async getRoleList () {
    const response = await this.client.query({
      __name: 'GetRoleList',
      roles: {
        id: true,
        name: true,
        description: true,
        groups: {
          groupName: true,
          managers: {
            fullname: true,
            email: true
          },
          dateAdded: true,
          dateCreated: true
        },
        actions: {
          update: true,
          delete: true
        }
      }
    })
    if (response.roles.length === 0) return undefined
    const roles = response.roles
    return roles.map(role => ({ ...role, groups: role.groups.map((group: AccessRoleGroup) => ({
      ...group,
      dateAdded: DateTime.fromISO(group.dateAdded),
      dateCreated: group.dateCreated ? DateTime.fromISO(group.dateCreated) : undefined
    })) }))
  }

  async getRoleDetails (roleId: string) {
    const response = await this.client.query({
      __name: 'GetRoleDetails',
      roles: {
        __args: { filter: { ids: [roleId] } },
        id: true,
        name: true,
        description: true,
        groups: {
          groupName: true,
          managers: {
            fullname: true,
            email: true
          },
          dateAdded: true,
          dateCreated: true
        },
        grants: {
          id: true,
          controlGroup: {
            name: true,
            title: true,
            description: true
          },
          allow: true,
          controls: true,
          tags: {
            category: true,
            categoryLabel: true,
            tag: true,
            label: true,
            description: true
          },
          actions: {
            update: true,
            delete: true
          }
        },
        actions: {
          update: true,
          delete: true
        }
      }
    })
    if (!response.roles.length) return undefined
    const role = response.roles[0]
    return { ...role, groups: role.groups.map((group: AccessRoleGroup) => ({
      ...group,
      dateAdded: DateTime.fromISO(group.dateAdded),
      dateCreated: group.dateCreated ? DateTime.fromISO(group.dateCreated) : undefined
    })) }
  }

  async getAuthorizationInfo () {
    const response = await this.client.query({
      __name: 'GetAuthorizationInfo',
      controlGroups: {
        name: true,
        title: true,
        description: true,
        tags: {
          category: true,
          label: true,
          description: true,
          listable: true,
          tags: {
            value: true,
            label: true,
            description: true
          }
        },
        controls: {
          name: true,
          description: true
        }
      }
    })
    return response.controlGroups
  }

  async upsertRole (roleId: string | undefined, role: AccessRoleInput, validateOnly: boolean, copyRoleId?: string) {
    if (roleId != null) {
      const response = await this.client.mutation({
        __name: 'UpdateRole',
        roleUpdate: {
          __args: { roleId, role, validateOnly },
          success: true,
          messages: {
            message: true,
            type: true,
            arg: true
          }
        }
      })
      return this.mutationForDialog(response.roleUpdate)
    } else {
      const response = await this.client.mutation({
        __name: 'CreateRole',
        roleCreate: {
          __args: { role, copyRoleId, validateOnly },
          success: true,
          messages: {
            message: true,
            type: true,
            arg: true
          }
        }
      })
      return this.mutationForDialog(response.roleCreate)
    }
  }

  async deleteRole (roleId: string) {
    const response = await this.client.mutation({
      __name: 'DeleteRole',
      roleDelete: {
        __args: { roleId },
        success: true
      }
    })
    return response.roleDelete.success
  }

  async updateGrant (grantId: string, grant: AccessRoleGrantUpdate, validateOnly: boolean) {
    const response = await this.client.mutation({
      __name: 'UpdateGrant',
      roleUpdateGrant: {
        __args: { grantId, grant, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.roleUpdateGrant)
  }

  async createGrant (roleId: string, grant: AccessRoleGrantCreate, validateOnly: boolean) {
    const response = await this.client.mutation({
      __name: 'CreateGrant',
      roleAddGrant: {
        __args: { roleId, grant, validateOnly },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.roleAddGrant)
  }

  async deleteGrant (grantId: string) {
    const response = await this.client.mutation({
      __name: 'DeleteGrant',
      roleDeleteGrant: {
        __args: { grantId },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return this.mutationForDialog(response.roleDeleteGrant)
  }

  async getAnnouncement (active?: boolean) {
    const response = await this.client.query({
      __name: 'announcement',
      announcements:{
        __args: {
          filter: active == null ? {} : { active }
        },
        id: true,
        isActive: true,
        subject: true,
        body: true,
        start: true,
        end: true,
        link: true,
        linkText: true,
        enabled: true,
        type: true
      }
    })

    return response.announcements.length ? response.announcements[0] : undefined
  }

  async createAnnouncement (announcement: any, validateOnly = true) {
    const response = await this.client.mutation({
      __name: 'CreateAnnouncement',
      createAnnouncement: {
        __args: {
          announcement,
          validateOnly
        },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })

    return this.mutationForDialog(response.createAnnouncement)
  }

  async updateAnnouncement (announcementId: string, announcement: any, validateOnly = true) {
    const response = await this.client.mutation({
      __name: 'UpdateAnnouncement',
      updateAnnouncement: {
        __args: {
          announcementId,
          announcement,
          validateOnly
        },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })

    return this.mutationForDialog(response.updateAnnouncement)
  }

  async deleteAnnouncement (id: string) {
    const response = await this.client.mutation({
      __name: 'CreateAnnouncement',
      deleteAnnouncement: {
        __args: {
          announcementId: id
        },
        success: true,
        messages: {
          message: true,
          type: true,
          arg: true
        }
      }
    })
    return response.deleteAnnouncement.success
  }
}

export const api = new API(PUBLIC_API_BASE, PUBLIC_AUTH_REDIRECT)
