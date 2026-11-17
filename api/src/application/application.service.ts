import { OneToManyLoader, PrimaryKeyLoader } from 'dataloader-factory'
import { rescindApplication, restoreApplication, advanceWorkflow, completeApplication, reopenApplication, isPresubmissionIneligible, nonBlockingSunsetReached, appConfig, Application, ApplicationPhase, ApplicationRescindedStatus, ApplicationStatus, AppRequest, AppRequestPhase, AppRequestService, AppRequestStatus, AppRequestStatusDB, appRequestTransaction, AuthService, evaluateAppRequest, getApplications, PeriodWorkflowStage, programRegistry, ProgramService, reverseWorkflow, ValidatedAppRequestResponse, WorkflowStage } from '../internal.js'
import { BaseService } from '@txstate-mws/graphql-server'
import { isBlank } from 'txstate-utils'
import { applicationPhaseNotifications, applicationBenefitRescindRestoreNotifications } from '../util/notifications.js'

const appByInternalIdLoader = new PrimaryKeyLoader({
  fetch: async (ids: string[]) => {
    return await getApplications({ ids })
  }
})

const byAppRequestId = new OneToManyLoader({
  fetch: async (appRequestIds: string[]) => {
    return await getApplications({ appRequestIds })
  },
  extractKey: (app: Application) => app.appRequestId,
  idLoader: appByInternalIdLoader
})

export const statusVisibleToApplicantPhases = new Set<ApplicationPhase>([
  ApplicationPhase.PREQUAL,
  ApplicationPhase.QUALIFICATION,
  ApplicationPhase.READY_TO_SUBMIT,
  ApplicationPhase.REVIEW_IN_PROGRESS,
  ApplicationPhase.REVIEW_COMPLETE,
  ApplicationPhase.ACCEPTANCE,
  ApplicationPhase.READY_TO_ACCEPT,
  ApplicationPhase.WORKFLOW_NONBLOCKING,
  ApplicationPhase.READY_TO_COMPLETE,
  ApplicationPhase.COMPLETE
])

/**
 * Whether an application's results may be shown to the applicant, based on how far along it is.
 *
 * Phase alone is not enough because READY_FOR_WORKFLOW carries two different meanings. While the
 * request is still in review it means 'review or a blocking stage finished, waiting for a reviewer to
 * advance', and nothing may be released yet, since a blocking stage can still change the outcome. Any
 * later request phase means the review has been completed and the results were released then. (It is
 * no longer computed during non-blocking workflow, which uses READY_TO_COMPLETE, but applications
 * stored before that change may still carry it until they are next evaluated.)
 */
export function statusVisibleToApplicant (applicationPhase: ApplicationPhase, appRequestPhase: AppRequestPhase) {
  if (applicationPhase === ApplicationPhase.READY_FOR_WORKFLOW) {
    return appRequestPhase !== AppRequestPhase.STARTED && appRequestPhase !== AppRequestPhase.SUBMITTED
  }
  return statusVisibleToApplicantPhases.has(applicationPhase)
}

export class ApplicationServiceInternal extends BaseService<Application> {
  async findByInternalId (internalId: number, appRequestTags?: Record<string, string[]>) {
    const application = await this.loaders.get(appByInternalIdLoader).load(String(internalId))
    application!.appRequestTags = appRequestTags ?? await this.svc(AppRequestService).getTags(application!.appRequestId)
    return application
  }

  async findByAppRequest (appRequest: AppRequest) {
    const applications = await this.loaders.get(byAppRequestId).load(appRequest.id)
    for (const application of applications) application.appRequestTags = appRequest.tags
    return applications
  }
}

export class ApplicationService extends AuthService<Application> {
  raw = this.svc(ApplicationServiceInternal)

  async findByInternalId (internalId: number, appRequestTags?: Record<string, string[]>) {
    return this.removeUnauthorized(await this.raw.findByInternalId(internalId, appRequestTags))
  }

  async findByAppRequest (appRequest: AppRequest) {
    return this.removeUnauthorized(await this.raw.findByAppRequest(appRequest))
      .filter(a => !a.hiddenIneligiblePreSubmit || this.isOwn(a))
  }

