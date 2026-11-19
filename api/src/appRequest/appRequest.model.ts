import { DateTime } from 'luxon'
import { Field, ID, InputType, Int, ObjectType, registerEnumType } from 'type-graphql'
import { ApplicationRescindedStatus, ApplicationStatus, AppRequestActivityRow, AppRequestRow, AppRequestStatusDB, JsonData, PromptTagDefinition, RequirementStatus } from '../internal.js'
import { ValidatedResponse } from '@txstate-mws/graphql-server'

export enum AppRequestStatus {
  STARTED = 'STARTED',
  DISQUALIFIED = 'DISQUALIFIED',
  READY_TO_SUBMIT = 'READY_TO_SUBMIT',
  PREAPPROVAL = 'PREAPPROVAL',
  APPROVAL = 'APPROVAL',
  REVIEW_IN_PROGRESS = 'REVIEW_IN_PROGRESS',
  REVIEW_COMPLETE = 'REVIEW_COMPLETE',
  ACCEPTANCE = 'ACCEPTANCE',
  NOT_APPROVED = 'NOT_APPROVED',
  APPROVED = 'APPROVED',
  READY_TO_ACCEPT = 'READY_TO_ACCEPT',
  ACCEPTED = 'ACCEPTED',
  NOT_ACCEPTED = 'NOT_ACCEPTED',
  WITHDRAWN = 'WITHDRAWN',
  CANCELLED = 'CANCELLED'
}
registerEnumType(AppRequestStatus, {
  name: 'AppRequestStatus',
  description: `
    The status of an appRequest. This status is computed based on the "dbStatus" recorded in
    the database and the status of each application.
  `,
  valuesConfig: {
    [AppRequestStatus.STARTED]: { description: 'Applicant has begun the process and has not yet submitted.' },
    [AppRequestStatus.DISQUALIFIED]: { description: 'Applicant has not yet submitted but ALL applications have been disqualified. Applicant may continue editing prompts until the App Request is closed.' },
    [AppRequestStatus.READY_TO_SUBMIT]: { description: 'Applicant has completed all prompts and is ready to submit. At least one application is eligible to proceed.' },
    [AppRequestStatus.PREAPPROVAL]: { description: 'Applicant has submitted and we are waiting for pre-approval requirements to resolve (these are automations like waiting for data to show up in an external system).' },
    [AppRequestStatus.APPROVAL]: { description: 'Applicant has submitted and any pre-approval requirements have been met. We are waiting for a reviewer to do their part.' },
    [AppRequestStatus.REVIEW_IN_PROGRESS]: { description: 'A reviewer has begun their part on at least one application, or at least one application is ready for or in a blocking workflow stage, but the review has not finished yet.' },
    [AppRequestStatus.REVIEW_COMPLETE]: { description: 'All applications have been reviewed and any blocking workflow stages have been completed. The application is ready for results to be released to the applicant.' },
    [AppRequestStatus.ACCEPTANCE]: { description: 'Reviewer has approved an offer and we are waiting for the applicant to accept. This status is unreachable if the period has no ACCEPTANCE requirements.' },
    [AppRequestStatus.APPROVED]: { description: 'Results have been released to the applicant, there is no acceptance phase, and at least one application was found eligible.' },
    [AppRequestStatus.NOT_APPROVED]: { description: 'Results have been released to the applicant, there is no acceptance phase, and all applications were found ineligible.' },
    [AppRequestStatus.READY_TO_ACCEPT]: { description: 'Applicant has been offered, satisfied all acceptance requirements and is ready to accept. This status is unreachable if the period has no ACCEPTANCE requirements.' },
    [AppRequestStatus.ACCEPTED]: { description: 'Applicant has accepted an offer on at least one application and no applications are still pending acceptance.' },
    [AppRequestStatus.NOT_ACCEPTED]: { description: 'Applicant has responded to the offer, but did not accept an offer on any application.' },
    [AppRequestStatus.WITHDRAWN]: { description: 'Applicant withdrew the request after submitting. The request must be re-opened (if eligible) to be edited again.' },
    [AppRequestStatus.CANCELLED]: { description: 'Applicant cancelled the request before submitting. The applicant may be permitted to uncancel and continue, if the period is still open.' }
  }
})

