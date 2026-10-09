// @ts-nocheck
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Scalars = {
    Boolean: boolean,
    DateTime: string,
    Float: number,
    ID: string,
    Int: number,
    JsonData: Record<string, any>,
    String: string,
}

export interface Access {
    /** Current user may create a new app request on behalf of another user and should be shown the Create App Request button on the reviewer dashboard or main app request list. */
    createAppRequestOther: Scalars['Boolean']
    /** Current user may create a new app request for themselves and should be shown the Create App Request button. */
    createAppRequestSelf: Scalars['Boolean']
    /** Current user is permitted to create new periods in the period management UI. */
    createPeriod: Scalars['Boolean']
    /** Current user is permitted to create new roles in the role management UI. */
    createRole: Scalars['Boolean']
    /** Current user is permitted to manage site-wide announcements: create, update, and delete them. */
    manageAnnouncements: Scalars['Boolean']
    /** The current user, if any. */
    user: (AccessUser | null)
    /** Current user is permitted to view the announcement management page, whether or not they may change anything. */
    viewAnnouncementManagement: Scalars['Boolean']
    /** Current user is permitted to view the app request list. */
    viewAppRequestList: Scalars['Boolean']
    /** Current user is permitted to view the applicant dashboard. */
    viewApplicantDashboard: Scalars['Boolean']
    /** Current user is permitted to view the metrics UI. */
    viewMetrics: Scalars['Boolean']
    /** Current user is permitted to view the period management UI. */
    viewPeriodManagement: Scalars['Boolean']
    /** Current user is permitted to view the reviewer dashboard. */
    viewReviewerInterface: Scalars['Boolean']
    /** Current user is permitted to view the role management UI. */
    viewRoleManagement: Scalars['Boolean']
    __typename: 'Access'
}

export interface AccessControl {
    description: Scalars['String']
    name: Scalars['String']
    __typename: 'AccessControl'
}

export interface AccessControlGroup {
    /** A list of all possible controls for this controlGroup. Use this to populate the control dropdown when creating a grant. */
    controls: AccessControl[]
    /** A longer explanation of the control group for display in the role management interface. */
    description: (Scalars['String'] | null)
    name: Scalars['String']
    tags: AccessTagCategory[]
    /** A slightly longer version of the control group's name, for display in the role management interface. */
    title: Scalars['String']
    __typename: 'AccessControlGroup'
}

export interface AccessGrantTag {
    category: Scalars['String']
    categoryLabel: Scalars['String']
    /** Extra context for the tag, such as the other titles a program has gone by in different periods. */
    description: (Scalars['String'] | null)
    label: Scalars['String']
    tag: Scalars['String']
    __typename: 'AccessGrantTag'
}

export interface AccessRole {
    actions: RoleActions
    /** A description of the grant. This is not used for anything, but can be useful for admins to understand what the grant was trying to do. */
    description: (Scalars['String'] | null)
    grants: AccessRoleGrant[]
    groups: AccessRoleGroup[]
    id: Scalars['ID']
    name: Scalars['String']
    scope: (Scalars['String'] | null)
    __typename: 'AccessRole'
}

export interface AccessRoleGrant {
    actions: AccessRoleGrantActions
    /**
     * 
     *     If true, this grant allows the action specified by the selected controls. If false, it removes
     *     the controls.
     * 
     *     Removing a control only happens within the context of a single role. If another role grants the
     *     same control, the action is allowed. This is more of an exception system than a denial
     *     system. So you can do something like add the "view" control to the "movie" control group in one
     *     grant, and then in a second grant in the same role, remove it from "The Princess Bride". Now you
     *     have a role that grants "view" on all movies _except_ The Princess Bride. If the user has another role
     *     that grants "view" on The Princess Bride (or on all movies), they can view it based on that other role.
     *   
     */
    allow: Scalars['Boolean']
    /** The group this control belongs to. e.g. Reviewer - Review Phase */
    controlGroup: AccessControlGroup
    controls: Scalars['String'][]
    id: Scalars['ID']
    tags: AccessGrantTag[]
    __typename: 'AccessRoleGrant'
}

export interface AccessRoleGrantActions {
    delete: Scalars['Boolean']
    update: Scalars['Boolean']
    __typename: 'AccessRoleGrantActions'
}

export interface AccessRoleGroup {
    /** The date the group was added to a role. */
    dateAdded: Scalars['DateTime']
    dateCreated: (Scalars['DateTime'] | null)
    /** The name of the group. This should be unique even among all roleIds. */
    groupName: Scalars['String']
    managers: AccessRoleGroupManager[]
    roleId: Scalars['ID']
    __typename: 'AccessRoleGroup'
}

export interface AccessRoleGroupManager {
    /** The date the group was added to a role. */
    email: (Scalars['String'] | null)
    /** The date the group was added to a role. */
    fullname: Scalars['String']
    __typename: 'AccessRoleGroupManager'
}

export interface AccessRoleValidatedResponse {
    accessRole: (AccessRole | null)
    messages: MutationMessage[]
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success: Scalars['Boolean']
    __typename: 'AccessRoleValidatedResponse'
}

export interface AccessTag {
    /** Extra context for the tag, such as the other titles a program has gone by in different periods. */
    description: (Scalars['String'] | null)
    label: Scalars['String']
    value: Scalars['String']
    __typename: 'AccessTag'
}

export interface AccessTagCategory {
    category: Scalars['String']
    description: (Scalars['String'] | null)
    label: Scalars['String']
    listable: Scalars['Boolean']
    /** A list of all possible tags for this category. Use this to populate the tag dropdown when creating a grant. */
    tags: AccessTag[]
    __typename: 'AccessTagCategory'
}


/** A user that has or once had access to the system. */
export interface AccessUser {
    email: (Scalars['String'] | null)
    fullname: Scalars['String']
    groups: Scalars['String'][]
    login: Scalars['ID']
    otherIdentifiers: AccessUserIdentifier[]
    /** A JSON object containing any information about the user that the implementing application wants to store. Could be useful for constructing personalized UI. */
    otherInfo: (Scalars['JsonData'] | null)
    roles: AccessRole[]
    /** True as long as the lookupUser.byLogins function still returns this user. False otherwise. Likely this user has been deactivated. */
    stillValid: Scalars['Boolean']
    __typename: 'AccessUser'
}


/** A label and ID pair for an external user unique ID. For example, { label: "Student ID", id: "123456" } */
export interface AccessUserIdentifier {
    /** The unique ID for this identifier, e.g. "123456". */
    id: Scalars['ID']
    /** The label for this identifier, e.g. "Student ID". */
    label: Scalars['String']
    __typename: 'AccessUserIdentifier'
}


/** A site-wide announcement shown to users, optionally limited to a date range. */
export interface Announcement {
    /** The content of the announcement in HTML. */
    body: Scalars['String']
    /** Whether the announcement has been turned on. A disabled announcement never displays, regardless of its date range. */
    enabled: Scalars['Boolean']
    /** The announcement will not display after this date. Null means it displays until it is disabled. */
    end: (Scalars['DateTime'] | null)
    id: Scalars['ID']
    /** Whether the announcement should be displaying right now: enabled and inside whatever date bounds it has. */
    isActive: Scalars['Boolean']
    /** URL the announcement directs the user to for more information. */
    link: (Scalars['String'] | null)
    /** The text to display for the link. */
    linkText: (Scalars['String'] | null)
    /** The announcement will not display before this date. Null means it displays as soon as it is enabled. */
    start: (Scalars['DateTime'] | null)
    /** Short headline for the announcement. */
    subject: Scalars['String']
    /** The type of announcement, toggleable or date range */
    type: Scalars['String']
    __typename: 'Announcement'
}


/** Represents a group of applications all being applied for at the same time. As part of the request, multiple applications will be created and either eliminated as ineligible or submitted for approval. */
export interface AppRequest {
    /** Actions the user can take on this app request. */
    actions: AppRequestActions
    applicant: AccessUser
    /** The applications on this request, one per program. Pass programKeys to receive only some of them - a screen that shows one program should not download every program's requirement and prompt tree. */
    applications: Application[]
    /** True when at least one reachable prompt anywhere on this request has been invalidated and must be re-answered. Status and phase are computed from the answers on file, so use this flag to explain that the request is held back awaiting a correction. */
    awaitingCorrection: Scalars['Boolean']
    /** Date that this request was considered closed and no longer editable. If active or re-opened, will be null. If closed again, will be the second closure date. */
    closedAt: (Scalars['DateTime'] | null)
    createdAt: Scalars['DateTime']
    /** All data that has been gathered from the user for this request. It is a Record whose properties are the prompt keys and values are the data gathered by the corresponding prompt dialog. */
    data: Scalars['JsonData']
    /** The version of the data for this app request. This is incremented every time the data is updated. If you provide it with your update requests, the API will perform an optimistic concurrency check and fail the update if someone else has updated the data in the meantime. */
    dataVersion: Scalars['Int']
    id: Scalars['ID']
    /** Indexes associated with the App Request. These are pieces of data extracted from the App Request by individual prompts in the ReqQuest project. They have several uses such as filtering App Requests and enriching list views. */
    indexCategories: AppRequestIndexCategory[]
    /** Notes attached to this app request. Notes are internal only and only visible to reviewers. They are not visible to applicants. */
    notes: Note[]
    /** Notes attached to other app requests from this same applicant. Useful for providing context information from previous applications. */
    otherNotes: Note[]
    /** The period this appRequest is associated with. */
    period: Period
    /** The current phase of the app request. The phase generally only changes when control of the app request shifts between the applicant and reviewer. */
    phase: AppRequestPhase
    /** Retrieve a specific prompt by its ID. This is useful for the UI to get the full prompt data and configuration when trying to edit an individual prompt. We don't want to be downloading all the config data for everything up front. */
    prompt: RequirementPrompt
    status: AppRequestStatus
    /** The most pertinent status reason for this app request. The logic is complicated and depends on the AppRequest's status. */
    statusReason: (Scalars['String'] | null)
    /** The date that the applicant submitted their request. If the applicant has not yet submitted, this will be null. */
    submittedAt: (Scalars['DateTime'] | null)
    updatedAt: Scalars['DateTime']
    __typename: 'AppRequest'
}

export interface AppRequestActions {
    /** User may finalize the acceptance or denial of the offer. Sends the app request to non-blocking workflow (or completion). */
    acceptOffer: Scalars['Boolean']
    /** User may cancel this app request as the owner. Separate from closing as a reviewer/admin. */
    cancel: Scalars['Boolean']
    /** User may close this app request as a reviewer/admin. Separate from cancelling as the app request owner. */
    close: Scalars['Boolean']
    /** User may complete the app request. All non-blocking workflow must be complete. */
    completeRequest: Scalars['Boolean']
    /** User may complete the review app request. Sends the app request to the acceptance phase, or if there is no acceptance phase, to the non-blocking workflow or completion. */
    completeReview: Scalars['Boolean']
    /** User is able to create a new internal note on the app request. */
    createNote: Scalars['Boolean']
    /** User is able to create a new internal note on the app request. */
    createPersistentNote: Scalars['Boolean']
    /** User may reopen this app request, whether as the owner or as a reviewer/admin. */
    reopen: Scalars['Boolean']
    /** User may return this app request to the applicant phase. */
    returnToApplicant: Scalars['Boolean']
    /** User may return to the non-blocking workflow phase from completion. */
    returnToNonBlocking: Scalars['Boolean']
    /** User may return the app request to the acceptance phase from non-blocking workflow or completion. */
    returnToOffer: Scalars['Boolean']
    /** User may return the app request to the review phase from non-blocking workflow or completion. This does not cover reclaiming an offer - see reverseOffer for that. It also does not cover returning from completion to acceptance - see returnToOffer for that. */
    returnToReview: Scalars['Boolean']
    /** Whether the user can view this app request as a reviewer. */
    review: Scalars['Boolean']
    /** User may submit this app request either as or on behalf of the owner. */
    submit: Scalars['Boolean']
    /** User is able to see the acceptance UI. i.e. they are the applicant and the request is in the appropriate phase. */
    viewAcceptUI: Scalars['Boolean']
    /** User is able to see the applicant UI. i.e. they are the applicant and the request is in the appropriate phase. */
    viewApplyUI: Scalars['Boolean']
    __typename: 'AppRequestActions'
}

export interface AppRequestActivity {
    action: Scalars['String']
    /** The app request this activity is associated with. */
    appRequest: AppRequest
    /** The date and time when the action occurred. */
    createdAt: Scalars['DateTime']
    /** A JSON object containing additional data about the activity. This could be filtered but different actions would place different data here so it is not strongly typed. */
    data: (Scalars['JsonData'] | null)
    /** A detailed description of the activity. This is not meant to be filtered and could contain specific details about the action. */
    description: (Scalars['String'] | null)
    id: Scalars['ID']
    /** If this activity was performed by an impersonated user, this will be the user that did the impersonation. */
    impersonatedBy: (AccessUser | null)
    /** The user that performed the activity. */
    user: AccessUser
    __typename: 'AppRequestActivity'
}


/** Applicant counts for a set of appRequests. A request is a returning application when its applicant also submitted a request in an earlier period (by open date); otherwise it is a first-time application. Unsubmitted drafts in earlier periods do not count. */
export interface AppRequestApplicantCounts {
    /** Matching appRequests whose applicant submitted nothing in any earlier period. */
    firstTime: Scalars['Int']
    /** Matching appRequests whose applicant also submitted a request in an earlier period. */
    returning: Scalars['Int']
    __typename: 'AppRequestApplicantCounts'
}


/** This represents an index category attached to an app request. Its tagStrings property contains the tag values that have been extracted from the app request data. */
export interface AppRequestIndexCategory {
    /** If this is > 0, the index values should be shown on the main app request list page, sorted by this priority in descending order. */
    appRequestListPriority: (Scalars['Float'] | null)
    /** If this is > 0, the index values should be shown on the applicant dashboard, sorted by this priority in descending order. */
    applicantDashboardPriority: (Scalars['Float'] | null)
    /** The internal category name for this index. Use this with any GraphQL filters. */
    category: Scalars['String']
    /** A human-friendly label for this category that can be shown in the UI. */
    categoryLabel: Scalars['String']
    /** If this is > 0, the index values should be shown on the list filters, sorted by this priority in descending order. */
    listFiltersPriority: (Scalars['Float'] | null)
    /** If true, this category has few enough values that it is reasonable to list them all in a dropdown or similar UI control. If false, the list of values is likely to get very long and it would be better to use an autofill combobox or something. */
    listable: Scalars['Boolean']
    /** If this is > 0, the index values should be shown on the reviewer dashboard, sorted by this priority in descending order. */
    reviewerDashboardPriority: (Scalars['Float'] | null)
    values: IndexValue[]
    __typename: 'AppRequestIndexCategory'
}


/** This is used to indicate where the index values should be displayed. */
export type AppRequestIndexDestination = 'APPLICANT_DASHBOARD' | 'APP_REQUEST_LIST' | 'LIST_FILTERS' | 'REVIEWER_DASHBOARD'


/** The current phase of the app request. The phase generally only changes when control of the app request shifts between the applicant and reviewer. */
export type AppRequestPhase = 'ACCEPTANCE' | 'COMPLETE' | 'STARTED' | 'SUBMITTED' | 'WORKFLOW_NONBLOCKING'


/**
 * 
 *     The status of an appRequest. This status is computed based on the "dbStatus" recorded in
 *     the database and the status of each application.
 *   
 */
