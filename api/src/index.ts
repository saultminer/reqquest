import multipartPlugin from '@fastify/multipart'
import { type Context, FastifyTxStateContext, GQLServer, type GQLStartOpts } from '@txstate-mws/graphql-server'
import type { GraphQLScalarType } from 'graphql'
import { DateTime } from 'luxon'
import { NonEmptyArray } from 'type-graphql'
import {
  applicationMigrations, AccessResolver, ApplicationActions, ApplicationActionsResolver,
  AppRequestAccessResolver, PeriodProgramResolver, installAppRequestRoutes,
  AccessUserResolver, AccessRoleResolver, RoleActionsResolver, RequirementPromptActionsResolver, accessMigrations,
  DatabaseMigration, initializeDb, DateTimeScalar, rqContextMixin, ProgramDefinition,
  RequirementDefinition, PromptDefinition, AppDefinition, programRegistry,
  promptRegistry, requirementRegistry, appConfig, promptMigrations,
  requirementMigrations, appRequestMigrations, RQContextClass, ensureConfigurationRecords,
  periodMigrations, AccessControlGroupResolver, AppRequestResolver, ApplicationResolver, ApplicationRequirementResolver,
  RequirementPromptResolver, PeriodResolver, PeriodActionsResolver, ConfigurationResolver,
  ConfigurationActionsResolver, SnakeCaseString, SnakeCaseStringScalar, PeriodProgramActionsResolver,
  PeriodRequirementResolver, PeriodPromptResolver, initAccess, AppRequestIndexCategoryResolver,
  AccessRoleGroupResolver, AccessRoleGrantResolver, AccessGrantTagResolver, IndexCategoryResolver,
  AccessRoleGrantActionsResolver, AccessTagCategoryResolver, logMutation, installDownloadRoutes,
  AppRequestActivityResolver, PaginationResolver, noteMigrations, NoteResolver, NoteActionsResolver, ApplicationMetricResolver,
  ensurePromptSigningKey, mailMigrations, announcementMigrations, AnnouncementResolver,
  buildApplicantGuide, installHelpRoutes
} from './internal.js'
import { scheduler, schedulerMigration } from './util/scheduler.js'
import { periodClosingReminder } from './util/periodClosingReminder.js'
import { runAsSystem } from './util/auth.js'
import { FastifyTxStateOptions } from 'fastify-txstate'
import { fromQuery } from 'txstate-utils'
import { mail } from './util/mail.js'

export interface RQStartOpts extends Omit<GQLStartOpts, 'resolvers'> {
  resolvers?: NonEmptyArray<Function>
  overrideResolvers?: Map<Function, Function>
  migrations?: DatabaseMigration[]
  appConfig: AppDefinition
  /**
   * Include programs here that are part of the current application process. Any programs that
   * have been discontinued should be included in `pastPrograms`.
   *
   * Must be an **ordered object literal** or an array, never a module namespace - the declared order
   * is persisted as `applications.evaluationOrder`. See `DefinitionSet`.
   */
  programs: DefinitionSet<ProgramDefinition>
  /**
   * When you first create the project, the programs go in `programs`. When a program is discontinued,
   * you may either leave it in `programs` and disable it in the current period, or do a software release
   * to move it here. Either way, it will be available for historical purposes, but if you move it here,
   * it will not be available to be re-enabled in new periods and will not show up in the configuration
   * screens.
   */
  pastPrograms?: DefinitionSet<ProgramDefinition>
  requirements: DefinitionSet<RequirementDefinition>
  prompts: DefinitionSet<PromptDefinition>
}

/**
 * Definitions may be handed over as an object keyed by the name each should be registered under -
 * typically a module, `import * as prompts from './prompts/index.js'` then `prompts: prompts` - or
 * as a plain array, in which case every definition must carry its own `key`.
 *
 * Prefer the keyed form: the name becomes the key, so the identifier is written once instead of
 * twice.
 *
 * There are two ways to produce that object, and for programs the difference matters. A module
 * namespace iterates its keys **alphabetically**, not in declaration order. That is harmless for
 * prompts and requirements, whose order comes from `promptKeys` and `requirementKeys`, but programs
 * register in the order given and that order is persisted as `applications.evaluationOrder` - so
 * programs must come from an ordered object literal, and `RQServer.start` rejects a namespace.
 */
export type DefinitionSet<T> = Record<string, T> | T[]

/**
 * Yields each definition with the name it was registered under, or undefined for the array form.
 */
function definitionEntries<T> (definitions: DefinitionSet<T>): [T, string | undefined][] {
  return Array.isArray(definitions)
    ? definitions.map(definition => [definition, undefined])
    : Object.entries(definitions).map(([registeredName, definition]) => [definition, registeredName])
}

/**
 * Guards the definition sets whose order is meaningful.
 *
 * Program order is persisted as `applications.evaluationOrder`, where it decides the order programs
 * are shown, the reviewer's default tab, which prompt the applicant is sent to next, and which
 * program owns a prompt shared between programs. A module namespace iterates alphabetically, so
 * accepting one would quietly reorder all of that - and would keep doing so to existing app
 * requests, which pick the new order up on their next evaluation.
 */