  async getNextWorkflowStage (application: Application) {
    if (!this.mayAdvanceWorkflow(application)) return null
    // Non-blocking workflow is non-sequential and is finished with completeApplication, not by advancing, so there is no
    // "next stage". The rest of this only applies to the blocking workflow.
    if (application.appRequestPhase === AppRequestPhase.WORKFLOW_NONBLOCKING) return null
    const stages = await this.svc(ProgramService).findWorkflowStagesByPeriodIdAndProgramKey(application.periodId, application.programKey, { hasEnabledRequirements: true, blocking: true })
    if (!application.workflowStageKey) return stages[0]
    const currentIndex = stages.findIndex(s => s.key === application.workflowStageKey)
    if (currentIndex === -1 || currentIndex + 1 >= stages.length) return null
    return stages[currentIndex + 1]
  }

  async completesAfterNonBlocking (application: Application) {
    const stages = await this.svc(ProgramService).findWorkflowStagesByPeriodIdAndProgramKey(application.periodId, application.programKey, { hasEnabledRequirements: true, blocking: false })
    return stages.some(stage => !nonBlockingSunsetReached(programRegistry.getWorkflowStageByKey(stage.key), AppRequestPhase.WORKFLOW_NONBLOCKING))
  }

  async getPreviousWorkflowStage (application: Application) {
    if (!this.mayReverseWorkflow(application)) return null
    // only blocking workflow stages participate in the reverse order, non-blocking stages are excluded.
    // made authoritative for nonBlocking.
    const stages = (await this.svc(ProgramService).findWorkflowStagesByPeriodIdAndProgramKey(application.periodId, application.programKey, { hasEnabledRequirements: true, blocking: true }))
      .filter(s => !programRegistry.getWorkflowStageByKey(s.key)?.nonBlocking)
    // past the blocking workflow (REVIEW_COMPLETE, no active stage) reversing re-enters last blocking stage.
    const currentIndex = application.phase === ApplicationPhase.REVIEW_COMPLETE
      ? stages.length
      : stages.findIndex(s => s.key === application.workflowStageKey)
    if (currentIndex > 0) {
      return stages[currentIndex - 1]
    }
    return null
  }

  isOwn (application: Application) {
    return application.userInternalId === this.user?.internalId
  }

  mayView (application: Application) {
    if (this.isOwn(application)) return true
    return this.mayViewAsReviewer(application)
  }

  mayViewAsReviewer (application: Application) {
    if (this.isOwn(application) && !this.hasControl('AppRequest', 'review_own')) return false
    return this.hasControl('Application', 'view', application.authorizationKeys)
  }

  maySeeFullStatus (application: Application) {
    if (this.mayViewAsReviewer(application)) return true
    if (application.appRequestPhase === AppRequestPhase.STARTED) return false // While the appRequest is still being filled out, prior to submission, an applicant must never see a decided eligibility status
    return statusVisibleToApplicant(application.phase, application.appRequestPhase)
  }

  mayAdvanceWorkflow (application: Application) {
    // any reviewer can advance the workflow if the requirements have been met, we already
    // control who can answer the prompts so I don't think it's necessary to lock down
    // the advancement
    if (application.closed || application.rescindedStatus === ApplicationRescindedStatus.RESCINDED) return false
    if (application.phase !== ApplicationPhase.READY_FOR_WORKFLOW) return false
    if (application.appRequestComputedStatus === AppRequestStatus.REVIEW_COMPLETE) return false
    if (this.isOwn(application) && !this.hasControl('AppRequest', 'review_own')) return false
    return this.hasControl('AppRequest', 'review', application.appRequestTags)
  }

  mayCompleteApplication (application: Application) {
    if (application.closed || application.rescindedStatus === ApplicationRescindedStatus.RESCINDED) return false
    if (application.appRequestPhase !== AppRequestPhase.WORKFLOW_NONBLOCKING) return false
    if (application.phase !== ApplicationPhase.READY_TO_COMPLETE) return false
    if (this.isOwn(application) && !this.hasControl('AppRequest', 'review_own')) return false
    return this.hasControl('AppRequest', 'review', application.appRequestTags)
  }