export type AppRequestStatus = 'ACCEPTANCE' | 'ACCEPTED' | 'APPROVAL' | 'APPROVED' | 'CANCELLED' | 'DISQUALIFIED' | 'NOT_ACCEPTED' | 'NOT_APPROVED' | 'PREAPPROVAL' | 'READY_TO_ACCEPT' | 'READY_TO_SUBMIT' | 'REVIEW_COMPLETE' | 'REVIEW_IN_PROGRESS' | 'STARTED' | 'WITHDRAWN'


/** An application represents the applicant applying to a specific program. Each appRequest has multiple applications - one per program defined in the system. Some applications are mutually exclusive and/or will be eliminated early based on PREQUAL requirements, but they all technically exist in the data model - there is no concept of picking one application over another, just two applications where one dies and the other survives. */
export interface Application {
    actions: ApplicationActions
    /** A brief description, written for applicants, of the program this application is for. */
    applicantDescription: (Scalars['String'] | null)
    /** True when at least one reachable prompt on this application has been invalidated and must be re-answered. Status is still computed from the answers on file, so pair status displays with this flag to indicate that a correction is outstanding. */
    awaitingCorrection: Scalars['Boolean']
    /** A prose summary of the applicant-side requirements of the program this application is for. Intended to be shown alongside statusReason when the application becomes ineligible before submission, since an applicant disqualified early may never have seen the program's prompts and the statusReason alone lacks context. */
    eligibilityDescription: (Scalars['String'] | null)
    /** True when the program sets showIneligiblePreSubmit: false and this application is hidden by it: ineligible because of an applicant requirement, and that ineligibility arose before submission (the request is unsubmitted, or the application was already ineligible when it was submitted). Only the applicant ever receives a hidden application, so they can still change the answers that disqualified them; UIs should leave it out of program lists. */
    hiddenIneligiblePreSubmit: Scalars['Boolean']
    id: Scalars['ID']
    /** The phase in which this application became ineligible for benefits. Useful for reporting / filtering. Null if the application is not (yet) ineligible. */
    ineligiblePhase: (IneligiblePhases | null)
    /** The navigation title of the program this application is for. */
    navTitle: Scalars['String']
    /** The next workflow stage for this application that would be active after activating the advanceWorkflow mutation. Null if the application or current user is not allowed to advance. */
    nextWorkflowStage: (PeriodWorkflowStage | null)
    /** The phase of the application. This is usually a computed field, not stored in the database. */
    phase: ApplicationPhase
    /** The previous workflow stage for this application that would be active after activating the reverseWorkflow mutation. Null if the application or current user is not allowed to reverse. */
    previousWorkflowStage: (PeriodWorkflowStage | null)
    /** The program key this application corresponds to. */
    programKey: Scalars['String']
    requirements: ApplicationRequirement[]
    /** The reason the application was rescinded */
    rescindedReason: (Scalars['String'] | null)
    /** The application rescinded status */
    rescindedStatus: (ApplicationRescindedStatus | null)
    /** The reason the application was restored after previously being rescinded */
    restoredReason: (Scalars['String'] | null)
    status: ApplicationStatus
    /** When one of the application's requirements is failing or throwing a warning, its reason will be copied here for convenience. If there is a warning and then later a failure, the failure reason will win. */
    statusReason: (Scalars['String'] | null)
    /** The title of the program this application is for. */
    title: Scalars['String']
    /** If the program has workflow, it may be divided into multiple stages of audit, each with their own requirements/prompts. This indicates which stage we are currently evaluating, or null if we are not in the workflow phase. An application with no workflow defined will never be in the workflow phase. Starts at 1. */
    workflowStage: (PeriodWorkflowStage | null)
    /** All workflow stages defined for the program/period of this application, in evaluation order. */
    workflowStages: PeriodWorkflowStage[]
    __typename: 'Application'
}

export interface ApplicationActions {
    advanceWorkflow: Scalars['Boolean']
    rescindApplication: Scalars['Boolean']
    restoreApplication: Scalars['Boolean']
    reverseWorkflow: Scalars['Boolean']
    viewAsReviewer: Scalars['Boolean']
    __typename: 'ApplicationActions'
}


/** Calculated application metrics */
export interface ApplicationMetric {
    approved: Scalars['Float']
    closed: Scalars['Float']
    denied: Scalars['Float']
    entries: ApplicationMetricEntry[]
    rescinded: Scalars['Float']
    started: Scalars['Float']
    submitted: Scalars['Float']
    toDecision: ApplicationMetricTiming
    toSubmit: ApplicationMetricTiming
    __typename: 'ApplicationMetric'
}


/** Application metric entry */
export interface ApplicationMetricEntry {
    appRequestId: Scalars['ID']
    applicantFullname: Scalars['String']
    applicantId: Scalars['ID']
    applicantLogin: Scalars['String']
    applicationId: Scalars['ID']
    closedAt: (Scalars['DateTime'] | null)
    createdAt: Scalars['DateTime']
    ineligiblePhase: (Scalars['String'] | null)
    periodCode: Scalars['String']
    periodId: Scalars['ID']
    periodName: Scalars['String']
    phase: Scalars['String']
    programKey: Scalars['String']
    status: Scalars['String']
    submittedAt: (Scalars['DateTime'] | null)
    updatedAt: Scalars['DateTime']
    __typename: 'ApplicationMetricEntry'
}


/** Application metric timings */
export interface ApplicationMetricTiming {
    avg: (Scalars['Float'] | null)
    max: (Scalars['Float'] | null)
    min: (Scalars['Float'] | null)
    __typename: 'ApplicationMetricTiming'
}


/**
 * 
 *     The phase of the application. This is usually a computed field, not stored in the database. The phase
 *     is computed based on the status of the appRequest and of the requirements for the program.
 *   
 */
export type ApplicationPhase = 'ACCEPTANCE' | 'APPROVAL' | 'COMPLETE' | 'PREAPPROVAL' | 'PREQUAL' | 'QUALIFICATION' | 'READY_FOR_WORKFLOW' | 'READY_TO_ACCEPT' | 'READY_TO_COMPLETE' | 'READY_TO_SUBMIT' | 'REVIEW_COMPLETE' | 'REVIEW_IN_PROGRESS' | 'WORKFLOW_BLOCKING' | 'WORKFLOW_NONBLOCKING'


/** The specific instance of a requirement on a particular application. Stores the status of the requirement, e.g. being satisfied or not. */
export interface ApplicationRequirement {
    application: Application
    /** The prompt keys the requirement named as responsible for its current status. Used to attach status indicators to the specific answers at fault instead of every prompt the requirement consults. Null when the requirement did not name any, in which case all of its prompts are implicated. */
    blame: (Scalars['String'][] | null)
    /** The configuration data for this requirement in the app request's period. */
    configurationData: (Scalars['JsonData'] | null)
    /** An internal description of the requirement. Probably not shown to users. */
    description: Scalars['String']
    id: Scalars['ID']
    /** A human and machine readable unique and stable identifier that we can use to add javascript logic to the evaluation of whether a requirement is satisfied. For example: "gi_ch33_must_be_post911" */
    key: Scalars['String']
    /** A human readable title for the requirement in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle: Scalars['String']
    prompts: RequirementPrompt[]
    /** The smart title for this requirement in the app request's period. For instance, might be "Applicant must have GPA over 3.4" instead of the regular title "Applicant must meet GPA requirement". Will fall back to the regular title for any requirement that does not provide a smart title. */
    smartTitle: Scalars['String']
    /** The status of the requirement. This is what will be shown to users. */
    status: RequirementStatus
    /** The reason why the requirement is in the status it is in. This will be shown to the applicant. */
    statusReason: (Scalars['String'] | null)
    /** A human readable title for the requirement. This is what will be shown to users. */
    title: Scalars['String']
    /** The type of requirement. This determines when the requirement is evaluated and who can see the requirement. */
    type: RequirementType
    /** The stage of the workflow for this requirement. Null if not part of a workflow stage */
    workflowStage: (PeriodWorkflowStage | null)
    __typename: 'ApplicationRequirement'
}


/**
 * 
 *     The rescinded status of an application.
 *   
 */
export type ApplicationRescindedStatus = 'RESCINDED' | 'RESTORED'


/**
 * 
 *     The status of an application. This is usually a computed field, not stored in the database. The status
 *     is computed based on the status of the appRequest and of the requirements for the program. If
 *     the appRequest is CLOSED or CANCELLED, this status will remain frozen wherever it was before the
 *     closure / cancellation.
 *   
 */
export type ApplicationStatus = 'ACCEPTED' | 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING' | 'REJECTED' | 'RESCINDED'

export interface Category {
    /** This is indexed name of the category. Categories are indexed to allow for quick filtering of a list of items. e.g. institutionalRoles */
    category: Scalars['String']
    /** Displayed Label of the category. e.g. Institutional Roles */
    label: (Scalars['String'] | null)
    /** IDs are the unique values that may be used to group an items. Multiple IDs may be assigned to an item. i.e. ["Staff", "Faculty", "Student"] */
    tags: CategoryTag[]
    /** Set this to true should be available as a filter in the User list view. */
    useInFilters: (Scalars['Boolean'] | null)
    /** Set this to true should be displayed as a column in the User list view. */
    useInList: (Scalars['Boolean'] | null)
    __typename: 'Category'
}

export interface CategoryTag {
    /** Displayed Label of the tag in the UI Filter. This value should be unique enough to be distinguishable between other tags within a category type. */
    label: (Scalars['String'] | null)
    /** This is the indexed name of the tagged instance within a category type and is what is stored/searched for in the database. */
    tag: Scalars['String']
    __typename: 'CategoryTag'
}

export interface Configuration {
    actions: ConfigurationAccess
    data: Scalars['JsonData']
    fetchedData: (Scalars['JsonData'] | null)
    /** The key being configured. Could be a requirement, prompt, or program key. A program's configuration holds its per-period title and navTitle overrides. */
    key: Scalars['String']
    __typename: 'Configuration'
}

export interface ConfigurationAccess {
    update: Scalars['Boolean']
    view: Scalars['Boolean']
    __typename: 'ConfigurationAccess'
}


/** This represents an index as registered by one of the project's prompt definitions. */
export interface IndexCategory {
    /** If this is > 0, the index values should be shown on the main app request list page, sorted by this priority in descending order. */
    appRequestListPriority: (Scalars['Float'] | null)
    /** If this is > 0, the index values should be shown on the applicant dashboard, sorted by this priority in descending order. */
    applicantDashboardPriority: (Scalars['Float'] | null)
    /** The internal category name for this index. Use this with any GraphQL filters. */
    category: Scalars['String']
    /** A human-friendly label for this category that can be shown in the UI. */
    categoryLabel: Scalars['String']
    /** If this is > 0, the index values should be shown on the list filters, sorted by this priority in descending order. */
    listFiltersPriority: (Scalars['Float'] | null)
    /** If true, this category has few enough values that it is reasonable to list them all in a dropdown or similar UI control. If false, the list of values is likely to get very long and it would be better to use an autofill combobox or something. */
    listable: Scalars['Boolean']
    /** If this is > 0, the index values should be shown on the reviewer dashboard, sorted by this priority in descending order. */
    reviewerDashboardPriority: (Scalars['Float'] | null)
    values: IndexValue[]
    __typename: 'IndexCategory'
}

export interface IndexValue {
    label: Scalars['String']
    value: Scalars['String']
    __typename: 'IndexValue'
}

export type IneligiblePhases = 'ACCEPTANCE' | 'APPROVAL' | 'PREAPPROVAL' | 'PREQUAL' | 'QUALIFICATION' | 'WORKFLOW'

export interface Mutation {
    /** This is for the applicant to accept or reject the offer that was made based on their app request. The difference between accept and reject is determined by the status of the acceptance requirements. They will still "accept offer" after they answer that they do not want the offer. If there is non-blocking workflow on any applications, the first one in each will begin. Applications without non-blocking workflow will be advanced to the COMPLETE phase. If all applications are complete, the app request will be closed. */
    acceptOffer: ValidatedAppRequestResponse
    /** Add a note to the app request. */
    addNote: ValidatedNoteResponse
    /** Moves the application to the next blocking workflow stage. If phase is READY_FOR_WORKFLOW, moves to the first or next blocking workflow stage. If on the last blocking workflow, moves to REVIEW_COMPLETE. In the non-blocking (WORKFLOW_NONBLOCKING) phase the workflow is non-sequential with all non-blocking requirements editable at once and once they are all resolved this becomes a single "Send to Complete" action that moves the application to COMPLETE. */
    advanceWorkflow: ValidatedAppRequestResponse
    /** Cancel or withdraw the app request, depending on its current phase. This is only available if the app request is in a cancellable state. */
    cancelAppRequest: ValidatedAppRequestResponse
    /** Close the app request. Generally this is always available and will freeze the request/applications in their current phase/status. */
    closeAppRequest: ValidatedAppRequestResponse
    /** Complete the app request. This is generally only available if request is in non-blocking workflow and all applications are complete. */
    completeRequest: ValidatedAppRequestResponse
    /** Make an offer on the app request. If all applications are ineligible, or if there are no acceptance requirements, the applications will advance to the non-blocking workflow, or absent that, be marked complete. */
    completeReview: ValidatedAppRequestResponse
    /** Create a new site-wide announcement. */
    createAnnouncement: ValidatedAnnouncementResponse
    /** Create a new app request. */
    createAppRequest: ValidatedAppRequestResponse
    createPeriod: ValidatedPeriodResponse
    /** Delete an existing site-wide announcement. */
    deleteAnnouncement: ValidatedResponse
    /** Delete an existing note. */
    deleteNote: Scalars['Boolean']
    deletePeriod: ValidatedResponse
    markPeriodReviewed: ValidatedPeriodResponse
    /** Reopen the app request. This is only available if the app request is in a state that allows reopening. */
    reopenAppRequest: ValidatedAppRequestResponse
    /** Rescinds the approved and/or accepted application. */
    rescind: ValidatedAppRequestResponse
    /** Restores a previously rescinded application to its previous state. */
    restore: ValidatedAppRequestResponse
    /** Return the app request to the applicant phase. This is only available if the app request is in a state that allows returning. */
    returnToApplicant: ValidatedAppRequestResponse
    /** If request is complete, undo and return to non-blocking workflow. */
    returnToNonBlocking: ValidatedAppRequestResponse
    /** Return the app request to the acceptance phase from non-blocking workflow or completion. */
    returnToOffer: ValidatedAppRequestResponse
    /** Return the app request to the review phase from acceptance, non-blocking workflow, or completion. */
    returnToReview: ValidatedAppRequestResponse
    /** Moves the application back to the previous blocking workflow stage. Non-blocking workflow stages are excluded from the reverse order, so this only steps back through the blocking workflow during the review (SUBMITTED) phase.  If no blocking then moved to APPROVAL */
    reverseWorkflow: ValidatedAppRequestResponse
    roleAddGrant: AccessRoleValidatedResponse
    roleCreate: AccessRoleValidatedResponse
    roleDelete: ValidatedResponse
    roleDeleteGrant: AccessRoleValidatedResponse
    roleUpdate: AccessRoleValidatedResponse
    roleUpdateGrant: AccessRoleValidatedResponse
    /** Submit the app request. Applications whose program has no reviewer questions (no PREAPPROVAL or APPROVAL requirements) advance on their own into their first blocking workflow stage or to REVIEW_COMPLETE; when nothing is left to review, the review is completed automatically as well. Applications ruled out before submission (PREQUAL or QUALIFICATION) do not hold that back. */
    submitAppRequest: ValidatedAppRequestResponse
    /** Toggle an existing note's persistent status. */
    togglePersistence: ValidatedNoteResponse
    /** Update an existing site-wide announcement. */
    updateAnnouncement: ValidatedAnnouncementResponse
    updateConfiguration: ValidatedConfigurationResponse
    /** Update the content of an existing note. */
    updateNote: ValidatedNoteResponse
    updatePeriod: ValidatedPeriodResponse
    updatePeriodRequirement: ValidatedResponse
    /** Update the data for a prompt in this app request. */
    updatePrompt: ValidatedAppRequestResponse
    __typename: 'Mutation'
}