function assertOrdered<T> (definitions: DefinitionSet<T> | undefined, field: string) {
  if ((definitions as any)?.[Symbol.toStringTag] !== 'Module') return
  throw new Error(`\`${field}\` was passed as a module namespace (\`import * as ...\`), whose keys are alphabetical rather than declaration order. Program order is meaningful - it becomes applications.evaluationOrder, deciding the order programs are shown, the reviewer's default tab, and which program owns a shared prompt. Export an ordered object literal instead: \`export const programs = { first_program, second_program }\`.`)
}

export class RQServer extends GQLServer {
  constructor (config?: FastifyTxStateOptions) {
    super({
      ...config,
      querystringParser (str: string) { return fromQuery(str) as Record<string, any> }
    })
  }

  /**
   * typescript is complaining that I made resolvers optional, this is a liskov violation but it
   * really doesn't matter with the way we'll be using it.
   */
  // @ts-expect-error
  async start (options: RQStartOpts) {
    await this.app.register(multipartPlugin, { limits: { fileSize: 1024 * 1024 * 100, files: 5 } })

    const resolvers = [
      AccessGrantTagResolver,
      AnnouncementResolver,
      AccessResolver,
      AccessRoleResolver,
      AccessRoleGroupResolver,
      AccessRoleGrantActionsResolver,
      AccessRoleGrantResolver,
      AccessControlGroupResolver,
      AccessTagCategoryResolver,
      AccessUserResolver,
      ApplicationActions,
      ApplicationActionsResolver,
      ApplicationActionsResolver,
      ApplicationResolver,
      ApplicationRequirementResolver,
      ApplicationMetricResolver,
      AppRequestAccessResolver,
      AppRequestActivityResolver,
      IndexCategoryResolver,
      AppRequestIndexCategoryResolver,
      AppRequestResolver,
      ConfigurationResolver,
      ConfigurationActionsResolver,
      PaginationResolver,
      PeriodResolver,
      PeriodActionsResolver,
      PeriodProgramActionsResolver,
      PeriodProgramResolver,
      PeriodRequirementResolver,
      PeriodPromptResolver,
      RequirementPromptResolver,
      RequirementPromptActionsResolver,
      RoleActionsResolver,
      NoteResolver,
      NoteActionsResolver,
      ...(options?.resolvers ?? [])
    ].map(resolver => options?.overrideResolvers?.get(resolver) ?? resolver) as NonEmptyArray<Function>

    const scalarsMap: { type: any, scalar: GraphQLScalarType }[] = [
      { type: SnakeCaseString, scalar: SnakeCaseStringScalar },
      { type: DateTime, scalar: DateTimeScalar }
    ]
    scalarsMap.push(...(options.scalarsMap ?? []))

    options.customContext = rqContextMixin(options.customContext ?? FastifyTxStateContext as typeof Context)
    options.scalarsMap = scalarsMap
    options.send401 ??= true

    const originalAfter = options.after
    options.after = async (...args) => {
      await Promise.all([
        originalAfter?.(...args),
        logMutation(...args)
      ])
    }

    Object.assign(appConfig, options.appConfig)
    appConfig.customContext = options.customContext as RQContextClass
    for (const [prompt, registeredName] of definitionEntries(options.prompts)) promptRegistry.register(prompt, registeredName)
    for (const [requirement, registeredName] of definitionEntries(options.requirements)) requirementRegistry.register(requirement, registeredName)
    assertOrdered(options.programs, 'programs')
    assertOrdered(options.pastPrograms, 'pastPrograms')
    for (const [program, registeredName] of definitionEntries(options.programs)) programRegistry.register(program, true, registeredName)
    for (const [program, registeredName] of definitionEntries(options.pastPrograms ?? [])) programRegistry.register(program, false, registeredName)
    programRegistry.finalize()
    await initializeDb([...periodMigrations, ...promptMigrations, ...requirementMigrations, ...accessMigrations, ...appRequestMigrations, ...applicationMigrations, ...noteMigrations, ...schedulerMigration, ...mailMigrations, ...announcementMigrations, ...(options?.migrations ?? [])])
    await initAccess()
    await super.swagger()
    await installDownloadRoutes(this.app)
    await installAppRequestRoutes(this.app)
    if (appConfig.applicantGuide) {
      // a diagnostic aid must never be the reason the API fails to start
      try {
        buildApplicantGuide()
        installHelpRoutes(this.app)
      } catch (e) {
        console.error('Applicant guide could not be generated; /help/applicant-guide.md is unavailable.', e)
      }
    }
    await ensureConfigurationRecords()
    ensurePromptSigningKey()
    await super.start({ ...options, resolvers })
    await scheduler.schedule('mail_outbox', mail.syncRows, { minutesBetween: 1 })
    // built-in period-closing reminder, enabled by emailConfig.periodClosing.daysBefore
    if (options.appConfig.emailConfig.periodClosing?.daysBefore) {
      await scheduler.schedule('period_closing_reminder', () => runAsSystem(periodClosingReminder), { minutesBetween: 60 })
    }
    // downstream time-based jobs, see AppDefinition.hooks.scheduled
    for (const [name, { run, ...opts }] of Object.entries(options.appConfig.hooks?.scheduled ?? {})) {
      await scheduler.schedule(`hook_${name}`, () => runAsSystem(run), opts)
    }
  }
}

export * from './internal.js'