export enum AppRequestPhase {
  // The request has been started but not yet submitted.
  STARTED = 'STARTED',
  // The request has been submitted for review. Reviewers and blocking-workflow auditors
  // need to finish their work before an offer is made to the applicant.
  SUBMITTED = 'SUBMITTED',
  // At least one application has been approved by the reviewer and the reviewer
  // moved it to this state where we are waiting for the applicant to accept the offer(s).
  ACCEPTANCE = 'ACCEPTANCE',
  // The request has moved past ACCEPTANCE and is ready for each application to begin
  // its non-blocking workflow. If there is no non-blocking workflow, the applications should
  // be marked complete and this status should move to CLOSED.
  WORKFLOW_NONBLOCKING = 'WORKFLOW_NONBLOCKING',
  COMPLETE = 'COMPLETE'
}

registerEnumType(AppRequestPhase, {
  name: 'AppRequestPhase',
  description: 'The current phase of the app request. The phase generally only changes when control of the app request shifts between the applicant and reviewer.',
  valuesConfig: {
    [AppRequestPhase.STARTED]: { description: 'Applicant has begun the process and has not yet submitted.' },
    [AppRequestPhase.SUBMITTED]: { description: 'Applicant has submitted and we are waiting for reviewers to do their part.' },
    [AppRequestPhase.ACCEPTANCE]: { description: 'Reviewer has approved an offer and we are waiting for the applicant to accept. This phase is unreachable if the period has no ACCEPTANCE requirements.' },
    [AppRequestPhase.WORKFLOW_NONBLOCKING]: { description: 'The request has moved past ACCEPTANCE and is ready for each application to begin its non-blocking workflow. This phase is unreachable if the period has no non-blocking workflow stages.' },
    [AppRequestPhase.COMPLETE]: { description: 'All applications are complete and any non-blocking workflow is complete. The request is not necessarily closed, as that is an additional status, but nothing else needs be done to it.' }
  }
})

/**
 * Although the AppRequestPhase enum currently lists phases in chronological order,
 * this is intended to guarantee expected order.  Safety since AppRequestPhase
 * doesn't explicitly project order.
 */
export const appRequestPhaseOrder: AppRequestPhase[] = [
  AppRequestPhase.STARTED,
  AppRequestPhase.SUBMITTED,
  AppRequestPhase.ACCEPTANCE,
  AppRequestPhase.WORKFLOW_NONBLOCKING,
  AppRequestPhase.COMPLETE
]

/**
 * Returns true if current is at or beyond target in the natural phase progression. created
 * specifically for non blocking workflows to confirm emergence phase has been reached
 * so its requirements should become visible/editable for the remainder of the life cycle.
 */
export function appRequestPhaseReached (current: AppRequestPhase, target: AppRequestPhase) {
  return appRequestPhaseOrder.indexOf(current) >= appRequestPhaseOrder.indexOf(target)
}

@ObjectType({ description: 'Represents a group of applications all being applied for at the same time. As part of the request, multiple applications will be created and either eliminated as ineligible or submitted for approval.' })
export class AppRequest {
  constructor (row: AppRequestRow, tags?: Record<string, string[]>) {
    this.id = String(row.id)
    this.internalId = row.id
    this.dbStatus = row.status
    this.status = row.computedStatus
    this.phase = row.phase
    this.createdAt = DateTime.fromJSDate(row.createdAt)
    this.updatedAt = DateTime.fromJSDate(row.updatedAt)
    this.submittedAt = row.submittedAt ? DateTime.fromJSDate(row.submittedAt) : undefined
    this.closedAt = row.closedAt ? DateTime.fromJSDate(row.closedAt) : undefined
    this.userInternalId = row.userId
    this.periodId = String(row.periodId)
    this.periodCode = row.periodCode ?? undefined
    this.periodClosesAt = row.periodClosesAt ? DateTime.fromJSDate(row.periodClosesAt) : undefined
    this.periodArchivesAt = row.periodArchivesAt ? DateTime.fromJSDate(row.periodArchivesAt) : undefined
    this.periodOpensAt = DateTime.fromJSDate(row.periodOpensAt)
    this.tags = tags ?? {}
    this.dataVersion = row.dataVersion
    this.readyToComplete = !!row.computedReadyToComplete
    this.awaitingCorrection = !!row.computedAwaitingCorrection
  }

  @Field(type => ID)
  id: string

  @Field(type => AppRequestPhase, { description: 'The current phase of the app request. The phase generally only changes when control of the app request shifts between the applicant and reviewer.' })
  phase: AppRequestPhase

  @Field(type => AppRequestStatus)
  status: AppRequestStatus

  @Field()
  createdAt: DateTime

  @Field()
  updatedAt: DateTime

  @Field({ nullable: true, description: 'The date that the applicant submitted their request. If the applicant has not yet submitted, this will be null.' })
  submittedAt?: DateTime

  @Field({ nullable: true, description: 'Date that this request was considered closed and no longer editable. If active or re-opened, will be null. If closed again, will be the second closure date.' })
  closedAt?: DateTime

