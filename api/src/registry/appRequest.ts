import { FastifyRequest } from 'fastify'
import { AccessUser, AccessUserCategoryInput, AccessUserIdentifierInput, ApplicationPhase, AppRequest, AppRequestStatus, CategoryTag, RQContext, RQContextClass } from '../internal.js'
import { DateTime } from 'luxon'
import type { ProgramKey } from './keys.js'
import type { SchedulerOpts } from '../util/scheduler.js'

export interface AppRequestData {
  [keys: string]: any
  savedAtVersion: string
}

export interface ReqquestUser {
  login: string
  fullname: string
  groups: string[]
  email?: string
  otherInfo?: any
  /**
   * Provide any alternate unique identifiers aside from the user's login. Perhaps they also
   * have an employee ID or a student ID.
   *
   * e.g. { label: 'Employee ID', value: '123456' }
   */
  otherIdentifiers?: { label: string, value: string }[]
}

export interface RemoteGroup {
  groupName: string
  managers?: { fullname: string, email?: string }[]
  dateCreated?: DateTime
}

export interface SearchUsersFilter {
  users?: AccessUser[]
  identifiers?: AccessUserIdentifierInput[]
  groups?: string[]
  categories?: AccessUserCategoryInput[]
}

/**
 * The UserIndexDefinition is used to create the Admin User list columns and create
 * indexes to group users. The data will be generated and updated upon each user login\
 * and saved in the database.
 *
 * NOTE: As category keys and values are indexes the distinct values for each category
 * may be quickly be pulled directly from the database. For example an institutional
 * list of roles including Faculty, Staff and Students would only return Staff and Students
 * if there are only Staff and Students within the database during the time of the query.
 * If the list is empty then the User list should skip displaying the Label as a column.
 * The filter should also exclude the category as that would just return an empty set if
 * any role was used as a filter value.
 */
export interface OtherIdentifierDefinition {
  /**
   * A unique key used to namespace categories.
   */
  category: string
  /**
   * Used to display the category name for the UI column headers.
   * If not available then the category value will be used for the header.
   */
  label?: string
  /**
   * Set this to true should be displayed as a column in the User list view.
   * default is false.
   */
  useInList?: boolean
  /**
   * Set this to true should be available as a filter in the User list view.
   * The two or three of the first available filters will be used as quick filters,
   * the rest will be in the filter UI popout. Note that if Filter will only be available
   * should there be more then one value to filter on. default is false.
   */
  useInFilters?: boolean
  /**
   * Set this to true to indicate that this index should be displayed in the table on the
   * App Request list view.
   */
  useInAppRequestList?: boolean
  /**
   * Set this to true to indicate that this index should be available as a filter on the
   * App Request list view.
   */
  useInAppRequestFilters?: boolean
}

export interface UserIndexDefinition<DataType = any> extends OtherIdentifierDefinition {
  /**
   * Convert all existing distinct DataTypes associate with the category
   * into an array of tags with associated labels. The tags will be used
   * as indexes and labels will be used for UI display of a tag.
   * The tag/label values will be saved in the database together.
   * Example of tag changes may be Dates converted to Epoc for sorting,
   * or spacing may be removed or turned into dashes. Example label
   * formatting may include first letter case changes and adding spacing.
   */
  dataToCategoryTags: (data: DataType) => CategoryTag[]
}

export interface AppDefinition {
  /**
   * Configure whether this system allows multiple app requests for the same user in the same period.
   */
  multipleRequestsPerPeriod?: boolean
  /**
   * Publish a Markdown guide for AI agents at `GET /help/applicant-guide.md`, so an applicant can ask
   * their own agent what a prompt means or what to do next. It is rendered once at startup from your
   * program, requirement and prompt definitions. The UI redirects `/help/applicant-guide.md` to it.
   *
   * Off by default because the route requires no login and the guide publishes your applicant-side
   * rules: titles, descriptions, default configuration, and the source of each applicant-facing
   * requirement's `resolve` and prompt's `validate` with comments removed. Reviewer-side requirements
   * (PREAPPROVAL, APPROVAL, workflow) and their prompts are not described. An applicant rule that
   * reads staff-provided data is still published in full, so it shows that staff prompt's key and
   * how its answer is used.
   *
   * If you authenticate with `authenticateAll`, add `/help/applicant-guide.md` to `exceptRoutes` or
   * the route will answer 401.
   */
  applicantGuide?: boolean
  /**
   * Instead of copying user and group data into the database, reqquest leaves it to the implementing application
   * to provide this data. This is useful for applications that already have a user and group database (e.g. Active Directory).
   *
   * If you do not have an outside database, you can provide migrations to create tables and store it locally.
   */
  userLookups: {
    /**
     * Provide a function that will return a list of users and their groups, given a list of logins.
     *
     * The function should return a map of logins to user objects, where the user object contains the login,
     * fullname, and groups the user belongs to.
     *
     * The applicableGroups parameter is a list of groups that reqquest is interested in. If you prefer, you can
     * limit your query to only return those groups, but returning extra groups is also acceptable.
     *
     * Category data will included within the otherInfo field and utilized by the login to filter through
     * the retrieved UserIndexDefinition(s) and update the local database with the remote data that was
     * retrieved.
     */
    byLogins: (logins: string[], applicableGroups: string[]) => Promise<ReqquestUser[]>
    /**
     * List of categories to index. List is ordered by how they are displayed in the user listing columns.
     * All category information must be provided when calling byLogins as that method is used by auth
     * to save the remote data within the otherInfo field.
     */
    indexes?: UserIndexDefinition[]

    otherIdentifiers?: OtherIdentifierDefinition[]
  }
  /**
   * Provide a function that will return a list of group properties, given a list of group names.
   *
   * The function should return a map of group names to group information, where the group information contains
   * the group name, manager (with firstname, lastname, and email), and dateAdded.
   */
  groups?: (groupnames: string[]) => Promise<RemoteGroup[]>
  /**
   * Authentication scopes. Provide a full list of scopes that might show up
   * on a valid JWT for this application. For instance, if your application has
   * a method to log a student's parent in with the 'parent' scope, you should
   * include that scope here.
   *
   * The list will be used to populate the dropdown when administrators are creating
   * roles. Each scope must have its own set of roles.
   */
  scopes?: string[]

