import { Field, ID, InputType, ObjectType, registerEnumType } from 'type-graphql'
import { ApplicationRow, AppRequestPhase, AppRequestStatus, AppRequestStatusDB, parseProgramLabels, ProgramDefinitionProcessed, programRegistry, resolveProgramLabels } from '../internal.js'

export enum ApplicationStatus {
  PENDING = 'PENDING',
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  RESCINDED = 'RESCINDED'
}
registerEnumType(ApplicationStatus, {
  name: 'ApplicationStatus',
  description: `
    The status of an application. This is usually a computed field, not stored in the database. The status
    is computed based on the status of the appRequest and of the requirements for the program. If
    the appRequest is CLOSED or CANCELLED, this status will remain frozen wherever it was before the
    closure / cancellation.
  `,
  valuesConfig: {
    PENDING: { description: 'The application status has not yet been determined. Further prompts must be answered.' },
    ELIGIBLE: { description: 'Every requirement the current phase evaluates is resolving as MET (or NOT_APPLICABLE or WARNING). Before submission that is only the applicant requirements (PREQUAL, QUALIFICATION, POSTQUAL), so ELIGIBLE means nothing so far disqualifies - not that the program has been approved. After submission it covers all requirements up to and including WORKFLOW_BLOCKING. If there is an acceptance phase, the acceptance is still pending.' },
    INELIGIBLE: { description: 'At least one application requirement up to and including WORKFLOW_BLOCKING requirements is not met. The review cannot proceed, but the first or current stage of the workflow should still continue.' },
    ACCEPTED: { description: 'An offer was made to the applicant and all ACCEPTANCE requirements are met (the applicant accepted the offer).' },
    REJECTED: { description: 'An offer was made to the applicant and at least one ACCEPTANCE requirement is not met (the applicant rejected the offer).' },
    RESCINDED: { description: 'The application has been rescinded (pulled back from applicant) post approval.' }
  }
})

export enum ApplicationPhase {
  PREQUAL = 'PREQUAL',
  QUALIFICATION = 'QUALIFICATION',
  READY_TO_SUBMIT = 'READY_TO_SUBMIT',
  PREAPPROVAL = 'PREAPPROVAL',
  APPROVAL = 'APPROVAL',
  READY_FOR_WORKFLOW = 'READY_FOR_WORKFLOW',
  WORKFLOW_BLOCKING = 'WORKFLOW_BLOCKING',
  REVIEW_IN_PROGRESS = 'REVIEW_IN_PROGRESS',
  REVIEW_COMPLETE = 'REVIEW_COMPLETE',
  ACCEPTANCE = 'ACCEPTANCE',
  READY_TO_ACCEPT = 'READY_TO_ACCEPT',
  WORKFLOW_NONBLOCKING = 'WORKFLOW_NONBLOCKING',
  READY_TO_COMPLETE = 'READY_TO_COMPLETE',
  COMPLETE = 'COMPLETE'
}

registerEnumType(ApplicationPhase, {
  name: 'ApplicationPhase',
  description: `
    The phase of the application. This is usually a computed field, not stored in the database. The phase
    is computed based on the status of the appRequest and of the requirements for the program.
  `,
  valuesConfig: {
    PREQUAL: { description: 'The appRequest has not finished pre-qual yet. The application doesn\'t properly exist yet.' },
    QUALIFICATION: { description: 'The applicant is filling out their portion of prompts and has not yet finished.' },
    READY_TO_SUBMIT: { description: 'The applicant has filled out their portion of the prompts but has not yet submitted for review.' },
    PREAPPROVAL: { description: 'The applicant has submitted the application, but there are automated prompts that need to be filled in before the application will appear on a reviewer\'s dashboard.' },
    APPROVAL: { description: 'The applicant has submitted the application and any PREAPPROVAL requirements are passing. The application is pending review.' },
    READY_FOR_WORKFLOW: { description: 'No application requirements are PENDING. The application is ready for the first or next blocking workflow stage, or for REVIEW_COMPLETE, but a reviewer must manually advance the phase. This phase will be automatically skipped if there are no workflow stages configured/enabled. It is not used during non-blocking workflow; see READY_TO_COMPLETE.' },
    WORKFLOW_BLOCKING: { description: 'The application review has been completed and now there is a workflow process to audit the review BEFORE marking the application status as eligible or ineligible. It should remain pending until the blocking workflow stages have been completed. Workflow stages that evaluate to INELIGIBLE will also make the application status INELIGIBLE. Prompts from the applicant and review phases are locked.' },
    REVIEW_IN_PROGRESS: { description: 'The review for this application is currently in progress (some APPROVAL requirement prompt data has been input)' },
    REVIEW_COMPLETE: { description: 'The application has been reviewed and any blocking workflow stages have been completed. Its results (whether eligible or not) are released to the applicant as soon as it reaches this phase - the eligibility decision no longer waits for the appRequest Complete Review. A reviewer must still manually advance the appRequest phase, so the application will sit in this state until all applications are REVIEW_COMPLETE and the reviewer completes the review. If there is no acceptance phase, or if the application is not eligible, the makeOffer prompt will move the phase to WORKFLOW_NONBLOCKING or COMPLETE.' },
    ACCEPTANCE: { description: 'The application has been reviewed and an offer has been made to the applicant. The applicant must accept the offer.' },
    READY_TO_ACCEPT: { description: 'An offer has been made to the applicant. The acceptance requirements are no longer pending, the application is ready to be finalized.' },
    WORKFLOW_NONBLOCKING: { description: 'The appRequest is in its non-blocking workflow phase and this application still has a non-blocking workflow requirement that is PENDING. Non-blocking stages are not sequential, all of them are open at once. Requirements from non-blocking workflow stages cannot affect the application status, but the application will not proceed until all of them are non-PENDING.' },
    READY_TO_COMPLETE: { description: 'None of the non-blocking workflow requirements are PENDING, but their prompts can still be edited. A reviewer must mark the program complete (completeApplication) to move it to COMPLETE. Skipped when there is nothing left for a reviewer to edit - no non-blocking stages, or every one of them past its nonBlockingSunset.' },
    COMPLETE: { description: 'There is nothing left to do on this application. If there was a workflow, it is complete and its prompts, non-blocking ones included, are locked. If there was an acceptance phase, the offer was accepted or rejected. The appRequest may still be waiting on other applications or on its own Complete; until then a reviewer may reopen the application (reopenApplication) to correct its non-blocking workflow.' }
  }
})