  @Field(type => Int, { description: 'The version of the data for this app request. This is incremented every time the data is updated. If you provide it with your update requests, the API will perform an optimistic concurrency check and fail the update if someone else has updated the data in the meantime.' })
  dataVersion: number

  @Field({ description: 'True when at least one reachable prompt anywhere on this request has been invalidated and must be re-answered. Status and phase are computed from the answers on file, so use this flag to explain that the request is held back awaiting a correction.' })
  awaitingCorrection: boolean

  periodClosesAt?: DateTime
  periodArchivesAt?: DateTime
  periodOpensAt: DateTime
  dbStatus: AppRequestStatusDB
  internalId: number
  userInternalId: number
  periodId: string
  periodCode?: string
  tags?: Record<string, string[]>
  readyToComplete: boolean
}

export enum AppRequestIndexDestination {
  APPLICANT_DASHBOARD = 'APPLICANT_DASHBOARD',
  REVIEWER_DASHBOARD = 'REVIEWER_DASHBOARD',
  APP_REQUEST_LIST = 'APP_REQUEST_LIST',
  LIST_FILTERS = 'LIST_FILTERS'
}
registerEnumType(AppRequestIndexDestination, {
  name: 'AppRequestIndexDestination',
  description: 'This is used to indicate where the index values should be displayed.',
  valuesConfig: {
    [AppRequestIndexDestination.APPLICANT_DASHBOARD]: { description: 'Show these index values when listing App Requests on the applicant dashboard.' },
    [AppRequestIndexDestination.REVIEWER_DASHBOARD]: { description: 'Show these index values when listing App Requests on the reviewer dashboard.' },
    [AppRequestIndexDestination.APP_REQUEST_LIST]: { description: 'Show these index values when listing App Requests in the main list page.' },
    [AppRequestIndexDestination.LIST_FILTERS]: { description: 'Allow the user to filter on these index values on the main list page.' }
  }
})

@ObjectType()
export class IndexValue {
  constructor (tag: string, label: string | undefined) {
    this.value = tag
    this.label = label ?? tag
  }

  @Field()
  value: string

  @Field()
  label: string
}

@InputType()
export class AppRequestIndexFilter {
  @Field()
  category!: string

  @Field(type => [String])
  tags!: string[]
}

@InputType({ description: 'Matches an application by its stored status and, optionally, its rescind state. Status is the stored computedStatus, so RESCINDED is not a valid value here - express it as status ELIGIBLE or ACCEPTED with rescindedStatus RESCINDED.' })
export class ApplicationStatusFilter {
  @Field(type => ApplicationStatus)
  status!: ApplicationStatus

  @Field(type => ApplicationRescindedStatus, { nullable: true, description: 'When omitted, matches applications currently in the given status (not rescinded). When given, matches only applications in exactly that rescind state.' })
  rescindedStatus?: ApplicationRescindedStatus
}

@ObjectType({ description: 'This represents an index as registered by one of the project\'s prompt definitions.' })
export class IndexCategory {
  constructor (def: PromptTagDefinition) {
    this.category = def.category
    this.categoryLabel = def.categoryLabel ?? def.category
    this.listable = !def.notListable
    this[AppRequestIndexDestination.APPLICANT_DASHBOARD] = def.useInApplicantDashboard ?? 0
    this[AppRequestIndexDestination.REVIEWER_DASHBOARD] = def.useInReviewerDashboard ?? 0
    this[AppRequestIndexDestination.APP_REQUEST_LIST] = def.useInAppRequestList ?? 0
    this[AppRequestIndexDestination.LIST_FILTERS] = def.useInListFilters ?? 0
    this.applicantDashboardPriority = this[AppRequestIndexDestination.APPLICANT_DASHBOARD]
    this.reviewerDashboardPriority = this[AppRequestIndexDestination.REVIEWER_DASHBOARD]
    this.appRequestListPriority = this[AppRequestIndexDestination.APP_REQUEST_LIST]
    this.listFiltersPriority = this[AppRequestIndexDestination.LIST_FILTERS]
  }

  @Field({ description: 'The internal category name for this index. Use this with any GraphQL filters.' })
  category: string

  @Field({ description: 'A human-friendly label for this category that can be shown in the UI.' })
  categoryLabel: string

  @Field({ description: 'If true, this category has few enough values that it is reasonable to list them all in a dropdown or similar UI control. If false, the list of values is likely to get very long and it would be better to use an autofill combobox or something.' })
  listable: boolean

  @Field({ nullable: true, description: 'If this is > 0, the index values should be shown on the applicant dashboard, sorted by this priority in descending order.' })
  applicantDashboardPriority?: number