  mayReopenApplication (application: Application) {
    if (application.closed || application.rescindedStatus === ApplicationRescindedStatus.RESCINDED) return false
    if (application.appRequestPhase !== AppRequestPhase.WORKFLOW_NONBLOCKING) return false
    if (application.phase !== ApplicationPhase.COMPLETE) return false
    // only a program a reviewer could have marked complete can be reopened. One that completed on its own - screened out before
    // submission, no non-blocking stages, or every one of them past its sunset - has nothing that reopening would make editable
    if (isPresubmissionIneligible(application)) return false
    const stages = programRegistry.get(application.programKey)?.workflowStages ?? []
    if (!stages.some(stage => stage.nonBlocking && !nonBlockingSunsetReached(stage, application.appRequestPhase))) return false
    if (this.isOwn(application) && !this.hasControl('AppRequest', 'review_own')) return false
    return this.hasControl('AppRequest', 'review', application.appRequestTags)
  }

  mayReverseWorkflow (application: Application) {
    if (application.closed || application.rescindedStatus === ApplicationRescindedStatus.RESCINDED || application.appRequestPhase === AppRequestPhase.COMPLETE) return false
    if (![ApplicationPhase.WORKFLOW_BLOCKING, ApplicationPhase.REVIEW_COMPLETE, ApplicationPhase.READY_FOR_WORKFLOW].includes(application.phase)) return false
    // READY_FOR_WORKFLOW could mean we are at the end of a workflow or at the end of review, if end of review we can't reverse
    if (application.phase === ApplicationPhase.READY_FOR_WORKFLOW && !application.workflowStageKey) return false
    if (this.isOwn(application) && !this.hasControl('AppRequest', 'review_own')) return false
    if (!this.hasControl('AppRequest', 'review', application.appRequestTags)) return false
    // Fix for leak of reverse related to blocking workflow stages that only exist while the request is in the review (SUBMITTED) phase
    if (application.appRequestPhase !== AppRequestPhase.SUBMITTED) return false
    // exclude non-blocking workflow stages from the reverse order. a reviewer can
    // never reverse from (or onto) a non-blocking stage, in any AppRequestPhase.  Always open once open.
    const currentStage = programRegistry.getWorkflowStageByKey(application.workflowStageKey)
    return !currentStage?.nonBlocking
  }

  mayRescindApplication (application: Application) {
    if (application.closed || application.rescindedStatus === ApplicationRescindedStatus.RESCINDED) return false // prevent rescinding if application is closed or already rescinded
    if (![ApplicationPhase.REVIEW_COMPLETE, ApplicationPhase.ACCEPTANCE, ApplicationPhase.READY_TO_ACCEPT,
      ApplicationPhase.WORKFLOW_NONBLOCKING, ApplicationPhase.READY_TO_COMPLETE, ApplicationPhase.COMPLETE].includes(application.phase)) return false // what app phase rescinding can occur in
    if (![ApplicationStatus.ELIGIBLE, ApplicationStatus.ACCEPTED].includes(application.status)) return false // only allow rescinding if eligible or accepted (approved to applicant)
    if (this.isOwn(application) && !this.hasControl('AppRequest', 'review_own')) return false
    if (!this.hasControl('AppRequest', 'review', application.appRequestTags)) return false
    if (!this.hasControl('ApplicationApproved', 'rescind', application.appRequestTags)) return false
    return true
  }

  mayRestoreApplication (application: Application) {
    if (application.closed || application.rescindedStatus !== ApplicationRescindedStatus.RESCINDED) return false // prevent restoring if closed or not currently rescinded
    if (this.isOwn(application) && !this.hasControl('AppRequest', 'review_own')) return false
    if (!this.hasControl('AppRequest', 'review', application.appRequestTags)) return false
    if (!this.hasControl('ApplicationApproved', 'restore', application.appRequestTags)) return false
    return true
  }