export enum IneligiblePhases {
  PREQUAL = 'PREQUAL',
  QUALIFICATION = 'QUALIFICATION',
  PREAPPROVAL = 'PREAPPROVAL',
  APPROVAL = 'APPROVAL',
  WORKFLOW = 'WORKFLOW',
  ACCEPTANCE = 'ACCEPTANCE'
}

registerEnumType(IneligiblePhases, {
  name: 'IneligiblePhases',
  valuesConfig: {
    PREQUAL: { description: 'The application was disqualified by a PREQUAL requirement. Names the type of requirement that failed, not when it failed - a reviewer changing an applicant answer after submission can also produce this.' },
    QUALIFICATION: { description: 'The application was disqualified by a QUALIFICATION or POSTQUAL requirement. Names the type of requirement that failed, not when it failed - a reviewer changing an applicant answer after submission can also produce this.' },
    PREAPPROVAL: { description: 'The application was disqualified by a PREAPPROVAL requirement.' },
    APPROVAL: { description: 'The application was disqualified by an APPROVAL requirement.' },
    WORKFLOW: { description: 'The application was disqualified by a blocking workflow requirement.' },
    ACCEPTANCE: { description: 'The application was disqualified by an ACCEPTANCE requirement.' }
  }
})

export enum ApplicationRescindedStatus {
  RESCINDED = 'RESCINDED',
  RESTORED = 'RESTORED'
}
registerEnumType(ApplicationRescindedStatus, {
  name: 'ApplicationRescindedStatus',
  description: `
    The rescinded status of an application.
  `,
  valuesConfig: {
    RESCINDED: { description: 'The application has been rescinded (pulled back from applicant) post approval.' },
    RESTORED: { description: 'The application, which was previously rescinded, has now been restored to its state prior to rescinding.' }
  }
})

/**
 * rescinded is derived rather than stored. The underlying status stays in the computedStatus column
 * so that restoring an application recovers the exact status it had before it was rescinded. required
 * because there are phases where the status is frozen and could not be recomputed from the requirements.
 */
export function deriveApplicationStatus (computedStatus: ApplicationStatus, rescindedStatus?: ApplicationRescindedStatus) {
  return rescindedStatus === ApplicationRescindedStatus.RESCINDED && (computedStatus === ApplicationStatus.ELIGIBLE || computedStatus === ApplicationStatus.ACCEPTED)
    ? ApplicationStatus.RESCINDED
    : computedStatus
}