  @Field({ nullable: true, description: 'If this is > 0, the index values should be shown on the reviewer dashboard, sorted by this priority in descending order.' })
  reviewerDashboardPriority?: number

  @Field({ nullable: true, description: 'If this is > 0, the index values should be shown on the main app request list page, sorted by this priority in descending order.' })
  appRequestListPriority?: number

  @Field({ nullable: true, description: 'If this is > 0, the index values should be shown on the list filters, sorted by this priority in descending order.' })
  listFiltersPriority?: number

  [AppRequestIndexDestination.APPLICANT_DASHBOARD]: number
  [AppRequestIndexDestination.REVIEWER_DASHBOARD]: number
  [AppRequestIndexDestination.APP_REQUEST_LIST]: number
  [AppRequestIndexDestination.LIST_FILTERS]: number
}

@ObjectType({ description: 'This represents an index category attached to an app request. Its tagStrings property contains the tag values that have been extracted from the app request data.' })
export class AppRequestIndexCategory extends IndexCategory {
  constructor (def: PromptTagDefinition, public tagStrings: string[]) {
    super(def)
  }
}

@ObjectType()
export class AppRequestActions {}

@ObjectType({ description: 'Applicant counts for a set of appRequests. A request is a returning application when its applicant also submitted a request in an earlier period (by open date); otherwise it is a first-time application. Unsubmitted drafts in earlier periods do not count.' })
export class AppRequestApplicantCounts {
  @Field(type => Int, { description: 'Matching appRequests whose applicant submitted nothing in any earlier period.' })
  firstTime!: number

  @Field(type => Int, { description: 'Matching appRequests whose applicant also submitted a request in an earlier period.' })
  returning!: number
}

@InputType()
export class AppRequestFilter {
  constructor () {
    this.searchNotes = false
  }

  @Field(type => [ID], { nullable: true })
  ids?: string[]

  @Field(type => [AppRequestStatus], { nullable: true })
  status?: AppRequestStatus[]

  @Field(type => [ApplicationRescindedStatus], { nullable: true, description: 'Only return appRequests where at least one application is in one of the given rescinded states. Rescinding is per-application, so this is independent of the appRequest status.' })
  rescindedStatus?: ApplicationRescindedStatus[]

  @Field(type => [ID], { nullable: true, description: 'Only return appRequests that have an application for one of the given programs. When applicationStatuses is also given, the same application must match both.' })
  programKeys?: string[]

  @Field(type => [ApplicationStatusFilter], { nullable: true, description: 'Only return appRequests with at least one application matching one of the given entries (OR). When programKeys is also given, the same application must match both.' })
  applicationStatuses?: ApplicationStatusFilter[]

  @Field(type => [ID], { nullable: true })
  periodIds?: string[]

  @Field(type => [ID], { nullable: true, description: 'Only return appRequests that are owned by one the given logins.' })
  logins?: string[]

  @Field({ nullable: true, description: 'Only return appRequests that are owned by the current user.' })
  own?: boolean

  @Field({ nullable: true, description: 'true -> only return appRequests that are complete (i.e. no more work to do, everything including nonblocking workflow is done). false -> only return appRequests that are not complete. null -> return all appRequests. Complete does not necessarily mean closed.' })
  complete?: boolean

  @Field({ nullable: true, description: 'true -> only return appRequests that are closed. false -> only return appRequests that are open. null -> return all appRequests.' })
  closed?: boolean

  @Field(type => [AppRequestIndexFilter], { nullable: true, description: 'Only return appRequests that match one of the given indexes.' })
  indexes?: AppRequestIndexFilter[]

  @Field(type => String, { nullable: true, description: 'Search for appRequests that match this search term. This will do a prefix search across all fields that are indexed.' })
  search?: string

  searchNotes?: boolean

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were created after this date.' })
  createdAfter?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were created before this date.' })
  createdBefore?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were updated after this date.' })
  updatedAfter?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were updated before this date.' })
  updatedBefore?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were submitted after this date. App Requests that have not been submitted will be filtered out.' })
  submittedAfter?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were submitted before this date. App Requests that have not been submitted will be filtered out.' })
  submittedBefore?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were closed after this date. Open appRequests will be filtered out.' })
  closedAfter?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Only return appRequests that were closed before this date. Open appRequests will be filtered out.' })
  closedBefore?: DateTime

  @Field({ nullable: true, description: 'Only return appRequests that have had their review started. true -> return review started, false -> return not started. Note that this is NOT mutually exclusive with complete or closed, it very simply means that a non-applicant has taken an action on it.' })
  reviewStarted?: boolean