  hooks?: {
    /**
     * Code that should run any time the status of an app request changes. Useful for
     * sending emails or other notifications, or triggering automations.
     *
     * oldPhase should only be null on creation.
     */
    appRequestStatus?: (ctx: RQContext, appRequest: AppRequest, oldStatus?: AppRequestStatus) => void | Promise<void>
    /**
     * Code that should run any time an app request is closed. Useful for
     * sending emails or other notifications, or triggering automations.
     */
    closeAppRequest?: (ctx: RQContext, appRequest: AppRequest) => void | Promise<void>
    /**
     * Code that should run any time the application phase changes. Useful for
     * triggering automations or email notifications, especially workflow notifications.
     *
     * This hook will not fire on app request creation, use `appRequestStatus` instead.
     *
     * To name the program in a notification, load the application rather than the definition:
     * `(await ctx.svc(ApplicationService).findByAppRequest(appRequest)).find(a => a.programKey === programKey)?.title`.
     * Administrators may rename a program for a period, and `programRegistry.get(programKey).title`
     * is only the default from the code, so it can name the program differently from every screen
     * the applicant sees.
     */
    applicationPhase?: (ctx: RQContext, appRequest: AppRequest, programKey: ProgramKey, oldPhase: ApplicationPhase) => void | Promise<void>
    /**
     * Code that should run any time a prompt for an app request is updated. Useful for
     * triggering automations or email notifications. Will only be called if the old data
     * is different from the new data.
     */
    updatePrompt?: (ctx: RQContext, appRequest: AppRequest, appRequestData: AppRequestData, promptKey: string, oldData: any) => void | Promise<void>
    /**
     * Jobs that run on a timer rather than in response to a mutation. Each key becomes a row in
     * the `tasks` table (prefixed `hook_`), and the scheduler's atomic claim on that row guarantees
     * exactly one API replica runs the job per interval, so this is mutli node safe.
     *
     * The job receives a system context with no user and no roles - read through the `*.database`
     * functions and services that do not authorize, not through the authorized service wrappers.
     *
     * A recurring job must be idempotent: pass a `dedupKey` to `MailService.sendmulti` so a job
     * that runs hourly cannot email the same person twice for the same event. See
     * `periodClosingReminder` in `util/periodClosingReminder.ts` for the reference pattern.
     *
     * The scheduler currently loop sleeps 90 seconds between passes, so the real floor for `minutesBetween`
     * is about 1.5 minutes, and `duringHour` is evaluated in the container's `TZ`.
     */
    scheduled?: Record<string, ScheduledHook>
  }
  /**
   * Variables used for email templates. Everything here is spread into the Handlebars context of
   * every built-in email, so plain string keys become template variables.
   */
  emailConfig: {
    appName: string
    signature: string
    from: string
    // Enables the built-in period-closing reminder. Applicants who have started but not submitted
    periodClosing?: {
      daysBefore: number
      // Cadence of follow-up reminders after the first one.
      reminderDays?: number
    }
  } & Record<string, any>
}

export interface ScheduledHook extends SchedulerOpts {
  run: (ctx: RQContext) => void | Promise<void>
}

export const appConfig = {
  async getCtx (req: FastifyRequest) {
    const ctx = new appConfig.customContext(req)
    await ctx.waitForAuth()
    return ctx
  }
} as AppDefinition & { customContext: RQContextClass, getCtx: (req: FastifyRequest) => Promise<RQContext> }