@ObjectType({ description: 'An application represents the applicant applying to a specific program. Each appRequest has multiple applications - one per program defined in the system. Some applications are mutually exclusive and/or will be eliminated early based on PREQUAL requirements, but they all technically exist in the data model - there is no concept of picking one application over another, just two applications where one dies and the other survives.' })
export class Application {
  constructor (row: ApplicationRow) {
    this.program = programRegistry.get(row.programKey)
    this.internalId = row.id
    this.id = String(row.id)
    this.appRequestInternalId = row.appRequestId
    this.appRequestId = String(row.appRequestId)
    this.userInternalId = row.userId
    this.periodId = String(row.periodId)
    this.programKey = row.programKey
    this.evaluationOrder = row.evaluationOrder
    this.phase = row.computedPhase
    this.ineligiblePhase = row.computedIneligiblePhase
    this.workflowStageKey = row.workflowStage
    this.computedStatus = row.computedStatus
    this.rescindedStatus = row.rescindedStatus
    this.status = deriveApplicationStatus(this.computedStatus, this.rescindedStatus)
    this.statusReason = row.computedStatusReason
    this.awaitingCorrection = !!row.computedAwaitingCorrection
    this.ineligiblePreSubmit = !!row.ineligiblePreSubmit
    const { title, navTitle } = resolveProgramLabels(this.program, parseProgramLabels(row.programLabels))
    this.title = title
    this.navTitle = navTitle
    this.applicantDescription = this.program.applicantDescription
    this.eligibilityDescription = this.program.eligibilityDescription
    this.authorizationKeys = { program: [this.program.key] }
    this.closed = row.appRequestStatus !== AppRequestStatusDB.OPEN
    this.appRequestPhase = row.appRequestPhase
    this.appRequestStatus = row.appRequestStatus
    this.appRequestComputedStatus = row.appRequestComputedStatus
    this.rescindedReason = row.rescindedReason
    this.restoredReason = row.restoredReason
  }

  @Field(() => ID)
  id: string

  @Field(type => ApplicationPhase, { description: 'The phase of the application. This is usually a computed field, not stored in the database.' })
  phase: ApplicationPhase

  @Field(type => IneligiblePhases, { nullable: true, description: 'The phase in which this application became ineligible for benefits. Useful for reporting / filtering. Null if the application is not (yet) ineligible.' })
  ineligiblePhase?: IneligiblePhases

  @Field(() => ApplicationStatus)
  status: ApplicationStatus

  @Field({ nullable: true, description: 'When one of the application\'s requirements is failing or throwing a warning, its reason will be copied here for convenience. If there is a warning and then later a failure, the failure reason will win.' })
  statusReason?: string

  @Field({ description: 'True when at least one reachable prompt on this application has been invalidated and must be re-answered. Status is still computed from the answers on file, so pair status displays with this flag to indicate that a correction is outstanding.' })
  awaitingCorrection: boolean

  @Field(type => Boolean, { description: 'True when the program sets showIneligiblePreSubmit: false and this application is hidden by it: ineligible because of an applicant requirement, and that ineligibility arose before submission (the request is unsubmitted, or the application was already ineligible when it was submitted). Only the applicant ever receives a hidden application, so they can still change the answers that disqualified them; UIs should leave it out of program lists.' })
  get hiddenIneligiblePreSubmit (): boolean {
    if (this.program.showIneligiblePreSubmit !== false) return false
    if (this.ineligiblePhase !== IneligiblePhases.PREQUAL && this.ineligiblePhase !== IneligiblePhases.QUALIFICATION) return false
    return this.appRequestPhase === AppRequestPhase.STARTED || this.ineligiblePreSubmit
  }

  @Field({ description: 'The title of the program this application is for.' })
  title: string

  @Field({ description: 'The navigation title of the program this application is for.' })
  navTitle: string

  @Field({ nullable: true, description: 'A brief description, written for applicants, of the program this application is for.' })
  applicantDescription?: string

  @Field({ nullable: true, description: 'A prose summary of the applicant-side requirements of the program this application is for. Intended to be shown alongside statusReason when the application becomes ineligible before submission, since an applicant disqualified early may never have seen the program\'s prompts and the statusReason alone lacks context.' })
  eligibilityDescription?: string

  @Field({ description: 'The program key this application corresponds to.' })
  programKey: string

  @Field(type => ApplicationRescindedStatus, { nullable: true, description: 'The application rescinded status' })
  rescindedStatus?: ApplicationRescindedStatus

  @Field({ nullable: true, description: 'The reason the application was rescinded' })
  rescindedReason?: string

  @Field({ nullable: true, description: 'The reason the application was restored after previously being rescinded' })
  restoredReason?: string

  internalId: number
  evaluationOrder: number
  computedStatus: ApplicationStatus
  ineligiblePreSubmit: boolean
  appRequestInternalId: number
  appRequestId: string
  appRequestTags?: Record<string, string[]>
  userInternalId: number
  periodId: string
  program: ProgramDefinitionProcessed
  authorizationKeys: Record<string, string[]>
  workflowStageKey?: string
  closed: boolean
  appRequestPhase: AppRequestPhase
  appRequestStatus: AppRequestStatusDB
  appRequestComputedStatus: AppRequestStatus
}

@ObjectType()
export class ApplicationActions {}

@InputType()
export class ApplicationFilter {
  @Field(() => [ID], { nullable: true })
  ids?: string[]

  @Field(() => [ID], { nullable: true })
  appRequestIds?: string[]
}