  internalIds?: number[]
  userInternalIds?: number[]
}

@ObjectType({ description: 'A helper message a requirement attached to specific form fields of a prompt.' })
export class PromptFieldReason {
  @Field(type => [String], { description: 'Dotted paths into the prompt\'s data naming the form fields the message belongs on.' })
  fields!: string[]

  @Field({ nullable: true, description: 'The message for those fields. When null, the statusReason of the enclosing entry applies.' })
  message?: string

  @Field(type => RequirementStatus, { nullable: true, description: 'How the message should be presented under those fields. Presentation only. When null, the status of the enclosing entry applies.' })
  status?: RequirementStatus
}

@ObjectType({ description: 'What one requirement currently has to say about one prompt: its status, its overall reason, and any messages aimed at individual form fields.' })
export class PromptStatusReason {
  @Field(type => RequirementStatus)
  status!: RequirementStatus

  @Field({ nullable: true, description: 'The requirement\'s overall reason for its status.' })
  statusReason?: string

  @Field({ description: 'The title of the program whose application this requirement belongs to.' })
  programName!: string

  @Field({ description: 'True when the requirement explicitly named this prompt in its blame. False when the requirement named nothing and the prompt is implicated only by belonging to it.' })
  blamed!: boolean

  @Field(type => [PromptFieldReason], { description: 'Messages aimed at individual form fields of this prompt. Empty when the requirement named no fields.' })
  fieldReasons!: PromptFieldReason[]
}

@ObjectType()
export class ValidatedAppRequestResponse extends ValidatedResponse {
  @Field(type => AppRequest, { nullable: true })
  appRequest?: AppRequest

  @Field(type => [PromptStatusReason], { nullable: true, description: 'Returned by updatePrompt: what each requirement has to say about the prompt being updated. With validateOnly this reflects the unsaved answer, evaluated without being stored, so a form can show requirement feedback as the user types; otherwise it reflects what was just saved. Null from other mutations.' })
  statusReasons?: PromptStatusReason[]
}

@ObjectType()
export class AppRequestActivity {
  constructor (row: AppRequestActivityRow) {
    this.id = String(row.id)
    this.appRequestId = String(row.appRequestId)
    this.appRequestInternalId = row.appRequestId
    this.userInternalId = row.userId
    this.impersonatedBy = row.impersonatedBy
    this.action = row.action
    this.description = row.description
    this.data = row.data ? JSON.parse(row.data) : undefined
    this.createdAt = DateTime.fromJSDate(row.createdAt)
  }

  appRequestId!: string
  appRequestInternalId!: number
  userInternalId!: number
  impersonatedBy?: number

  @Field(type => ID)
  id: string

  @Field()
  action!: string

  @Field({ nullable: true, description: 'A detailed description of the activity. This is not meant to be filtered and could contain specific details about the action.' })
  description?: string

  @Field(type => JsonData, { nullable: true, description: 'A JSON object containing additional data about the activity. This could be filtered but different actions would place different data here so it is not strongly typed.' })
  data?: any

  @Field(type => DateTime, { description: 'The date and time when the action occurred.' })
  createdAt!: DateTime
}

@InputType({ description: 'This is used to filter a list of activities.' })
export class AppRequestActivityFilters {
  appRequestInternalIds?: number[]

  @Field(type => [ID], { nullable: true })
  appRequestIds?: string[]

  @Field(type => [ID], { nullable: true, description: 'Return activities that were performed by one of the given logins. Also returns activities that were performed while one of the given logins was impersonating someone else.' })
  users?: string[]

  @Field({ nullable: true, description: 'true -> Return activities that were performed while a user was impersonating another user. false -> Return activities that were not impersonated.' })
  impersonated?: boolean

  @Field(type => [ID], { nullable: true, description: 'Return activities that were performed while one of the given logins was being impersonated by someone else.' })
  impersonatedUsers?: string[]

  @Field(type => [ID], { nullable: true, description: 'Return activities that were performed while one of the given logins was impersonating another user.' })
  impersonatedBy?: string[]

  @Field(type => [String], { nullable: true, description: 'Filter activities by action. This is a list of action names that should be matched. There are many potential action names, they are untyped.' })
  actions?: string[]

  @Field(type => String, { nullable: true, description: 'Filter activities by matching description content.' })
  search?: string

  @Field(type => DateTime, { nullable: true, description: 'Return activities that happened after this date.' })
  happenedAfter?: DateTime

  @Field(type => DateTime, { nullable: true, description: 'Return activities that happened before this date.' })
  happenedBefore?: DateTime
}