  async rescindApplication (applicationId: string, reason: string, validateOnly?: boolean) {
    const [application] = await getApplications({ ids: [applicationId] })
    if (!application) throw new Error(`Application not found: ${applicationId}`)
    if (!this.mayRescindApplication(application)) throw new Error('You may not rescind this application.')
    const resp = new ValidatedAppRequestResponse({ success: true, messages: [] })
    if (isBlank(reason)) resp.addMessage('Please provide a reason for rescinding this benefit.', 'reason')
    if (validateOnly || resp.hasErrors()) return resp
    await appRequestTransaction(application.appRequestInternalId, async db => {
      await rescindApplication(application.id, reason, db)
      await evaluateAppRequest(application.appRequestInternalId, db)
    })
    this.loaders.clear()
    resp.appRequest = await this.svc(AppRequestService).findByInternalId(application.appRequestInternalId)
    await this.svc(AppRequestService).recordActivity(resp.appRequest!.internalId, 'Rescinded', { description: `${application.navTitle}: ${reason}` })
    const newApplication = (await this.findByInternalId(application.internalId))!
    try {
      await Promise.all(applicationBenefitRescindRestoreNotifications.map(n => n(this.ctx, resp.appRequest!, newApplication, reason)))
    } catch (err) {
      console.error(err)
    }
    return resp
  }

  async restoreApplication (applicationId: string, reason: string, validateOnly?: boolean) {
    const [application] = await getApplications({ ids: [applicationId] })
    if (!application) throw new Error(`Application not found: ${applicationId}`)
    if (!this.mayRestoreApplication(application)) throw new Error('You may not restore this application.')
    const resp = new ValidatedAppRequestResponse({ success: true, messages: [] })
    if (isBlank(reason)) resp.addMessage('Please provide a reason for restoring this benefit.', 'reason')
    if (validateOnly || resp.hasErrors()) return resp
    await appRequestTransaction(application.appRequestInternalId, async db => {
      await restoreApplication(application.id, reason, db)
      await evaluateAppRequest(application.appRequestInternalId, db)
    })
    this.loaders.clear()
    resp.appRequest = await this.svc(AppRequestService).findByInternalId(application.appRequestInternalId)
    await this.svc(AppRequestService).recordActivity(resp.appRequest!.internalId, 'Restored', { description: `${application.navTitle}: ${reason}` })
    const newApplication = (await this.findByInternalId(application.internalId))!
    try {
      await Promise.all(applicationBenefitRescindRestoreNotifications.map(n => n(this.ctx, resp.appRequest!, newApplication, reason)))
    } catch (err) {
      console.error(err)
    }
    return resp
  }

  async advanceWorkflow (applicationId: string) {
    const [application] = await getApplications({ ids: [applicationId] })
    if (!application) throw new Error(`Application not found: ${applicationId}`)
    if (!this.mayAdvanceWorkflow(application)) throw new Error('You may not advance this application to the next stage.')
    await appRequestTransaction(application.appRequestInternalId, async db => {
      await advanceWorkflow(application.id, db)
      await evaluateAppRequest(application.appRequestInternalId, db)
    })
    this.loaders.clear()
    const resp = new ValidatedAppRequestResponse({ success: true, messages: [] })
    resp.appRequest = await this.svc(AppRequestService).findByInternalId(application.appRequestInternalId)
    const newApplication = (await this.findByInternalId(application.internalId))!
    await this.svc(AppRequestService).recordActivity(resp.appRequest!.internalId, 'Advanced', { description: `${application.navTitle} workflow from ${programRegistry.getWorkflowStageByKey(application.workflowStageKey)?.title ?? 'review'} to ${programRegistry.getWorkflowStageByKey(newApplication.workflowStageKey)?.title ?? 'review complete'}` })
    if (resp.appRequest?.status !== application.appRequestComputedStatus) await appConfig.hooks?.appRequestStatus?.(this.ctx, resp.appRequest!, application.appRequestComputedStatus)
    if (application.phase !== newApplication.phase) {
      await appConfig.hooks?.applicationPhase?.(this.ctx, resp.appRequest!, newApplication.programKey, application.phase)
      await Promise.all(applicationPhaseNotifications.map(n => n(this.ctx, resp.appRequest!, newApplication, application.phase)))
    }
    return resp
  }