export interface MutationMessage {
    /** The path to the arg that produced the error. Dot-separated (lodash.get compatible) if it is deep inside an input type. Null if no particular arg can be blamed for the error. */
    arg: (Scalars['String'] | null)
    /** An error message to be shown to the end user, with the context of the given arg. */
    message: Scalars['String']
    /** The type of error message. See the enum descriptions for more detail. */
    type: MutationMessageType
    __typename: 'MutationMessage'
}

export type MutationMessageType = 'error' | 'success' | 'warning'


/** An internal note attached to an application request. Notes are always written by reviewers and never visible to applicants. "Messages" are for reviewers and applicants communicating with one another. */
export interface Note {
    actions: NoteActions
    /** The app request this note is attached to. */
    appRequest: AppRequest
    /** The author of the note. */
    author: AccessUser
    /** The content of the note in HTML. */
    content: Scalars['String']
    createdAt: Scalars['DateTime']
    id: Scalars['ID']
    /** Whether this note contains permanently useful information about a person, as opposed to only being relevant in the context of the app request it was posted to. */
    persistent: Scalars['Boolean']
    updatedAt: Scalars['DateTime']
    __typename: 'Note'
}


/** Actions that can be performed on a note. */
export interface NoteActions {
    delete: Scalars['Boolean']
    update: Scalars['Boolean']
    updatePersistent: Scalars['Boolean']
    __typename: 'NoteActions'
}

export interface PaginationInfoWithTotalItems {
    /** List of indexed category data related to items within a page. Often used for filtering items. */
    categories: (Category[] | null)
    /** The current page number, starting at 1. This is always provided - if pagination was not requested, will return 1. */
    currentPage: Scalars['Float']
    /** Indicates whether requesting the next page would provide more results. Especially useful for models that cannot provide total item count for practical reasons. Note that over time, more results can appear and make this answer wrong, so in some circumstances it makes sense to request another page anyway. */
    hasNextPage: Scalars['Boolean']
    /** The number of items per page. Null if pagination was not requested/forced because results per page is unlimited. */
    perPage: (Scalars['Float'] | null)
    /** If possible, the total number of results will be provided. The API may return null if calculating the total is impractical. If pagination was not requested/forced, will equal the result count. */
    totalItems: (Scalars['Float'] | null)
    __typename: 'PaginationInfoWithTotalItems'
}

export interface PaginationResponse {
    accessUsers: (PaginationInfoWithTotalItems | null)
    appRequests: (PaginationInfoWithTotalItems | null)
    appRequestsActivity: (PaginationInfoWithTotalItems | null)
    __typename: 'PaginationResponse'
}

export interface Period {
    actions: PeriodActions
    /** This is useful for filtering out periods that are no longer useful. For instance, a window might close applications after 2 weeks but the reviewers could be working. */
    archiveDate: (Scalars['DateTime'] | null)
    /** Date that this period closes for applications. Some periods do not set a close date. */
    closeDate: (Scalars['DateTime'] | null)
    /** Unique identifier for this period that references an external system. Ideally human readable. */
    code: (Scalars['String'] | null)
    configurations: Configuration[]
    id: Scalars['ID']
    /** Name for this period. Will be displayed to applicants if they create an App Request while two periods are simultaneously open. */
    name: Scalars['String']
    /** Date that this period opens for applications. */
    openDate: Scalars['DateTime']
    programs: PeriodProgram[]
    prompts: PeriodPrompt[]
    requirements: PeriodProgramRequirement[]
    /** Whether this period's configurations have been reviewed by an administrator. Newly created periods must be reviewed before they will accept new app requests, even if the open date has passed. */
    reviewed: Scalars['Boolean']
    __typename: 'Period'
}

export interface PeriodActions {
    createAppRequest: Scalars['Boolean']
    delete: Scalars['Boolean']
    update: Scalars['Boolean']
    __typename: 'PeriodActions'
}

export interface PeriodProgram {
    actions: PeriodProgramActions
    /** A brief description of the program, written for applicants. */
    applicantDescription: (Scalars['String'] | null)
    /** The configuration for this program in the period, which holds its title and navTitle overrides. */
    configuration: Configuration
    /** A prose summary of the applicant-side requirements of the program. Intended to be shown to applicants who become ineligible before submission, since they may never have seen the program's prompts. */
    eligibilityDescription: (Scalars['String'] | null)
    /** Whether the program is enabled in this period. This is set by the system administrator. */
    enabled: Scalars['Boolean']
    key: Scalars['ID']
    navTitle: Scalars['String']
    period: Period
    requirements: PeriodProgramRequirement[]
    title: Scalars['String']
    __typename: 'PeriodProgram'
}

export interface PeriodProgramActions {
    configure: Scalars['Boolean']
    __typename: 'PeriodProgramActions'
}

export interface PeriodProgramRequirement {
    /** The configuration for this requirement in the period. */
    configuration: Configuration
    /** An internal description of the requirement. Probably not shown to users. */
    description: Scalars['String']
    /** Whether the requirement is enabled in this period. This is set by the system administrator. */
    enabled: Scalars['Boolean']
    /** A human and machine readable unique and stable identifier that we can use to add javascript logic to the evaluation of whether a requirement is satisfied. For example: "gi_ch33_must_be_post911" */
    key: Scalars['String']
    /** A human readable title for the requirement in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle: Scalars['String']
    prompts: PeriodPrompt[]
    /** A human readable title for the requirement. This is what will be shown to users. */
    title: Scalars['String']
    /** The type of requirement. This determines when the requirement is evaluated and who can see the requirement. */
    type: RequirementType
    __typename: 'PeriodProgramRequirement'
}

export interface PeriodPrompt {
    /** The configuration for this prompt in the given period. */
    configuration: Configuration
    /** A brief description of the prompt. This should be shown to administrators to help explain the full meaning of the prompt while assigning permissions or editing its configuration. */
    description: (Scalars['String'] | null)
    /** A human and machine readable identifier for the prompt. Will be used to match prompt data with UI and API code that handles it. */
    key: Scalars['String']
    /** A human readable title for the prompt in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle: Scalars['String']
    periodId: Scalars['String']
    /** A human readable title for the prompt. This is what will be shown to users. */
    title: Scalars['String']
    __typename: 'PeriodPrompt'
}

export interface PeriodWorkflowStage {
    /** Whether this stage is blocking. If true, the application cannot be completed and shown to the applicant until all requirements in this stage are satisfied. */
    blocking: Scalars['Boolean']
    /** Globally unique key for this workflow stage. Use lowercase snake_case, alphanumeric and underscore only. */
    key: Scalars['String']
    /** A human readable title for the workflow stage. */
    title: Scalars['String']
    __typename: 'PeriodWorkflowStage'
}

export interface Program {
    /** A brief description of the program, written for applicants. */
    applicantDescription: (Scalars['String'] | null)
    /** A prose summary of the applicant-side requirements of the program. Intended to be shown to applicants who become ineligible before submission, since they may never have seen the program's prompts. */
    eligibilityDescription: (Scalars['String'] | null)
    key: Scalars['ID']
    navTitle: Scalars['String']
    title: Scalars['String']
    __typename: 'Program'
}


/** The visibility of a prompt on a request. This is used to determine whether the prompt should be shown to the user in the UI. */
export type PromptVisibility = 'APPLICATION_DUPE' | 'AVAILABLE' | 'REQUEST_DUPE' | 'UNREACHABLE'

export interface Query {
    /**
     * 
     *     This is the global access object. Each field represents a global permission
     *     like the ability to view the role management interface.
     *   
     */
    access: Access
    accessUsers: AccessUser[]
    /** Retrieve site-wide announcements. Any authenticated user may retrieve any announcement, including ones that are disabled or outside their date range; pass filter.active to limit the result to the announcements that should be displaying right now. */
    announcements: Announcement[]
    /** The activity log for this app request. This is a list of actions taken on the app request, such as submission, updating prompts, make an offer, add a note, etc. It will be sorted by the date of the activity in descending order. */
    appRequestActivity: AppRequestActivity[]
    appRequestIndexes: IndexCategory[]
    appRequests: AppRequest[]
    applicationMetrics: ApplicationMetric
    /** This is where you get information about the authorization system. Each grant will be associated with one of these controlGroups, one or more controls in the group, and an optional set of tags. The tags are used to limit the scope of the grant. */
    controlGroups: AccessControlGroup[]
    /** First-time vs returning applicant counts for the matching appRequests (see AppRequestApplicantCounts). */
    countAppRequestApplicants: AppRequestApplicantCounts
    countAppRequests: Scalars['Int']
    pageInfo: PaginationResponse
    periods: Period[]
    programs: Program[]
    roles: AccessRole[]
    /** A list of all possible scopes. Scopes are used to limit users when they are accessing the system through an alternate UI or login method. For instance, if you generate an authentication token to give to a third party, it may have a scope identifying that third party and limiting their access even though they are acting as you. Roles must match the token scope in order to apply permissions. */
    scopes: Scalars['String'][]
    userIndexes: IndexCategory[]
    __typename: 'Query'
}


/** A RequestPrompt is an instance of a Prompt on a particular request. Once the user has answered the prompt, it contains the answer and the prompt status on that request. */
export interface RequirementPrompt {
    /** Actions that the user can take on this prompt. */
    actions: RequirementPromptActions
    /** Whether the prompt has been answered on this request. Note that the answer may be marked invalidated, which means that even though it has been answered, the current answer can't be used and the user needs to answer it again. */
    answered: Scalars['Boolean']
    /** The configuration data for this prompt in the app request's period. */
    configurationData: Scalars['JsonData']
    /** The data that has been gathered from the user in response to this prompt. The schema is controlled by the question's implementation. */
    data: (Scalars['JsonData'] | null)
    /** A brief description of the prompt. This should be shown to administrators to help explain the full meaning of the prompt while assigning permissions or editing its configuration. */
    description: (Scalars['String'] | null)
    /** Any data that the API needs to provide to the UI to build the prompt form properly. For instance, it could pull reference information from an external system, e.g. a student's course schedule, for display in the prompt dialog. Null if the user is not currently allowed to update the prompt. */
    fetchedData: (Scalars['JsonData'] | null)
    /** Extra configuration data that is relevant for this prompt. This configuration is explicitly gathered from related requirements and prompts by the gatherConfig function in the prompt definition. */
    gatheredConfigData: Scalars['JsonData']
    /** Identifies if the prompt already has saved data.  Assists in determining if the user has previously interacted with this prompt. */
    hasSavedData: Scalars['Boolean']
    id: Scalars['ID']
    /** When true, this prompt has been invalidated by the answer to another prompt. The `answered` field will remain true so be sure to check this field as well when determining whether the prompt is complete. */
    invalidated: Scalars['Boolean']
    /** If the prompt has been invalidated, this may contain a reason why. It should be displayed to the user. */
    invalidatedReason: (Scalars['String'] | null)
    /** A human and machine readable identifier for the prompt. Will be used to match prompt data with UI and API code that handles it. */
    key: Scalars['String']
    /** This prompt's requirement follows a requirement that has already marked the application as ineligible. The prompt still has visibility of AVAILABLE OR REQUEST_DUPE OR APPLICATION_DUPE as normal, but should probably be shown to the user as disabled or not shown at all. */
    moot: Scalars['Boolean']
    /** A human readable title for the prompt in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle: Scalars['String']
    /** True when this row exists only because its requirement listed the prompt in `promptKeysNoDisplay` */
    noDisplay: Scalars['Boolean']
    optOut: Scalars['Boolean']
    /** Preload data that has been generated according to the prompt definition. For example, a prompt might query the database for answers given in previous requests or query an external API to learn facts about the user. */
    preloadData: (Scalars['JsonData'] | null)
    /** Prestage data that has been generated according to the prompt definition. A prompt might require data that should only be modified API side (not client manipulable), such as user specific info sourced from other systems. */
    prestageData: (Scalars['JsonData'] | null)
    /** The requirement that this prompt is associated with. */
    requirement: ApplicationRequirement
    /** A human readable title for the prompt. This is what will be shown to users. */
    title: Scalars['String']
    /** The visibility of the prompt on the request. This is used to determine whether the prompt should be shown to the user in the UI. */
    visibility: PromptVisibility
    __typename: 'RequirementPrompt'
}

export interface RequirementPromptActions {
    update: Scalars['Boolean']
    __typename: 'RequirementPromptActions'
}

export type RequirementStatus = 'DISQUALIFYING' | 'MET' | 'NOT_APPLICABLE' | 'PENDING' | 'WARNING'

export type RequirementType = 'ACCEPTANCE' | 'APPROVAL' | 'POSTQUAL' | 'PREAPPROVAL' | 'PREQUAL' | 'QUALIFICATION' | 'WORKFLOW'

export interface RoleActions {
    delete: Scalars['Boolean']
    update: Scalars['Boolean']
    __typename: 'RoleActions'
}

export interface ValidatedAnnouncementResponse {
    /** The created or updated announcement. Null when validateOnly was true or when validation errors prevented the operation. */
    announcement: (Announcement | null)
    messages: MutationMessage[]
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success: Scalars['Boolean']
    __typename: 'ValidatedAnnouncementResponse'
}

export interface ValidatedAppRequestResponse {
    appRequest: (AppRequest | null)
    messages: MutationMessage[]
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success: Scalars['Boolean']
    __typename: 'ValidatedAppRequestResponse'
}

export interface ValidatedConfigurationResponse {
    configuration: (Configuration | null)
    messages: MutationMessage[]
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success: Scalars['Boolean']
    __typename: 'ValidatedConfigurationResponse'
}

export interface ValidatedNoteResponse {
    messages: MutationMessage[]
    /** The created or updated note. Null when validateOnly was true or when validation errors prevented the operation. */
    note: (Note | null)
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success: Scalars['Boolean']
    __typename: 'ValidatedNoteResponse'
}

export interface ValidatedPeriodResponse {
    messages: MutationMessage[]
    period: (Period | null)
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success: Scalars['Boolean']
    __typename: 'ValidatedPeriodResponse'
}

export interface ValidatedResponse {
    messages: MutationMessage[]
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success: Scalars['Boolean']
    __typename: 'ValidatedResponse'
}

export interface AccessGenqlSelection{
    /** Current user may create a new app request on behalf of another user and should be shown the Create App Request button on the reviewer dashboard or main app request list. */
    createAppRequestOther?: boolean | number
    /** Current user may create a new app request for themselves and should be shown the Create App Request button. */
    createAppRequestSelf?: boolean | number
    /** Current user is permitted to create new periods in the period management UI. */
    createPeriod?: boolean | number
    /** Current user is permitted to create new roles in the role management UI. */
    createRole?: boolean | number
    /** Current user is permitted to manage site-wide announcements: create, update, and delete them. */
    manageAnnouncements?: boolean | number
    /** The current user, if any. */
    user?: AccessUserGenqlSelection
    /** Current user is permitted to view the announcement management page, whether or not they may change anything. */
    viewAnnouncementManagement?: boolean | number
    /** Current user is permitted to view the app request list. */
    viewAppRequestList?: boolean | number
    /** Current user is permitted to view the applicant dashboard. */
    viewApplicantDashboard?: boolean | number
    /** Current user is permitted to view the metrics UI. */
    viewMetrics?: boolean | number
    /** Current user is permitted to view the period management UI. */
    viewPeriodManagement?: boolean | number
    /** Current user is permitted to view the reviewer dashboard. */
    viewReviewerInterface?: boolean | number
    /** Current user is permitted to view the role management UI. */
    viewRoleManagement?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessControlGenqlSelection{
    description?: boolean | number
    name?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessControlGroupGenqlSelection{
    /** A list of all possible controls for this controlGroup. Use this to populate the control dropdown when creating a grant. */
    controls?: AccessControlGenqlSelection
    /** A longer explanation of the control group for display in the role management interface. */
    description?: boolean | number
    name?: boolean | number
    tags?: AccessTagCategoryGenqlSelection
    /** A slightly longer version of the control group's name, for display in the role management interface. */
    title?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessGrantTagGenqlSelection{
    category?: boolean | number
    categoryLabel?: boolean | number
    /** Extra context for the tag, such as the other titles a program has gone by in different periods. */
    description?: boolean | number
    label?: boolean | number
    tag?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessRoleGenqlSelection{
    actions?: RoleActionsGenqlSelection
    /** A description of the grant. This is not used for anything, but can be useful for admins to understand what the grant was trying to do. */
    description?: boolean | number
    grants?: AccessRoleGrantGenqlSelection
    groups?: AccessRoleGroupGenqlSelection
    id?: boolean | number
    name?: boolean | number
    scope?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessRoleFilter {groups?: (Scalars['String'][] | null),ids?: (Scalars['ID'][] | null),names?: (Scalars['String'][] | null),scopes?: (Scalars['String'][] | null)}

export interface AccessRoleGrantGenqlSelection{
    actions?: AccessRoleGrantActionsGenqlSelection
    /**
     * 
     *     If true, this grant allows the action specified by the selected controls. If false, it removes
     *     the controls.
     * 
     *     Removing a control only happens within the context of a single role. If another role grants the
     *     same control, the action is allowed. This is more of an exception system than a denial
     *     system. So you can do something like add the "view" control to the "movie" control group in one
     *     grant, and then in a second grant in the same role, remove it from "The Princess Bride". Now you
     *     have a role that grants "view" on all movies _except_ The Princess Bride. If the user has another role
     *     that grants "view" on The Princess Bride (or on all movies), they can view it based on that other role.
     *   
     */
    allow?: boolean | number
    /** The group this control belongs to. e.g. Reviewer - Review Phase */
    controlGroup?: AccessControlGroupGenqlSelection
    controls?: boolean | number
    id?: boolean | number
    tags?: AccessGrantTagGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessRoleGrantActionsGenqlSelection{
    delete?: boolean | number
    update?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessRoleGrantCreate {allow: Scalars['Boolean'],controlGroup?: (Scalars['String'] | null),
/** A list of controls that are allowed or denied by this grant. Each controlGroup has a list of available controls, available under Query.controlGroups. */
controls?: (Scalars['String'][] | null),
/** A list of tags to restrict a grant. For instance, if this is added to a grant on PromptAnswer-update, each tag refers to a subset of App Requests. */
tags?: (AccessTagInput[] | null)}

export interface AccessRoleGrantUpdate {allow: Scalars['Boolean'],controlGroup?: (Scalars['String'] | null),
/** A list of controls that are allowed or denied by this grant. Each controlGroup has a list of available controls, available under Query.controlGroups. */
controls?: (Scalars['String'][] | null),
/** A list of tags to restrict a grant. For instance, if this is added to a grant on PromptAnswer-update, each tag refers to a subset of App Requests. */
tags?: (AccessTagInput[] | null)}

export interface AccessRoleGroupGenqlSelection{
    /** The date the group was added to a role. */
    dateAdded?: boolean | number
    dateCreated?: boolean | number
    /** The name of the group. This should be unique even among all roleIds. */
    groupName?: boolean | number
    managers?: AccessRoleGroupManagerGenqlSelection
    roleId?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessRoleGroupManagerGenqlSelection{
    /** The date the group was added to a role. */
    email?: boolean | number
    /** The date the group was added to a role. */
    fullname?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessRoleInput {
/** A description of the role. This is not used for anything, but can be useful for admins to understand what the role is trying to do. */
description?: (Scalars['String'] | null),
/** A list of groups this role is associated with. */
groups: Scalars['String'][],name: Scalars['String'],
/** Attach this role to a specific authentication scope, e.g. "parent". */
scope?: (Scalars['String'] | null)}

export interface AccessRoleValidatedResponseGenqlSelection{
    accessRole?: AccessRoleGenqlSelection
    messages?: MutationMessageGenqlSelection
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessTagGenqlSelection{
    /** Extra context for the tag, such as the other titles a program has gone by in different periods. */
    description?: boolean | number
    label?: boolean | number
    value?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessTagCategoryGenqlSelection{
    category?: boolean | number
    description?: boolean | number
    label?: boolean | number
    listable?: boolean | number
    /** A list of all possible tags for this category. Use this to populate the tag dropdown when creating a grant. */
    tags?: AccessTagGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AccessTagInput {
/** The category this tag belongs to, e.g. "State". */
category: Scalars['String'],
/** The tag value, e.g. "TX". */
tag: Scalars['String']}


/** A user that has or once had access to the system. */
export interface AccessUserGenqlSelection{
    email?: boolean | number
    fullname?: boolean | number
    groups?: boolean | number
    login?: boolean | number
    otherIdentifiers?: AccessUserIdentifierGenqlSelection
    /** A JSON object containing any information about the user that the implementing application wants to store. Could be useful for constructing personalized UI. */
    otherInfo?: boolean | number
    roles?: AccessRoleGenqlSelection
    /** True as long as the lookupUser.byLogins function still returns this user. False otherwise. Likely this user has been deactivated. */
    stillValid?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** A category and tag pair for an internal and external user related attributes. For example, [{ category: "institutionalRole", tags: ["STAFF", "STUDENT"] }, { category: "lastLogin", tags: ["2025-09-01T10:20:04"] }] */
export interface AccessUserCategoryInput {category: Scalars['ID'],tags: Scalars['ID'][]}

export interface AccessUserFilter {logins?: (Scalars['ID'][] | null),
/** One to Many categories Filter, like a institutional role people may belong to. */
otherCategoriesByLabel?: (AccessUserCategoryInput[] | null),
/** Filter by identifiers aside from username, like an Employee ID. */
otherIdentifiers?: (Scalars['String'][] | null),otherIdentifiersByLabel?: (AccessUserIdentifierInput[] | null),
/** Filter users by associated Application Roles */
roles?: (Scalars['String'][] | null),search?: (Scalars['String'] | null),
/** If true, only return the user that is currently logged in. */
self?: (Scalars['Boolean'] | null)}


/** A label and ID pair for an external user unique ID. For example, { label: "Student ID", id: "123456" } */
export interface AccessUserIdentifierGenqlSelection{
    /** The unique ID for this identifier, e.g. "123456". */
    id?: boolean | number
    /** The label for this identifier, e.g. "Student ID". */
    label?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** A label and ID pair for an external user unique ID. For example, { label: "Student ID", id: "123456" } */
export interface AccessUserIdentifierInput {id: Scalars['ID'],label: Scalars['String']}


/** A site-wide announcement shown to users, optionally limited to a date range. */
export interface AnnouncementGenqlSelection{
    /** The content of the announcement in HTML. */
    body?: boolean | number
    /** Whether the announcement has been turned on. A disabled announcement never displays, regardless of its date range. */
    enabled?: boolean | number
    /** The announcement will not display after this date. Null means it displays until it is disabled. */
    end?: boolean | number
    id?: boolean | number
    /** Whether the announcement should be displaying right now: enabled and inside whatever date bounds it has. */
    isActive?: boolean | number
    /** URL the announcement directs the user to for more information. */
    link?: boolean | number
    /** The text to display for the link. */
    linkText?: boolean | number
    /** The announcement will not display before this date. Null means it displays as soon as it is enabled. */
    start?: boolean | number
    /** Short headline for the announcement. */
    subject?: boolean | number
    /** The type of announcement, toggleable or date range */
    type?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AnnouncementFilters {
/** Return only the announcements that should be displaying right now (true) or only those that should not (false). Omit to return all announcements regardless of state. */
active?: (Scalars['Boolean'] | null),
/** Return only enabled (true) or only disabled (false) announcements. */
enabled?: (Scalars['Boolean'] | null),
/** Return the announcements with these IDs. */
ids?: (Scalars['ID'][] | null)}

export interface AnnouncementUpdate {
/** The content of the announcement in HTML. Unsafe markup is stripped on save. */
body?: (Scalars['String'] | null),
/** Whether the announcement has been turned on. */
enabled?: (Scalars['Boolean'] | null),
/** The announcement will not display after this date. Null means it displays until it is disabled. */
end?: (Scalars['DateTime'] | null),
/** URL the announcement directs the user to for more information. */
link?: (Scalars['String'] | null),
/** The text to display for the link. Required when a link is given. */
linkText?: (Scalars['String'] | null),
/** The announcement will not display before this date. Null means it displays as soon as it is enabled. */
start?: (Scalars['DateTime'] | null),
/** Short headline for the announcement. */
subject?: (Scalars['String'] | null),
/** The type of announcement, toggleable or date range */
type?: (Scalars['String'] | null)}


/** Represents a group of applications all being applied for at the same time. As part of the request, multiple applications will be created and either eliminated as ineligible or submitted for approval. */
export interface AppRequestGenqlSelection{
    /** Actions the user can take on this app request. */
    actions?: AppRequestActionsGenqlSelection
    applicant?: AccessUserGenqlSelection
    /** The applications on this request, one per program. Pass programKeys to receive only some of them - a screen that shows one program should not download every program's requirement and prompt tree. */
    applications?: (ApplicationGenqlSelection & { __args?: {programKeys?: (Scalars['String'][] | null)} })
    /** True when at least one reachable prompt anywhere on this request has been invalidated and must be re-answered. Status and phase are computed from the answers on file, so use this flag to explain that the request is held back awaiting a correction. */
    awaitingCorrection?: boolean | number
    /** Date that this request was considered closed and no longer editable. If active or re-opened, will be null. If closed again, will be the second closure date. */
    closedAt?: boolean | number
    createdAt?: boolean | number
    /** All data that has been gathered from the user for this request. It is a Record whose properties are the prompt keys and values are the data gathered by the corresponding prompt dialog. */
    data?: { __args: {
    /** Provide the schemaVersion at the time the UI was built. Will throw an error if the client is too old, so it knows to refresh. */
    schemaVersion?: (Scalars['String'] | null)} } | boolean | number
    /** The version of the data for this app request. This is incremented every time the data is updated. If you provide it with your update requests, the API will perform an optimistic concurrency check and fail the update if someone else has updated the data in the meantime. */
    dataVersion?: boolean | number
    id?: boolean | number
    /** Indexes associated with the App Request. These are pieces of data extracted from the App Request by individual prompts in the ReqQuest project. They have several uses such as filtering App Requests and enriching list views. */
    indexCategories?: (AppRequestIndexCategoryGenqlSelection & { __args?: {
    /** Returns indexes that are flagged to appear in this destination. Also sorts for this destination. */
    for?: (AppRequestIndexDestination | null)} })
    /** Notes attached to this app request. Notes are internal only and only visible to reviewers. They are not visible to applicants. */
    notes?: (NoteGenqlSelection & { __args?: {filter?: (AppRequestNoteFilters | null)} })
    /** Notes attached to other app requests from this same applicant. Useful for providing context information from previous applications. */
    otherNotes?: (NoteGenqlSelection & { __args?: {filter?: (AppRequestNoteFilters | null)} })
    /** The period this appRequest is associated with. */
    period?: PeriodGenqlSelection
    /** The current phase of the app request. The phase generally only changes when control of the app request shifts between the applicant and reviewer. */
    phase?: boolean | number
    /** Retrieve a specific prompt by its ID. This is useful for the UI to get the full prompt data and configuration when trying to edit an individual prompt. We don't want to be downloading all the config data for everything up front. */
    prompt?: (RequirementPromptGenqlSelection & { __args: {promptId: Scalars['ID']} })
    status?: boolean | number
    /** The most pertinent status reason for this app request. The logic is complicated and depends on the AppRequest's status. */
    statusReason?: boolean | number
    /** The date that the applicant submitted their request. If the applicant has not yet submitted, this will be null. */
    submittedAt?: boolean | number
    updatedAt?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AppRequestActionsGenqlSelection{
    /** User may finalize the acceptance or denial of the offer. Sends the app request to non-blocking workflow (or completion). */
    acceptOffer?: boolean | number
    /** User may cancel this app request as the owner. Separate from closing as a reviewer/admin. */
    cancel?: boolean | number
    /** User may close this app request as a reviewer/admin. Separate from cancelling as the app request owner. */
    close?: boolean | number
    /** User may complete the app request. All non-blocking workflow must be complete. */
    completeRequest?: boolean | number
    /** User may complete the review app request. Sends the app request to the acceptance phase, or if there is no acceptance phase, to the non-blocking workflow or completion. */
    completeReview?: boolean | number
    /** User is able to create a new internal note on the app request. */
    createNote?: boolean | number
    /** User is able to create a new internal note on the app request. */
    createPersistentNote?: boolean | number
    /** User may reopen this app request, whether as the owner or as a reviewer/admin. */
    reopen?: boolean | number
    /** User may return this app request to the applicant phase. */
    returnToApplicant?: boolean | number
    /** User may return to the non-blocking workflow phase from completion. */
    returnToNonBlocking?: boolean | number
    /** User may return the app request to the acceptance phase from non-blocking workflow or completion. */
    returnToOffer?: boolean | number
    /** User may return the app request to the review phase from non-blocking workflow or completion. This does not cover reclaiming an offer - see reverseOffer for that. It also does not cover returning from completion to acceptance - see returnToOffer for that. */
    returnToReview?: boolean | number
    /** Whether the user can view this app request as a reviewer. */
    review?: boolean | number
    /** User may submit this app request either as or on behalf of the owner. */
    submit?: boolean | number
    /** User is able to see the acceptance UI. i.e. they are the applicant and the request is in the appropriate phase. */
    viewAcceptUI?: boolean | number
    /** User is able to see the applicant UI. i.e. they are the applicant and the request is in the appropriate phase. */
    viewApplyUI?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AppRequestActivityGenqlSelection{
    action?: boolean | number
    /** The app request this activity is associated with. */
    appRequest?: AppRequestGenqlSelection
    /** The date and time when the action occurred. */
    createdAt?: boolean | number
    /** A JSON object containing additional data about the activity. This could be filtered but different actions would place different data here so it is not strongly typed. */
    data?: boolean | number
    /** A detailed description of the activity. This is not meant to be filtered and could contain specific details about the action. */
    description?: boolean | number
    id?: boolean | number
    /** If this activity was performed by an impersonated user, this will be the user that did the impersonation. */
    impersonatedBy?: AccessUserGenqlSelection
    /** The user that performed the activity. */
    user?: AccessUserGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** This is used to filter a list of activities. */
export interface AppRequestActivityFilters {
/** Filter activities by action. This is a list of action names that should be matched. There are many potential action names, they are untyped. */
actions?: (Scalars['String'][] | null),appRequestIds?: (Scalars['ID'][] | null),
/** Return activities that happened after this date. */
happenedAfter?: (Scalars['DateTime'] | null),
/** Return activities that happened before this date. */
happenedBefore?: (Scalars['DateTime'] | null),
/** true -> Return activities that were performed while a user was impersonating another user. false -> Return activities that were not impersonated. */
impersonated?: (Scalars['Boolean'] | null),
/** Return activities that were performed while one of the given logins was impersonating another user. */
impersonatedBy?: (Scalars['ID'][] | null),
/** Return activities that were performed while one of the given logins was being impersonated by someone else. */
impersonatedUsers?: (Scalars['ID'][] | null),
/** Filter activities by matching description content. */
search?: (Scalars['String'] | null),
/** Return activities that were performed by one of the given logins. Also returns activities that were performed while one of the given logins was impersonating someone else. */
users?: (Scalars['ID'][] | null)}


/** Applicant counts for a set of appRequests. A request is a returning application when its applicant also submitted a request in an earlier period (by open date); otherwise it is a first-time application. Unsubmitted drafts in earlier periods do not count. */
export interface AppRequestApplicantCountsGenqlSelection{
    /** Matching appRequests whose applicant submitted nothing in any earlier period. */
    firstTime?: boolean | number
    /** Matching appRequests whose applicant also submitted a request in an earlier period. */
    returning?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AppRequestFilter {
/** Only return appRequests with at least one application matching one of the given entries (OR). When programKeys is also given, the same application must match both. */
applicationStatuses?: (ApplicationStatusFilter[] | null),
/** true -> only return appRequests that are closed. false -> only return appRequests that are open. null -> return all appRequests. */
closed?: (Scalars['Boolean'] | null),
/** Only return appRequests that were closed after this date. Open appRequests will be filtered out. */
closedAfter?: (Scalars['DateTime'] | null),
/** Only return appRequests that were closed before this date. Open appRequests will be filtered out. */
closedBefore?: (Scalars['DateTime'] | null),
/** true -> only return appRequests that are complete (i.e. no more work to do, everything including nonblocking workflow is done). false -> only return appRequests that are not complete. null -> return all appRequests. Complete does not necessarily mean closed. */
complete?: (Scalars['Boolean'] | null),
/** Only return appRequests that were created after this date. */
createdAfter?: (Scalars['DateTime'] | null),
/** Only return appRequests that were created before this date. */
createdBefore?: (Scalars['DateTime'] | null),ids?: (Scalars['ID'][] | null),
/** Only return appRequests that match one of the given indexes. */
indexes?: (AppRequestIndexFilter[] | null),
/** Only return appRequests that are owned by one the given logins. */
logins?: (Scalars['ID'][] | null),
/** Only return appRequests that are owned by the current user. */
own?: (Scalars['Boolean'] | null),periodIds?: (Scalars['ID'][] | null),
/** Only return appRequests that have an application for one of the given programs. When applicationStatuses is also given, the same application must match both. */
programKeys?: (Scalars['ID'][] | null),
/** Only return appRequests where at least one application is in one of the given rescinded states. Rescinding is per-application, so this is independent of the appRequest status. */
rescindedStatus?: (ApplicationRescindedStatus[] | null),
/** Only return appRequests that have had their review started. true -> return review started, false -> return not started. Note that this is NOT mutually exclusive with complete or closed, it very simply means that a non-applicant has taken an action on it. */
reviewStarted?: (Scalars['Boolean'] | null),
/** Search for appRequests that match this search term. This will do a prefix search across all fields that are indexed. */
search?: (Scalars['String'] | null),status?: (AppRequestStatus[] | null),
/** Only return appRequests that were submitted after this date. App Requests that have not been submitted will be filtered out. */
submittedAfter?: (Scalars['DateTime'] | null),
/** Only return appRequests that were submitted before this date. App Requests that have not been submitted will be filtered out. */
submittedBefore?: (Scalars['DateTime'] | null),
/** Only return appRequests that were updated after this date. */
updatedAfter?: (Scalars['DateTime'] | null),
/** Only return appRequests that were updated before this date. */
updatedBefore?: (Scalars['DateTime'] | null)}


/** This represents an index category attached to an app request. Its tagStrings property contains the tag values that have been extracted from the app request data. */
export interface AppRequestIndexCategoryGenqlSelection{
    /** If this is > 0, the index values should be shown on the main app request list page, sorted by this priority in descending order. */
    appRequestListPriority?: boolean | number
    /** If this is > 0, the index values should be shown on the applicant dashboard, sorted by this priority in descending order. */
    applicantDashboardPriority?: boolean | number
    /** The internal category name for this index. Use this with any GraphQL filters. */
    category?: boolean | number
    /** A human-friendly label for this category that can be shown in the UI. */
    categoryLabel?: boolean | number
    /** If this is > 0, the index values should be shown on the list filters, sorted by this priority in descending order. */
    listFiltersPriority?: boolean | number
    /** If true, this category has few enough values that it is reasonable to list them all in a dropdown or similar UI control. If false, the list of values is likely to get very long and it would be better to use an autofill combobox or something. */
    listable?: boolean | number
    /** If this is > 0, the index values should be shown on the reviewer dashboard, sorted by this priority in descending order. */
    reviewerDashboardPriority?: boolean | number
    values?: IndexValueGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface AppRequestIndexFilter {category: Scalars['String'],tags: Scalars['String'][]}

export interface AppRequestNoteFilters {
/** Filter notes to those attached to the specified application requests. */
appRequestIds?: (Scalars['ID'][] | null),
/** Filter notes to those attached to application requests from the specified applicants (by login name). */
applicants?: (Scalars['String'][] | null),
/** Filter to the specified note IDs. */
ids?: (Scalars['ID'][] | null)}


/** An application represents the applicant applying to a specific program. Each appRequest has multiple applications - one per program defined in the system. Some applications are mutually exclusive and/or will be eliminated early based on PREQUAL requirements, but they all technically exist in the data model - there is no concept of picking one application over another, just two applications where one dies and the other survives. */
export interface ApplicationGenqlSelection{
    actions?: ApplicationActionsGenqlSelection
    /** A brief description, written for applicants, of the program this application is for. */
    applicantDescription?: boolean | number
    /** True when at least one reachable prompt on this application has been invalidated and must be re-answered. Status is still computed from the answers on file, so pair status displays with this flag to indicate that a correction is outstanding. */
    awaitingCorrection?: boolean | number
    /** A prose summary of the applicant-side requirements of the program this application is for. Intended to be shown alongside statusReason when the application becomes ineligible before submission, since an applicant disqualified early may never have seen the program's prompts and the statusReason alone lacks context. */
    eligibilityDescription?: boolean | number
    /** True when the program sets showIneligiblePreSubmit: false and this application is hidden by it: ineligible because of an applicant requirement, and that ineligibility arose before submission (the request is unsubmitted, or the application was already ineligible when it was submitted). Only the applicant ever receives a hidden application, so they can still change the answers that disqualified them; UIs should leave it out of program lists. */
    hiddenIneligiblePreSubmit?: boolean | number
    id?: boolean | number
    /** The phase in which this application became ineligible for benefits. Useful for reporting / filtering. Null if the application is not (yet) ineligible. */
    ineligiblePhase?: boolean | number
    /** The navigation title of the program this application is for. */
    navTitle?: boolean | number
    /** The next workflow stage for this application that would be active after activating the advanceWorkflow mutation. Null if the application or current user is not allowed to advance. */
    nextWorkflowStage?: PeriodWorkflowStageGenqlSelection
    /** The phase of the application. This is usually a computed field, not stored in the database. */
    phase?: boolean | number
    /** The previous workflow stage for this application that would be active after activating the reverseWorkflow mutation. Null if the application or current user is not allowed to reverse. */
    previousWorkflowStage?: PeriodWorkflowStageGenqlSelection
    /** The program key this application corresponds to. */
    programKey?: boolean | number
    requirements?: ApplicationRequirementGenqlSelection
    /** The reason the application was rescinded */
    rescindedReason?: boolean | number
    /** The application rescinded status */
    rescindedStatus?: boolean | number
    /** The reason the application was restored after previously being rescinded */
    restoredReason?: boolean | number
    status?: boolean | number
    /** When one of the application's requirements is failing or throwing a warning, its reason will be copied here for convenience. If there is a warning and then later a failure, the failure reason will win. */
    statusReason?: boolean | number
    /** The title of the program this application is for. */
    title?: boolean | number
    /** If the program has workflow, it may be divided into multiple stages of audit, each with their own requirements/prompts. This indicates which stage we are currently evaluating, or null if we are not in the workflow phase. An application with no workflow defined will never be in the workflow phase. Starts at 1. */
    workflowStage?: PeriodWorkflowStageGenqlSelection
    /** All workflow stages defined for the program/period of this application, in evaluation order. */
    workflowStages?: PeriodWorkflowStageGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ApplicationActionsGenqlSelection{
    advanceWorkflow?: boolean | number
    rescindApplication?: boolean | number
    restoreApplication?: boolean | number
    reverseWorkflow?: boolean | number
    viewAsReviewer?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** Calculated application metrics */
export interface ApplicationMetricGenqlSelection{
    approved?: boolean | number
    closed?: boolean | number
    denied?: boolean | number
    entries?: ApplicationMetricEntryGenqlSelection
    rescinded?: boolean | number
    started?: boolean | number
    submitted?: boolean | number
    toDecision?: ApplicationMetricTimingGenqlSelection
    toSubmit?: ApplicationMetricTimingGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** Application metric entry */
export interface ApplicationMetricEntryGenqlSelection{
    appRequestId?: boolean | number
    applicantFullname?: boolean | number
    applicantId?: boolean | number
    applicantLogin?: boolean | number
    applicationId?: boolean | number
    closedAt?: boolean | number
    createdAt?: boolean | number
    ineligiblePhase?: boolean | number
    periodCode?: boolean | number
    periodId?: boolean | number
    periodName?: boolean | number
    phase?: boolean | number
    programKey?: boolean | number
    status?: boolean | number
    submittedAt?: boolean | number
    updatedAt?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** Application metric timings */
export interface ApplicationMetricTimingGenqlSelection{
    avg?: boolean | number
    max?: boolean | number
    min?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** The specific instance of a requirement on a particular application. Stores the status of the requirement, e.g. being satisfied or not. */
export interface ApplicationRequirementGenqlSelection{
    application?: ApplicationGenqlSelection
    /** The prompt keys the requirement named as responsible for its current status. Used to attach status indicators to the specific answers at fault instead of every prompt the requirement consults. Null when the requirement did not name any, in which case all of its prompts are implicated. */
    blame?: boolean | number
    /** The configuration data for this requirement in the app request's period. */
    configurationData?: boolean | number
    /** An internal description of the requirement. Probably not shown to users. */
    description?: boolean | number
    id?: boolean | number
    /** A human and machine readable unique and stable identifier that we can use to add javascript logic to the evaluation of whether a requirement is satisfied. For example: "gi_ch33_must_be_post911" */
    key?: boolean | number
    /** A human readable title for the requirement in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle?: boolean | number
    prompts?: (RequirementPromptGenqlSelection & { __args?: {filter?: (RequirementPromptFilter | null)} })
    /** The smart title for this requirement in the app request's period. For instance, might be "Applicant must have GPA over 3.4" instead of the regular title "Applicant must meet GPA requirement". Will fall back to the regular title for any requirement that does not provide a smart title. */
    smartTitle?: boolean | number
    /** The status of the requirement. This is what will be shown to users. */
    status?: boolean | number
    /** The reason why the requirement is in the status it is in. This will be shown to the applicant. */
    statusReason?: boolean | number
    /** A human readable title for the requirement. This is what will be shown to users. */
    title?: boolean | number
    /** The type of requirement. This determines when the requirement is evaluated and who can see the requirement. */
    type?: boolean | number
    /** The stage of the workflow for this requirement. Null if not part of a workflow stage */
    workflowStage?: PeriodWorkflowStageGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** Matches an application by its stored status and, optionally, its rescind state. Status is the stored computedStatus, so RESCINDED is not a valid value here - express it as status ELIGIBLE or ACCEPTED with rescindedStatus RESCINDED. */
export interface ApplicationStatusFilter {
/** When omitted, matches applications currently in the given status (not rescinded). When given, matches only applications in exactly that rescind state. */
rescindedStatus?: (ApplicationRescindedStatus | null),status: ApplicationStatus}

export interface CategoryGenqlSelection{
    /** This is indexed name of the category. Categories are indexed to allow for quick filtering of a list of items. e.g. institutionalRoles */
    category?: boolean | number
    /** Displayed Label of the category. e.g. Institutional Roles */
    label?: boolean | number
    /** IDs are the unique values that may be used to group an items. Multiple IDs may be assigned to an item. i.e. ["Staff", "Faculty", "Student"] */
    tags?: CategoryTagGenqlSelection
    /** Set this to true should be available as a filter in the User list view. */
    useInFilters?: boolean | number
    /** Set this to true should be displayed as a column in the User list view. */
    useInList?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface CategoryTagGenqlSelection{
    /** Displayed Label of the tag in the UI Filter. This value should be unique enough to be distinguishable between other tags within a category type. */
    label?: boolean | number
    /** This is the indexed name of the tagged instance within a category type and is what is stored/searched for in the database. */
    tag?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ConfigurationGenqlSelection{
    actions?: ConfigurationAccessGenqlSelection
    data?: boolean | number
    fetchedData?: boolean | number
    /** The key being configured. Could be a requirement, prompt, or program key. A program's configuration holds its per-period title and navTitle overrides. */
    key?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ConfigurationAccessGenqlSelection{
    update?: boolean | number
    view?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ConfigurationFilters {
/** Return specific configurations. */
ids?: (Scalars['ID'][] | null),
/** Return configurations for these keys. */
keys?: (Scalars['String'][] | null),
/** Return configurations for these period codes. */
periodCodes?: (Scalars['String'][] | null),
/** Return configurations for these period IDs. */
periodIds?: (Scalars['ID'][] | null)}


/** This represents an index as registered by one of the project's prompt definitions. */
export interface IndexCategoryGenqlSelection{
    /** If this is > 0, the index values should be shown on the main app request list page, sorted by this priority in descending order. */
    appRequestListPriority?: boolean | number
    /** If this is > 0, the index values should be shown on the applicant dashboard, sorted by this priority in descending order. */
    applicantDashboardPriority?: boolean | number
    /** The internal category name for this index. Use this with any GraphQL filters. */
    category?: boolean | number
    /** A human-friendly label for this category that can be shown in the UI. */
    categoryLabel?: boolean | number
    /** If this is > 0, the index values should be shown on the list filters, sorted by this priority in descending order. */
    listFiltersPriority?: boolean | number
    /** If true, this category has few enough values that it is reasonable to list them all in a dropdown or similar UI control. If false, the list of values is likely to get very long and it would be better to use an autofill combobox or something. */
    listable?: boolean | number
    /** If this is > 0, the index values should be shown on the reviewer dashboard, sorted by this priority in descending order. */
    reviewerDashboardPriority?: boolean | number
    values?: (IndexValueGenqlSelection & { __args?: {
    /** If true, only return tags that are currently in use by app requests. This is useful for only presenting useful filters. */
    inUse?: (Scalars['Boolean'] | null), search?: (Scalars['String'] | null)} })
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface IndexValueGenqlSelection{
    label?: boolean | number
    value?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface MetricAccessUserFilters {
/** Return application metrics from users that have any of these fullnames. */
fullnames?: (Scalars['String'][] | null),
/** Return application metrics from users that have any of these IDs. */
ids?: (Scalars['ID'][] | null),
/** Return application metrics from users that have any of these logins. */
logins?: (Scalars['String'][] | null)}

export interface MetricApplicationFilters {
/** Return application metrics from applicants that match any of these filters. */
applicants?: (MetricAccessUserFilters | null),
/** Return application metrics for applications that have any of these IDs. */
applicationIds?: (Scalars['ID'][] | null),
/** Return application metrics for applications that were closed after this date. */
closedAfterDateTime?: (Scalars['DateTime'] | null),
/** Return application metrics for applications that were closed before this date. */
closedBeforeDateTime?: (Scalars['DateTime'] | null),
/** Return application metrics from periods that match any of these filters. */
periods?: (MetricPeriodFilters | null),
/** Return application metrics for applications that started after this date. */
startedAfterDateTime?: (Scalars['DateTime'] | null),
/** Return application metrics for applications that started before this date. */
startedBeforeDateTime?: (Scalars['DateTime'] | null),
/** Return application metrics for applications that were submitted after this date. */
submittedAfterDateTime?: (Scalars['DateTime'] | null),
/** Return application metrics for applications that were submitted before this date. */
submittedBeforeDateTime?: (Scalars['DateTime'] | null)}

export interface MetricPeriodFilters {
/** Return application metrics from periods that have any of these codes. */
codes?: (Scalars['String'][] | null),
/** Return application metrics from periods that have any of these IDs. */
ids?: (Scalars['ID'][] | null),
/** Return rapplication metrics from periods that have any of these names. */
names?: (Scalars['String'][] | null)}

export interface MutationGenqlSelection{
    /** This is for the applicant to accept or reject the offer that was made based on their app request. The difference between accept and reject is determined by the status of the acceptance requirements. They will still "accept offer" after they answer that they do not want the offer. If there is non-blocking workflow on any applications, the first one in each will begin. Applications without non-blocking workflow will be advanced to the COMPLETE phase. If all applications are complete, the app request will be closed. */
    acceptOffer?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Add a note to the app request. */
    addNote?: (ValidatedNoteResponseGenqlSelection & { __args: {appRequestId: Scalars['ID'], 
    /** The content of the note. HTML is expected. */
    content: Scalars['String'], persistent?: (Scalars['Boolean'] | null), validateOnly?: (Scalars['Boolean'] | null)} })
    /** Moves the application to the next blocking workflow stage. If phase is READY_FOR_WORKFLOW, moves to the first or next blocking workflow stage. If on the last blocking workflow, moves to REVIEW_COMPLETE. In the non-blocking (WORKFLOW_NONBLOCKING) phase the workflow is non-sequential with all non-blocking requirements editable at once and once they are all resolved this becomes a single "Send to Complete" action that moves the application to COMPLETE. */
    advanceWorkflow?: (ValidatedAppRequestResponseGenqlSelection & { __args: {applicationId: Scalars['ID']} })
    /** Cancel or withdraw the app request, depending on its current phase. This is only available if the app request is in a cancellable state. */
    cancelAppRequest?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID'], 
    /** If the user is currently viewing some of the app request details, include the dataVersion here to make the cancellation fail when the app request has been updated by another user. */
    dataVersion?: (Scalars['Int'] | null)} })
    /** Close the app request. Generally this is always available and will freeze the request/applications in their current phase/status. */
    closeAppRequest?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Complete the app request. This is generally only available if request is in non-blocking workflow and all applications are complete. */
    completeRequest?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Make an offer on the app request. If all applications are ineligible, or if there are no acceptance requirements, the applications will advance to the non-blocking workflow, or absent that, be marked complete. */
    completeReview?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Create a new site-wide announcement. */
    createAnnouncement?: (ValidatedAnnouncementResponseGenqlSelection & { __args: {announcement: AnnouncementUpdate, validateOnly?: (Scalars['Boolean'] | null)} })
    /** Create a new app request. */
    createAppRequest?: (ValidatedAppRequestResponseGenqlSelection & { __args: {login: Scalars['String'], periodId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    createPeriod?: (ValidatedPeriodResponseGenqlSelection & { __args: {copyPeriodId?: (Scalars['String'] | null), period: PeriodUpdate, validateOnly?: (Scalars['Boolean'] | null)} })
    /** Delete an existing site-wide announcement. */
    deleteAnnouncement?: (ValidatedResponseGenqlSelection & { __args: {announcementId: Scalars['ID']} })
    /** Delete an existing note. */
    deleteNote?: { __args: {noteId: Scalars['ID']} }
    deletePeriod?: (ValidatedResponseGenqlSelection & { __args: {periodId: Scalars['ID']} })
    markPeriodReviewed?: (ValidatedPeriodResponseGenqlSelection & { __args: {periodId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    /** Reopen the app request. This is only available if the app request is in a state that allows reopening. */
    reopenAppRequest?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Rescinds the approved and/or accepted application. */
    rescind?: (ValidatedAppRequestResponseGenqlSelection & { __args: {applicationId: Scalars['ID'], reason: Scalars['String'], validateOnly?: (Scalars['Boolean'] | null)} })
    /** Restores a previously rescinded application to its previous state. */
    restore?: (ValidatedAppRequestResponseGenqlSelection & { __args: {applicationId: Scalars['ID'], reason: Scalars['String'], validateOnly?: (Scalars['Boolean'] | null)} })
    /** Return the app request to the applicant phase. This is only available if the app request is in a state that allows returning. */
    returnToApplicant?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** If request is complete, undo and return to non-blocking workflow. */
    returnToNonBlocking?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Return the app request to the acceptance phase from non-blocking workflow or completion. */
    returnToOffer?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Return the app request to the review phase from acceptance, non-blocking workflow, or completion. */
    returnToReview?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Moves the application back to the previous blocking workflow stage. Non-blocking workflow stages are excluded from the reverse order, so this only steps back through the blocking workflow during the review (SUBMITTED) phase.  If no blocking then moved to APPROVAL */
    reverseWorkflow?: (ValidatedAppRequestResponseGenqlSelection & { __args: {applicationId: Scalars['ID']} })
    roleAddGrant?: (AccessRoleValidatedResponseGenqlSelection & { __args: {grant: AccessRoleGrantCreate, roleId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    roleCreate?: (AccessRoleValidatedResponseGenqlSelection & { __args: {copyRoleId?: (Scalars['ID'] | null), role: AccessRoleInput, validateOnly?: (Scalars['Boolean'] | null)} })
    roleDelete?: (ValidatedResponseGenqlSelection & { __args: {roleId: Scalars['ID']} })
    roleDeleteGrant?: (AccessRoleValidatedResponseGenqlSelection & { __args: {grantId: Scalars['ID']} })
    roleUpdate?: (AccessRoleValidatedResponseGenqlSelection & { __args: {role: AccessRoleInput, roleId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    roleUpdateGrant?: (AccessRoleValidatedResponseGenqlSelection & { __args: {grant: AccessRoleGrantUpdate, grantId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    /** Submit the app request. Applications whose program has no reviewer questions (no PREAPPROVAL or APPROVAL requirements) advance on their own into their first blocking workflow stage or to REVIEW_COMPLETE; when nothing is left to review, the review is completed automatically as well. Applications ruled out before submission (PREQUAL or QUALIFICATION) do not hold that back. */
    submitAppRequest?: (ValidatedAppRequestResponseGenqlSelection & { __args: {appRequestId: Scalars['ID']} })
    /** Toggle an existing note's persistent status. */
    togglePersistence?: (ValidatedNoteResponseGenqlSelection & { __args: {noteId: Scalars['ID']} })
    /** Update an existing site-wide announcement. */
    updateAnnouncement?: (ValidatedAnnouncementResponseGenqlSelection & { __args: {announcement: AnnouncementUpdate, announcementId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    updateConfiguration?: (ValidatedConfigurationResponseGenqlSelection & { __args: {data: Scalars['JsonData'], key: Scalars['String'], periodId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    /** Update the content of an existing note. */
    updateNote?: (ValidatedNoteResponseGenqlSelection & { __args: {content: Scalars['String'], noteId: Scalars['ID']} })
    updatePeriod?: (ValidatedPeriodResponseGenqlSelection & { __args: {periodId: Scalars['ID'], update: PeriodUpdate, validateOnly?: (Scalars['Boolean'] | null)} })
    updatePeriodRequirement?: (ValidatedResponseGenqlSelection & { __args: {disabled: Scalars['Boolean'], periodId: Scalars['String'], requirementKey: Scalars['String']} })
    /** Update the data for a prompt in this app request. */
    updatePrompt?: (ValidatedAppRequestResponseGenqlSelection & { __args: {data: Scalars['JsonData'], 
    /** The data version of the app request at the time this prompt was loaded. If provided, the API will perform an optimistic concurrency check and fail the update if someone else has updated the data in the meantime. */
    dataVersion?: (Scalars['Int'] | null), overrideInvalidated?: (Scalars['Boolean'] | null), promptId: Scalars['ID'], validateOnly?: (Scalars['Boolean'] | null)} })
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface MutationMessageGenqlSelection{
    /** The path to the arg that produced the error. Dot-separated (lodash.get compatible) if it is deep inside an input type. Null if no particular arg can be blamed for the error. */
    arg?: boolean | number
    /** An error message to be shown to the end user, with the context of the given arg. */
    message?: boolean | number
    /** The type of error message. See the enum descriptions for more detail. */
    type?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** An internal note attached to an application request. Notes are always written by reviewers and never visible to applicants. "Messages" are for reviewers and applicants communicating with one another. */
export interface NoteGenqlSelection{
    actions?: NoteActionsGenqlSelection
    /** The app request this note is attached to. */
    appRequest?: AppRequestGenqlSelection
    /** The author of the note. */
    author?: AccessUserGenqlSelection
    /** The content of the note in HTML. */
    content?: boolean | number
    createdAt?: boolean | number
    id?: boolean | number
    /** Whether this note contains permanently useful information about a person, as opposed to only being relevant in the context of the app request it was posted to. */
    persistent?: boolean | number
    updatedAt?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** Actions that can be performed on a note. */
export interface NoteActionsGenqlSelection{
    delete?: boolean | number
    update?: boolean | number
    updatePersistent?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface Pagination {
/** The page number to retrieve. If not provided, will default to 1. */
page?: (Scalars['Int'] | null),perPage?: (Scalars['Int'] | null)}

export interface PaginationInfoWithTotalItemsGenqlSelection{
    /** List of indexed category data related to items within a page. Often used for filtering items. */
    categories?: CategoryGenqlSelection
    /** The current page number, starting at 1. This is always provided - if pagination was not requested, will return 1. */
    currentPage?: boolean | number
    /** Indicates whether requesting the next page would provide more results. Especially useful for models that cannot provide total item count for practical reasons. Note that over time, more results can appear and make this answer wrong, so in some circumstances it makes sense to request another page anyway. */
    hasNextPage?: boolean | number
    /** The number of items per page. Null if pagination was not requested/forced because results per page is unlimited. */
    perPage?: boolean | number
    /** If possible, the total number of results will be provided. The API may return null if calculating the total is impractical. If pagination was not requested/forced, will equal the result count. */
    totalItems?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PaginationResponseGenqlSelection{
    accessUsers?: PaginationInfoWithTotalItemsGenqlSelection
    appRequests?: PaginationInfoWithTotalItemsGenqlSelection
    appRequestsActivity?: PaginationInfoWithTotalItemsGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PeriodGenqlSelection{
    actions?: PeriodActionsGenqlSelection
    /** This is useful for filtering out periods that are no longer useful. For instance, a window might close applications after 2 weeks but the reviewers could be working. */
    archiveDate?: boolean | number
    /** Date that this period closes for applications. Some periods do not set a close date. */
    closeDate?: boolean | number
    /** Unique identifier for this period that references an external system. Ideally human readable. */
    code?: boolean | number
    configurations?: (ConfigurationGenqlSelection & { __args?: {filter?: (ConfigurationFilters | null)} })
    id?: boolean | number
    /** Name for this period. Will be displayed to applicants if they create an App Request while two periods are simultaneously open. */
    name?: boolean | number
    /** Date that this period opens for applications. */
    openDate?: boolean | number
    programs?: PeriodProgramGenqlSelection
    prompts?: PeriodPromptGenqlSelection
    requirements?: PeriodProgramRequirementGenqlSelection
    /** Whether this period's configurations have been reviewed by an administrator. Newly created periods must be reviewed before they will accept new app requests, even if the open date has passed. */
    reviewed?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PeriodActionsGenqlSelection{
    createAppRequest?: boolean | number
    delete?: boolean | number
    update?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PeriodFilters {
/** Return periods that will be archived after this date. */
archiveAfter?: (Scalars['DateTime'] | null),
/** Return periods that were archived before this date. */
archiveBefore?: (Scalars['DateTime'] | null),
/** Return periods that are open at this date or will be open after it. */
closesAfter?: (Scalars['DateTime'] | null),
/** Return periods that closed before this date, not including that date's active period(s). */
closesBefore?: (Scalars['DateTime'] | null),
/** Return periods that have any of these codes. */
codes?: (Scalars['String'][] | null),
/** Return periods that have any of these IDs. */
ids?: (Scalars['ID'][] | null),
/** Return periods that have any of these names. */
names?: (Scalars['String'][] | null),
/** true -> open periods. false -> closed periods. null -> all periods. */
openNow?: (Scalars['Boolean'] | null),
/** Return periods that open after this date, not including that date's active period(s). */
opensAfter?: (Scalars['DateTime'] | null),
/** Return periods that are open at this date or have been open before it. */
opensBefore?: (Scalars['DateTime'] | null)}

export interface PeriodProgramGenqlSelection{
    actions?: PeriodProgramActionsGenqlSelection
    /** A brief description of the program, written for applicants. */
    applicantDescription?: boolean | number
    /** The configuration for this program in the period, which holds its title and navTitle overrides. */
    configuration?: ConfigurationGenqlSelection
    /** A prose summary of the applicant-side requirements of the program. Intended to be shown to applicants who become ineligible before submission, since they may never have seen the program's prompts. */
    eligibilityDescription?: boolean | number
    /** Whether the program is enabled in this period. This is set by the system administrator. */
    enabled?: boolean | number
    key?: boolean | number
    navTitle?: boolean | number
    period?: PeriodGenqlSelection
    requirements?: PeriodProgramRequirementGenqlSelection
    title?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PeriodProgramActionsGenqlSelection{
    configure?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PeriodProgramRequirementGenqlSelection{
    /** The configuration for this requirement in the period. */
    configuration?: ConfigurationGenqlSelection
    /** An internal description of the requirement. Probably not shown to users. */
    description?: boolean | number
    /** Whether the requirement is enabled in this period. This is set by the system administrator. */
    enabled?: boolean | number
    /** A human and machine readable unique and stable identifier that we can use to add javascript logic to the evaluation of whether a requirement is satisfied. For example: "gi_ch33_must_be_post911" */
    key?: boolean | number
    /** A human readable title for the requirement in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle?: boolean | number
    prompts?: PeriodPromptGenqlSelection
    /** A human readable title for the requirement. This is what will be shown to users. */
    title?: boolean | number
    /** The type of requirement. This determines when the requirement is evaluated and who can see the requirement. */
    type?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PeriodPromptGenqlSelection{
    /** The configuration for this prompt in the given period. */
    configuration?: ConfigurationGenqlSelection
    /** A brief description of the prompt. This should be shown to administrators to help explain the full meaning of the prompt while assigning permissions or editing its configuration. */
    description?: boolean | number
    /** A human and machine readable identifier for the prompt. Will be used to match prompt data with UI and API code that handles it. */
    key?: boolean | number
    /** A human readable title for the prompt in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle?: boolean | number
    periodId?: boolean | number
    /** A human readable title for the prompt. This is what will be shown to users. */
    title?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PeriodUpdate {archiveDate?: (Scalars['DateTime'] | null),closeDate?: (Scalars['DateTime'] | null),code?: (Scalars['String'] | null),name: Scalars['String'],openDate: Scalars['DateTime']}

export interface PeriodWorkflowStageGenqlSelection{
    /** Whether this stage is blocking. If true, the application cannot be completed and shown to the applicant until all requirements in this stage are satisfied. */
    blocking?: boolean | number
    /** Globally unique key for this workflow stage. Use lowercase snake_case, alphanumeric and underscore only. */
    key?: boolean | number
    /** A human readable title for the workflow stage. */
    title?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ProgramGenqlSelection{
    /** A brief description of the program, written for applicants. */
    applicantDescription?: boolean | number
    /** A prose summary of the applicant-side requirements of the program. Intended to be shown to applicants who become ineligible before submission, since they may never have seen the program's prompts. */
    eligibilityDescription?: boolean | number
    key?: boolean | number
    navTitle?: boolean | number
    title?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ProgramFilters {keys?: (Scalars['String'][] | null)}

export interface QueryGenqlSelection{
    /**
     * 
     *     This is the global access object. Each field represents a global permission
     *     like the ability to view the role management interface.
     *   
     */
    access?: AccessGenqlSelection
    accessUsers?: (AccessUserGenqlSelection & { __args?: {filter?: (AccessUserFilter | null), paged?: (Pagination | null)} })
    /** Retrieve site-wide announcements. Any authenticated user may retrieve any announcement, including ones that are disabled or outside their date range; pass filter.active to limit the result to the announcements that should be displaying right now. */
    announcements?: (AnnouncementGenqlSelection & { __args?: {filter?: (AnnouncementFilters | null)} })
    /** The activity log for this app request. This is a list of actions taken on the app request, such as submission, updating prompts, make an offer, add a note, etc. It will be sorted by the date of the activity in descending order. */
    appRequestActivity?: (AppRequestActivityGenqlSelection & { __args: {
    /** Filters to apply to the activity log. This can be used to filter by action type, date range, etc. */
    filters?: (AppRequestActivityFilters | null), id: Scalars['String'], paged?: (Pagination | null)} })
    appRequestIndexes?: (IndexCategoryGenqlSelection & { __args?: {categories?: (Scalars['String'][] | null), 
    /** Returns indexes that are flagged to appear in this destination. Also sorts for this destination. */
    for?: (AppRequestIndexDestination | null)} })
    appRequests?: (AppRequestGenqlSelection & { __args?: {filter?: (AppRequestFilter | null), paged?: (Pagination | null)} })
    applicationMetrics?: (ApplicationMetricGenqlSelection & { __args?: {filter?: (MetricApplicationFilters | null)} })
    /** This is where you get information about the authorization system. Each grant will be associated with one of these controlGroups, one or more controls in the group, and an optional set of tags. The tags are used to limit the scope of the grant. */
    controlGroups?: AccessControlGroupGenqlSelection
    /** First-time vs returning applicant counts for the matching appRequests (see AppRequestApplicantCounts). */
    countAppRequestApplicants?: (AppRequestApplicantCountsGenqlSelection & { __args?: {filter?: (AppRequestFilter | null)} })
    countAppRequests?: { __args: {filter?: (AppRequestFilter | null)} } | boolean | number
    pageInfo?: PaginationResponseGenqlSelection
    periods?: (PeriodGenqlSelection & { __args?: {filter?: (PeriodFilters | null)} })
    programs?: (ProgramGenqlSelection & { __args?: {filter?: (ProgramFilters | null)} })
    roles?: (AccessRoleGenqlSelection & { __args?: {filter?: (AccessRoleFilter | null)} })
    /** A list of all possible scopes. Scopes are used to limit users when they are accessing the system through an alternate UI or login method. For instance, if you generate an authentication token to give to a third party, it may have a scope identifying that third party and limiting their access even though they are acting as you. Roles must match the token scope in order to apply permissions. */
    scopes?: boolean | number
    userIndexes?: (IndexCategoryGenqlSelection & { __args?: {
    /** Returns indexes that are flagged to appear in this destination. Also sorts for this destination. */
    for?: (AppRequestIndexDestination | null)} })
    __typename?: boolean | number
    __scalar?: boolean | number
}


/** A RequestPrompt is an instance of a Prompt on a particular request. Once the user has answered the prompt, it contains the answer and the prompt status on that request. */
export interface RequirementPromptGenqlSelection{
    /** Actions that the user can take on this prompt. */
    actions?: RequirementPromptActionsGenqlSelection
    /** Whether the prompt has been answered on this request. Note that the answer may be marked invalidated, which means that even though it has been answered, the current answer can't be used and the user needs to answer it again. */
    answered?: boolean | number
    /** The configuration data for this prompt in the app request's period. */
    configurationData?: boolean | number
    /** The data that has been gathered from the user in response to this prompt. The schema is controlled by the question's implementation. */
    data?: { __args: {
    /** Provide the schemaVersion at the time the UI was built. Will throw an error if the client is too old, so it knows to refresh. */
    schemaVersion?: (Scalars['String'] | null)} } | boolean | number
    /** A brief description of the prompt. This should be shown to administrators to help explain the full meaning of the prompt while assigning permissions or editing its configuration. */
    description?: boolean | number
    /** Any data that the API needs to provide to the UI to build the prompt form properly. For instance, it could pull reference information from an external system, e.g. a student's course schedule, for display in the prompt dialog. Null if the user is not currently allowed to update the prompt. */
    fetchedData?: { __args: {
    /** Provide the schemaVersion at the time the UI was built. Will throw an error if the client is too old, so it knows to refresh. */
    schemaVersion?: (Scalars['String'] | null)} } | boolean | number
    /** Extra configuration data that is relevant for this prompt. This configuration is explicitly gathered from related requirements and prompts by the gatherConfig function in the prompt definition. */
    gatheredConfigData?: boolean | number
    /** Identifies if the prompt already has saved data.  Assists in determining if the user has previously interacted with this prompt. */
    hasSavedData?: boolean | number
    id?: boolean | number
    /** When true, this prompt has been invalidated by the answer to another prompt. The `answered` field will remain true so be sure to check this field as well when determining whether the prompt is complete. */
    invalidated?: boolean | number
    /** If the prompt has been invalidated, this may contain a reason why. It should be displayed to the user. */
    invalidatedReason?: boolean | number
    /** A human and machine readable identifier for the prompt. Will be used to match prompt data with UI and API code that handles it. */
    key?: boolean | number
    /** This prompt's requirement follows a requirement that has already marked the application as ineligible. The prompt still has visibility of AVAILABLE OR REQUEST_DUPE OR APPLICATION_DUPE as normal, but should probably be shown to the user as disabled or not shown at all. */
    moot?: boolean | number
    /** A human readable title for the prompt in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used. */
    navTitle?: boolean | number
    /** True when this row exists only because its requirement listed the prompt in `promptKeysNoDisplay` */
    noDisplay?: boolean | number
    optOut?: boolean | number
    /** Preload data that has been generated according to the prompt definition. For example, a prompt might query the database for answers given in previous requests or query an external API to learn facts about the user. */
    preloadData?: { __args: {
    /** Provide the schemaVersion at the time the UI was built. Will throw an error if the client is too old, so it knows to refresh. */
    schemaVersion?: (Scalars['String'] | null)} } | boolean | number
    /** Prestage data that has been generated according to the prompt definition. A prompt might require data that should only be modified API side (not client manipulable), such as user specific info sourced from other systems. */
    prestageData?: { __args: {
    /** Provide the schemaVersion at the time the UI was built. Will throw an error if the client is too old, so it knows to refresh. */
    schemaVersion?: (Scalars['String'] | null)} } | boolean | number
    /** The requirement that this prompt is associated with. */
    requirement?: ApplicationRequirementGenqlSelection
    /** A human readable title for the prompt. This is what will be shown to users. */
    title?: boolean | number
    /** The visibility of the prompt on the request. This is used to determine whether the prompt should be shown to the user in the UI. */
    visibility?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface RequirementPromptActionsGenqlSelection{
    update?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface RequirementPromptFilter {
/** When true only returns answered prompts. */
answered?: (Scalars['Boolean'] | null),appRequestIds?: (Scalars['ID'][] | null),applicationIds?: (Scalars['ID'][] | null),ids?: (Scalars['ID'][] | null),promptKeys?: (Scalars['String'][] | null),
/** When true only returns reachable prompts. */
reachable?: (Scalars['Boolean'] | null),requirementIds?: (Scalars['ID'][] | null)}

export interface RoleActionsGenqlSelection{
    delete?: boolean | number
    update?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ValidatedAnnouncementResponseGenqlSelection{
    /** The created or updated announcement. Null when validateOnly was true or when validation errors prevented the operation. */
    announcement?: AnnouncementGenqlSelection
    messages?: MutationMessageGenqlSelection
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ValidatedAppRequestResponseGenqlSelection{
    appRequest?: AppRequestGenqlSelection
    messages?: MutationMessageGenqlSelection
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ValidatedConfigurationResponseGenqlSelection{
    configuration?: ConfigurationGenqlSelection
    messages?: MutationMessageGenqlSelection
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ValidatedNoteResponseGenqlSelection{
    messages?: MutationMessageGenqlSelection
    /** The created or updated note. Null when validateOnly was true or when validation errors prevented the operation. */
    note?: NoteGenqlSelection
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ValidatedPeriodResponseGenqlSelection{
    messages?: MutationMessageGenqlSelection
    period?: PeriodGenqlSelection
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ValidatedResponseGenqlSelection{
    messages?: MutationMessageGenqlSelection
    /** True if the mutation succeeded (e.g. saved data or passed validation), even if there were warnings. */
    success?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}


    const Access_possibleTypes: string[] = ['Access']
    export const isAccess = (obj?: { __typename?: any } | null): obj is Access => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccess"')
      return Access_possibleTypes.includes(obj.__typename)
    }
    


    const AccessControl_possibleTypes: string[] = ['AccessControl']
    export const isAccessControl = (obj?: { __typename?: any } | null): obj is AccessControl => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessControl"')
      return AccessControl_possibleTypes.includes(obj.__typename)
    }
    


    const AccessControlGroup_possibleTypes: string[] = ['AccessControlGroup']
    export const isAccessControlGroup = (obj?: { __typename?: any } | null): obj is AccessControlGroup => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessControlGroup"')
      return AccessControlGroup_possibleTypes.includes(obj.__typename)
    }
    


    const AccessGrantTag_possibleTypes: string[] = ['AccessGrantTag']
    export const isAccessGrantTag = (obj?: { __typename?: any } | null): obj is AccessGrantTag => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessGrantTag"')
      return AccessGrantTag_possibleTypes.includes(obj.__typename)
    }
    


    const AccessRole_possibleTypes: string[] = ['AccessRole']
    export const isAccessRole = (obj?: { __typename?: any } | null): obj is AccessRole => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessRole"')
      return AccessRole_possibleTypes.includes(obj.__typename)
    }
    


    const AccessRoleGrant_possibleTypes: string[] = ['AccessRoleGrant']
    export const isAccessRoleGrant = (obj?: { __typename?: any } | null): obj is AccessRoleGrant => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessRoleGrant"')
      return AccessRoleGrant_possibleTypes.includes(obj.__typename)
    }
    


    const AccessRoleGrantActions_possibleTypes: string[] = ['AccessRoleGrantActions']
    export const isAccessRoleGrantActions = (obj?: { __typename?: any } | null): obj is AccessRoleGrantActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessRoleGrantActions"')
      return AccessRoleGrantActions_possibleTypes.includes(obj.__typename)
    }
    


    const AccessRoleGroup_possibleTypes: string[] = ['AccessRoleGroup']
    export const isAccessRoleGroup = (obj?: { __typename?: any } | null): obj is AccessRoleGroup => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessRoleGroup"')
      return AccessRoleGroup_possibleTypes.includes(obj.__typename)
    }
    


    const AccessRoleGroupManager_possibleTypes: string[] = ['AccessRoleGroupManager']
    export const isAccessRoleGroupManager = (obj?: { __typename?: any } | null): obj is AccessRoleGroupManager => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessRoleGroupManager"')
      return AccessRoleGroupManager_possibleTypes.includes(obj.__typename)
    }
    


    const AccessRoleValidatedResponse_possibleTypes: string[] = ['AccessRoleValidatedResponse']
    export const isAccessRoleValidatedResponse = (obj?: { __typename?: any } | null): obj is AccessRoleValidatedResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessRoleValidatedResponse"')
      return AccessRoleValidatedResponse_possibleTypes.includes(obj.__typename)
    }
    


    const AccessTag_possibleTypes: string[] = ['AccessTag']
    export const isAccessTag = (obj?: { __typename?: any } | null): obj is AccessTag => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessTag"')
      return AccessTag_possibleTypes.includes(obj.__typename)
    }
    


    const AccessTagCategory_possibleTypes: string[] = ['AccessTagCategory']
    export const isAccessTagCategory = (obj?: { __typename?: any } | null): obj is AccessTagCategory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessTagCategory"')
      return AccessTagCategory_possibleTypes.includes(obj.__typename)
    }
    


    const AccessUser_possibleTypes: string[] = ['AccessUser']
    export const isAccessUser = (obj?: { __typename?: any } | null): obj is AccessUser => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessUser"')
      return AccessUser_possibleTypes.includes(obj.__typename)
    }
    


    const AccessUserIdentifier_possibleTypes: string[] = ['AccessUserIdentifier']
    export const isAccessUserIdentifier = (obj?: { __typename?: any } | null): obj is AccessUserIdentifier => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAccessUserIdentifier"')
      return AccessUserIdentifier_possibleTypes.includes(obj.__typename)
    }
    


    const Announcement_possibleTypes: string[] = ['Announcement']
    export const isAnnouncement = (obj?: { __typename?: any } | null): obj is Announcement => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAnnouncement"')
      return Announcement_possibleTypes.includes(obj.__typename)
    }
    


    const AppRequest_possibleTypes: string[] = ['AppRequest']
    export const isAppRequest = (obj?: { __typename?: any } | null): obj is AppRequest => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAppRequest"')
      return AppRequest_possibleTypes.includes(obj.__typename)
    }
    


    const AppRequestActions_possibleTypes: string[] = ['AppRequestActions']
    export const isAppRequestActions = (obj?: { __typename?: any } | null): obj is AppRequestActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAppRequestActions"')
      return AppRequestActions_possibleTypes.includes(obj.__typename)
    }
    


    const AppRequestActivity_possibleTypes: string[] = ['AppRequestActivity']
    export const isAppRequestActivity = (obj?: { __typename?: any } | null): obj is AppRequestActivity => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAppRequestActivity"')
      return AppRequestActivity_possibleTypes.includes(obj.__typename)
    }
    


    const AppRequestApplicantCounts_possibleTypes: string[] = ['AppRequestApplicantCounts']
    export const isAppRequestApplicantCounts = (obj?: { __typename?: any } | null): obj is AppRequestApplicantCounts => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAppRequestApplicantCounts"')
      return AppRequestApplicantCounts_possibleTypes.includes(obj.__typename)
    }
    


    const AppRequestIndexCategory_possibleTypes: string[] = ['AppRequestIndexCategory']
    export const isAppRequestIndexCategory = (obj?: { __typename?: any } | null): obj is AppRequestIndexCategory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isAppRequestIndexCategory"')
      return AppRequestIndexCategory_possibleTypes.includes(obj.__typename)
    }
    


    const Application_possibleTypes: string[] = ['Application']
    export const isApplication = (obj?: { __typename?: any } | null): obj is Application => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isApplication"')
      return Application_possibleTypes.includes(obj.__typename)
    }
    


    const ApplicationActions_possibleTypes: string[] = ['ApplicationActions']
    export const isApplicationActions = (obj?: { __typename?: any } | null): obj is ApplicationActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isApplicationActions"')
      return ApplicationActions_possibleTypes.includes(obj.__typename)
    }
    


    const ApplicationMetric_possibleTypes: string[] = ['ApplicationMetric']
    export const isApplicationMetric = (obj?: { __typename?: any } | null): obj is ApplicationMetric => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isApplicationMetric"')
      return ApplicationMetric_possibleTypes.includes(obj.__typename)
    }
    


    const ApplicationMetricEntry_possibleTypes: string[] = ['ApplicationMetricEntry']
    export const isApplicationMetricEntry = (obj?: { __typename?: any } | null): obj is ApplicationMetricEntry => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isApplicationMetricEntry"')
      return ApplicationMetricEntry_possibleTypes.includes(obj.__typename)
    }
    


    const ApplicationMetricTiming_possibleTypes: string[] = ['ApplicationMetricTiming']
    export const isApplicationMetricTiming = (obj?: { __typename?: any } | null): obj is ApplicationMetricTiming => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isApplicationMetricTiming"')
      return ApplicationMetricTiming_possibleTypes.includes(obj.__typename)
    }
    


    const ApplicationRequirement_possibleTypes: string[] = ['ApplicationRequirement']
    export const isApplicationRequirement = (obj?: { __typename?: any } | null): obj is ApplicationRequirement => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isApplicationRequirement"')
      return ApplicationRequirement_possibleTypes.includes(obj.__typename)
    }
    


    const Category_possibleTypes: string[] = ['Category']
    export const isCategory = (obj?: { __typename?: any } | null): obj is Category => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isCategory"')
      return Category_possibleTypes.includes(obj.__typename)
    }
    


    const CategoryTag_possibleTypes: string[] = ['CategoryTag']
    export const isCategoryTag = (obj?: { __typename?: any } | null): obj is CategoryTag => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isCategoryTag"')
      return CategoryTag_possibleTypes.includes(obj.__typename)
    }
    


    const Configuration_possibleTypes: string[] = ['Configuration']
    export const isConfiguration = (obj?: { __typename?: any } | null): obj is Configuration => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isConfiguration"')
      return Configuration_possibleTypes.includes(obj.__typename)
    }
    


    const ConfigurationAccess_possibleTypes: string[] = ['ConfigurationAccess']
    export const isConfigurationAccess = (obj?: { __typename?: any } | null): obj is ConfigurationAccess => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isConfigurationAccess"')
      return ConfigurationAccess_possibleTypes.includes(obj.__typename)
    }
    


    const IndexCategory_possibleTypes: string[] = ['IndexCategory']
    export const isIndexCategory = (obj?: { __typename?: any } | null): obj is IndexCategory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isIndexCategory"')
      return IndexCategory_possibleTypes.includes(obj.__typename)
    }
    


    const IndexValue_possibleTypes: string[] = ['IndexValue']
    export const isIndexValue = (obj?: { __typename?: any } | null): obj is IndexValue => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isIndexValue"')
      return IndexValue_possibleTypes.includes(obj.__typename)
    }
    


    const Mutation_possibleTypes: string[] = ['Mutation']
    export const isMutation = (obj?: { __typename?: any } | null): obj is Mutation => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isMutation"')
      return Mutation_possibleTypes.includes(obj.__typename)
    }
    


    const MutationMessage_possibleTypes: string[] = ['MutationMessage']
    export const isMutationMessage = (obj?: { __typename?: any } | null): obj is MutationMessage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isMutationMessage"')
      return MutationMessage_possibleTypes.includes(obj.__typename)
    }
    


    const Note_possibleTypes: string[] = ['Note']
    export const isNote = (obj?: { __typename?: any } | null): obj is Note => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isNote"')
      return Note_possibleTypes.includes(obj.__typename)
    }
    


    const NoteActions_possibleTypes: string[] = ['NoteActions']
    export const isNoteActions = (obj?: { __typename?: any } | null): obj is NoteActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isNoteActions"')
      return NoteActions_possibleTypes.includes(obj.__typename)
    }
    


    const PaginationInfoWithTotalItems_possibleTypes: string[] = ['PaginationInfoWithTotalItems']
    export const isPaginationInfoWithTotalItems = (obj?: { __typename?: any } | null): obj is PaginationInfoWithTotalItems => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPaginationInfoWithTotalItems"')
      return PaginationInfoWithTotalItems_possibleTypes.includes(obj.__typename)
    }
    


    const PaginationResponse_possibleTypes: string[] = ['PaginationResponse']
    export const isPaginationResponse = (obj?: { __typename?: any } | null): obj is PaginationResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPaginationResponse"')
      return PaginationResponse_possibleTypes.includes(obj.__typename)
    }
    


    const Period_possibleTypes: string[] = ['Period']
    export const isPeriod = (obj?: { __typename?: any } | null): obj is Period => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPeriod"')
      return Period_possibleTypes.includes(obj.__typename)
    }
    


    const PeriodActions_possibleTypes: string[] = ['PeriodActions']
    export const isPeriodActions = (obj?: { __typename?: any } | null): obj is PeriodActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPeriodActions"')
      return PeriodActions_possibleTypes.includes(obj.__typename)
    }
    


    const PeriodProgram_possibleTypes: string[] = ['PeriodProgram']
    export const isPeriodProgram = (obj?: { __typename?: any } | null): obj is PeriodProgram => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPeriodProgram"')
      return PeriodProgram_possibleTypes.includes(obj.__typename)
    }
    


    const PeriodProgramActions_possibleTypes: string[] = ['PeriodProgramActions']
    export const isPeriodProgramActions = (obj?: { __typename?: any } | null): obj is PeriodProgramActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPeriodProgramActions"')
      return PeriodProgramActions_possibleTypes.includes(obj.__typename)
    }
    


    const PeriodProgramRequirement_possibleTypes: string[] = ['PeriodProgramRequirement']
    export const isPeriodProgramRequirement = (obj?: { __typename?: any } | null): obj is PeriodProgramRequirement => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPeriodProgramRequirement"')
      return PeriodProgramRequirement_possibleTypes.includes(obj.__typename)
    }
    


    const PeriodPrompt_possibleTypes: string[] = ['PeriodPrompt']
    export const isPeriodPrompt = (obj?: { __typename?: any } | null): obj is PeriodPrompt => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPeriodPrompt"')
      return PeriodPrompt_possibleTypes.includes(obj.__typename)
    }
    


    const PeriodWorkflowStage_possibleTypes: string[] = ['PeriodWorkflowStage']
    export const isPeriodWorkflowStage = (obj?: { __typename?: any } | null): obj is PeriodWorkflowStage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPeriodWorkflowStage"')
      return PeriodWorkflowStage_possibleTypes.includes(obj.__typename)
    }
    


    const Program_possibleTypes: string[] = ['Program']
    export const isProgram = (obj?: { __typename?: any } | null): obj is Program => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isProgram"')
      return Program_possibleTypes.includes(obj.__typename)
    }
    


    const Query_possibleTypes: string[] = ['Query']
    export const isQuery = (obj?: { __typename?: any } | null): obj is Query => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isQuery"')
      return Query_possibleTypes.includes(obj.__typename)
    }
    


    const RequirementPrompt_possibleTypes: string[] = ['RequirementPrompt']
    export const isRequirementPrompt = (obj?: { __typename?: any } | null): obj is RequirementPrompt => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isRequirementPrompt"')
      return RequirementPrompt_possibleTypes.includes(obj.__typename)
    }
    


    const RequirementPromptActions_possibleTypes: string[] = ['RequirementPromptActions']
    export const isRequirementPromptActions = (obj?: { __typename?: any } | null): obj is RequirementPromptActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isRequirementPromptActions"')
      return RequirementPromptActions_possibleTypes.includes(obj.__typename)
    }
    


    const RoleActions_possibleTypes: string[] = ['RoleActions']
    export const isRoleActions = (obj?: { __typename?: any } | null): obj is RoleActions => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isRoleActions"')
      return RoleActions_possibleTypes.includes(obj.__typename)
    }
    


    const ValidatedAnnouncementResponse_possibleTypes: string[] = ['ValidatedAnnouncementResponse']
    export const isValidatedAnnouncementResponse = (obj?: { __typename?: any } | null): obj is ValidatedAnnouncementResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isValidatedAnnouncementResponse"')
      return ValidatedAnnouncementResponse_possibleTypes.includes(obj.__typename)
    }
    


    const ValidatedAppRequestResponse_possibleTypes: string[] = ['ValidatedAppRequestResponse']
    export const isValidatedAppRequestResponse = (obj?: { __typename?: any } | null): obj is ValidatedAppRequestResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isValidatedAppRequestResponse"')
      return ValidatedAppRequestResponse_possibleTypes.includes(obj.__typename)
    }
    


    const ValidatedConfigurationResponse_possibleTypes: string[] = ['ValidatedConfigurationResponse']
    export const isValidatedConfigurationResponse = (obj?: { __typename?: any } | null): obj is ValidatedConfigurationResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isValidatedConfigurationResponse"')
      return ValidatedConfigurationResponse_possibleTypes.includes(obj.__typename)
    }
    


    const ValidatedNoteResponse_possibleTypes: string[] = ['ValidatedNoteResponse']
    export const isValidatedNoteResponse = (obj?: { __typename?: any } | null): obj is ValidatedNoteResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isValidatedNoteResponse"')
      return ValidatedNoteResponse_possibleTypes.includes(obj.__typename)
    }
    


    const ValidatedPeriodResponse_possibleTypes: string[] = ['ValidatedPeriodResponse']
    export const isValidatedPeriodResponse = (obj?: { __typename?: any } | null): obj is ValidatedPeriodResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isValidatedPeriodResponse"')
      return ValidatedPeriodResponse_possibleTypes.includes(obj.__typename)
    }
    


    const ValidatedResponse_possibleTypes: string[] = ['ValidatedResponse']
    export const isValidatedResponse = (obj?: { __typename?: any } | null): obj is ValidatedResponse => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isValidatedResponse"')
      return ValidatedResponse_possibleTypes.includes(obj.__typename)
    }
    

export const enumAppRequestIndexDestination = {
   APPLICANT_DASHBOARD: 'APPLICANT_DASHBOARD' as const,
   APP_REQUEST_LIST: 'APP_REQUEST_LIST' as const,
   LIST_FILTERS: 'LIST_FILTERS' as const,
   REVIEWER_DASHBOARD: 'REVIEWER_DASHBOARD' as const
}

export const enumAppRequestPhase = {
   ACCEPTANCE: 'ACCEPTANCE' as const,
   COMPLETE: 'COMPLETE' as const,
   STARTED: 'STARTED' as const,
   SUBMITTED: 'SUBMITTED' as const,
   WORKFLOW_NONBLOCKING: 'WORKFLOW_NONBLOCKING' as const
}

export const enumAppRequestStatus = {
   ACCEPTANCE: 'ACCEPTANCE' as const,
   ACCEPTED: 'ACCEPTED' as const,
   APPROVAL: 'APPROVAL' as const,
   APPROVED: 'APPROVED' as const,
   CANCELLED: 'CANCELLED' as const,
   DISQUALIFIED: 'DISQUALIFIED' as const,
   NOT_ACCEPTED: 'NOT_ACCEPTED' as const,
   NOT_APPROVED: 'NOT_APPROVED' as const,
   PREAPPROVAL: 'PREAPPROVAL' as const,
   READY_TO_ACCEPT: 'READY_TO_ACCEPT' as const,
   READY_TO_SUBMIT: 'READY_TO_SUBMIT' as const,
   REVIEW_COMPLETE: 'REVIEW_COMPLETE' as const,
   REVIEW_IN_PROGRESS: 'REVIEW_IN_PROGRESS' as const,
   STARTED: 'STARTED' as const,
   WITHDRAWN: 'WITHDRAWN' as const
}

export const enumApplicationPhase = {
   ACCEPTANCE: 'ACCEPTANCE' as const,
   APPROVAL: 'APPROVAL' as const,
   COMPLETE: 'COMPLETE' as const,
   PREAPPROVAL: 'PREAPPROVAL' as const,
   PREQUAL: 'PREQUAL' as const,
   QUALIFICATION: 'QUALIFICATION' as const,
   READY_FOR_WORKFLOW: 'READY_FOR_WORKFLOW' as const,
   READY_TO_ACCEPT: 'READY_TO_ACCEPT' as const,
   READY_TO_COMPLETE: 'READY_TO_COMPLETE' as const,
   READY_TO_SUBMIT: 'READY_TO_SUBMIT' as const,
   REVIEW_COMPLETE: 'REVIEW_COMPLETE' as const,
   REVIEW_IN_PROGRESS: 'REVIEW_IN_PROGRESS' as const,
   WORKFLOW_BLOCKING: 'WORKFLOW_BLOCKING' as const,
   WORKFLOW_NONBLOCKING: 'WORKFLOW_NONBLOCKING' as const
}

export const enumApplicationRescindedStatus = {
   RESCINDED: 'RESCINDED' as const,
   RESTORED: 'RESTORED' as const
}

export const enumApplicationStatus = {
   ACCEPTED: 'ACCEPTED' as const,
   ELIGIBLE: 'ELIGIBLE' as const,
   INELIGIBLE: 'INELIGIBLE' as const,
   PENDING: 'PENDING' as const,
   REJECTED: 'REJECTED' as const,
   RESCINDED: 'RESCINDED' as const
}

export const enumIneligiblePhases = {
   ACCEPTANCE: 'ACCEPTANCE' as const,
   APPROVAL: 'APPROVAL' as const,
   PREAPPROVAL: 'PREAPPROVAL' as const,
   PREQUAL: 'PREQUAL' as const,
   QUALIFICATION: 'QUALIFICATION' as const,
   WORKFLOW: 'WORKFLOW' as const
}

export const enumMutationMessageType = {
   error: 'error' as const,
   success: 'success' as const,
   warning: 'warning' as const
}

export const enumPromptVisibility = {
   APPLICATION_DUPE: 'APPLICATION_DUPE' as const,
   AVAILABLE: 'AVAILABLE' as const,
   REQUEST_DUPE: 'REQUEST_DUPE' as const,
   UNREACHABLE: 'UNREACHABLE' as const
}

export const enumRequirementStatus = {
   DISQUALIFYING: 'DISQUALIFYING' as const,
   MET: 'MET' as const,
   NOT_APPLICABLE: 'NOT_APPLICABLE' as const,
   PENDING: 'PENDING' as const,
   WARNING: 'WARNING' as const
}

export const enumRequirementType = {
   ACCEPTANCE: 'ACCEPTANCE' as const,
   APPROVAL: 'APPROVAL' as const,
   POSTQUAL: 'POSTQUAL' as const,
   PREAPPROVAL: 'PREAPPROVAL' as const,
   PREQUAL: 'PREQUAL' as const,
   QUALIFICATION: 'QUALIFICATION' as const,
   WORKFLOW: 'WORKFLOW' as const
}