  async completeApplication (applicationId: string) {
    const [application] = await getApplications({ ids: [applicationId] })
    if (!application) throw new Error(`Application not found: ${applicationId}`)
    if (!this.mayCompleteApplication(application)) throw new Error('You may not mark this application complete.')
    return await this.changeCompletion(application, 'Completed', `${application.navTitle} marked complete`, async db => { await completeApplication(application.id, db) })
  }

  async reopenApplication (applicationId: string) {
    const [application] = await getApplications({ ids: [applicationId] })
    if (!application) throw new Error(`Application not found: ${applicationId}`)
    if (!this.mayReopenApplication(application)) throw new Error('You may not reopen this application.')
    return await this.changeCompletion(application, 'Reopened', `${application.navTitle} reopened for non-blocking workflow`, async db => { await reopenApplication(application.id, db) })
  }

  private async changeCompletion (application: Application, action: string, description: string, change: (db: Parameters<Parameters<typeof appRequestTransaction>[1]>[0]) => Promise<void>) {
    await appRequestTransaction(application.appRequestInternalId, async db => {
      await change(db)
      await evaluateAppRequest(application.appRequestInternalId, db)
    })
    this.loaders.clear()
    const resp = new ValidatedAppRequestResponse({ success: true, messages: [] })
    resp.appRequest = await this.svc(AppRequestService).findByInternalId(application.appRequestInternalId)
    const newApplication = (await this.findByInternalId(application.internalId))!
    await this.svc(AppRequestService).recordActivity(resp.appRequest!.internalId, action, { description })
    if (resp.appRequest?.status !== application.appRequestComputedStatus) await appConfig.hooks?.appRequestStatus?.(this.ctx, resp.appRequest!, application.appRequestComputedStatus)
    if (application.phase !== newApplication.phase) {
      await appConfig.hooks?.applicationPhase?.(this.ctx, resp.appRequest!, newApplication.programKey, application.phase)
      await Promise.all(applicationPhaseNotifications.map(n => n(this.ctx, resp.appRequest!, newApplication, application.phase)))
    }
    return resp
  }

  /**
   * Move the application back to a previous workflow stage or back into review
   *
   * @param applicationId The application to move back
   * @param stage The stage to move back to, if not provided the application will be moved back into review
   */
  async reverseWorkflow (applicationId: string, stage?: number) {
    const [application] = await getApplications({ ids: [applicationId] })
    if (!application) throw new Error(`Application not found: ${applicationId}`)
    if (!this.mayReverseWorkflow(application)) throw new Error('You may not reverse this application to a previous stage.')
    await appRequestTransaction(application.appRequestInternalId, async db => {
      await reverseWorkflow(application.id, db)
      await evaluateAppRequest(application.appRequestInternalId, db)
    })
    this.loaders.clear()
    const resp = new ValidatedAppRequestResponse({ success: true, messages: [] })
    resp.appRequest = await this.svc(AppRequestService).findByInternalId(application.appRequestInternalId)
    const newApplication = (await this.findByInternalId(application.internalId))!
    await this.svc(AppRequestService).recordActivity(resp.appRequest!.internalId, 'Reversed', { description: `${application.navTitle} workflow from ${programRegistry.getWorkflowStageByKey(application.workflowStageKey)?.title ?? (application.appRequestPhase === AppRequestPhase.SUBMITTED ? 'review complete' : 'completion')} to ${programRegistry.getWorkflowStageByKey(newApplication.workflowStageKey)?.title ?? 'review'}` })
    if (resp.appRequest?.status !== application.appRequestComputedStatus) await appConfig.hooks?.appRequestStatus?.(this.ctx, resp.appRequest!, application.appRequestComputedStatus)
    if (application.phase !== newApplication.phase) await appConfig.hooks?.applicationPhase?.(this.ctx, resp.appRequest!, newApplication.programKey, application.phase)
    return resp
  }
}
