import { type ValidateFunction } from 'ajv'
import { applicantRequirementTypes, AppRequestData, ConfigurationDefinition, programRegistry, promptRegistry, RequirementStatus, RequirementType, registryAjv, Prompt } from '../internal.js'
import { isNotEmpty } from 'txstate-utils'
import type { PromptKey } from './keys.js'

export interface NoDisplayPromptKey {
  /**
   * The key of a prompt this requirement depends on but that should not be displayed
   * beneath it.
   */
  key: PromptKey

  /**
   * Whether an unanswered prompt should hold this requirement back. Defaults to true.
   *
   * When true (the default), the requirement will not be evaluated against any of its own
   * prompts until this prompt has been answered - its prompts stay hidden and the requirement
   * stays PENDING. This is what you want when the dependency represents "not yet": data that
   * is on its way from another program, another phase, or an external system, and making a
   * determination without it would be premature.
   *
   * When false, an unanswered prompt does not gate anything. Your `resolve` will be called
   * with `undefined` for this prompt's data, and it will be called again if the data arrives
   * later. This is what you want when the dependency represents "maybe never": a reviewer's
   * override that may or may not be granted, and the applicant should be moved along in the
   * meantime.
   *
   * Requirements that opt out of gating are deliberately opting out of the rule that a
   * requirement's status is stable once it goes non-PENDING, since the whole point is that a
   * later answer may change the outcome. Make sure `resolve` tolerates the data being absent,
   * and be careful that a late answer only ever moves the applicant forward - flipping a
   * requirement to DISQUALIFYING after the applicant has moved past it is a bad experience.
   */
  gate?: boolean
}

/**
 * What a requirement may learn about the program it is being evaluated for. Requested through the
 * `program` selector passed to `resolve`, never handed over whole, so that the system knows exactly
 * which of these a requirement depends on.
 */
export interface ProgramContext {
  /** The program's key. */
  key: string
  /** The program's title as it reads in this request's period, label overrides applied. */
  title: string
  /** The program's navigation title in this request's period. */
  navTitle: string
  /** This requirement's position in the program's evaluation order, starting at 0. */
  requirementIndex: number
  /**
   * The statuses of the requirements evaluated ahead of this one in the same application, by
   * requirement key. Only requirements this evaluation pass consults are present; later ones never are.
   */
  priorStatuses: Record<string, RequirementStatus>
}

/**
 * Ask for program context from inside `resolve`. Name the properties you want and you receive just
 * those: `const { key, title } = program({ key: true, title: true })`.
 *
 * Calling it has a cost that is worth knowing about. A requirement shared by many programs is
 * normally evaluated once per request and the result reused for every program, because nothing it
 * can see differs between them. The moment it reads program context, the result is reused only
 * among programs where every property it read has the same value. Read `key` and it runs once per
 * program. Read only `requirementIndex` and it runs once per distinct position. Call it only on the
 * code paths that need it, and ask only for what that path needs.
 */
export type ProgramSelector = <K extends keyof ProgramContext>(select: { [P in K]: true }) => Pick<ProgramContext, K>

export type ResolveResult = { status: RequirementStatus, reason?: string, blame?: PromptKey[] }

export interface RequirementDefinition<ConfigurationDataType = any> {
  /**
   * A globally unique, human and machine readable key. This will be used to match up with
   * the UI definition. Use lowercase snake_case, alphanumeric and underscore only.
   *
   * Do not use the same key for a prompt and a requirement, as the keys will be used as
   * tag names in our authorization scheme and need to not clash.
   *
   * You may omit this when you hand your requirements to `RQServer.start` as a keyed object - for
   * instance a module of definitions - in which case the name the requirement is registered under
   * becomes its key, and you avoid writing the same identifier twice:.
   * Set `key` explicitly whenever a key needs to outlive a rename.
   */
  key?: string

  type: RequirementType

  /**
   * Display title for the requirement. Will be shown to any user that can see the requirement.
   */
  title: string

  /**
   * Some requirements could benefit from having a title that is dependent on the Configuration. For
   * example, a requirement that is dependent on a configuration value that is a dollar amount could
   * have a title that is `Dollar amount must be less than ${config.dollarMax}`.
   *
   * The smartTitle will be used in scenarios where a specific configuration is implied, such as for
   * an individual appRequest (since an individual appRequest implies a period, and a period implies a
   * configuration value).
   *
   * In scenarios where the requirement does not have a configuration, like on the admin screen for
   * managing all the requirements in the system, the regular title will be used.
   */
  smartTitle?: (config: ConfigurationDataType) => string

  /**
   * Display title for the requirement in the navigation. You probably want it to be shorter than
   * the full title. If not provided, the title will be used.
   */
  navTitle?: string

  /**
   * A brief description of the requirement. This will be shown to administrators to help explain
   * the full meaning of the requirement.
   */
  description: string

  /**
   * The keys of the prompts that this requirement depends upon in order to make its evaluation.
   * Prompts will be revealed one at a time to the user in the order provided here.
   *
   * The requirement will be evaluated after each prompt is answered, and if it returns a non-PENDING
   * status, the rest of the prompts will be hidden from the user, unless/until they are required
   * by a future requirement.
   *
   * The prompts are hidden until needed because we are trying to avoid asking the user for unnecessary
   * information, and we don't know until we run `resolve` whether the next prompt will be necessary, so
   * we cannot add it to the navigation structure until we know we need it.
   */
  promptKeys?: PromptKey[]

  /**
   * Prompts listed as `promptKeys` will be revealed to the user in the order provided. The user
   * must answer each prompt in order to proceed to the next one. After all of those prompts are
   * answered, if the requirement is still returning a PENDING status, the requirement may depend
   * on additional prompts that are not required to be answered in order.
   *
   * You may list those prompts here. They will all be added to the navigation structure at the same
   * time, and the user may answer them in any order. The requirement will not be evaluated again
   * until all of these prompts are answered.
   *
   * The user still may not proceed until all the prompts are answered and the requirement is
   * resolving as non-PENDING. This is to prevent a confusing situation. Consider the
   * following case:
   * - Requirement 1 has prompts A and B in its `promptKeysAnyOrder`.
   * - Requirement 2 requires prompt B in its `promptKeys`.
   * - Requirement 1 resolves as MET based solely on data in prompt A. (if the system were to allow it)
   * - Prompt B is underneath Requirement 1 in the navigation, and is still available to the user,
   *   but they skip it and move on to Requirement 2.
   * - Requirement 2 is resolving as PENDING because prompt B has not been answered.
   * - Prompt B is not shown to the user, because it's already in the navigation under Requirement 1 and
   *   the same prompt appearing twice in the navigation is confusing.
   * - The user cannot proceed unless they happen to go back and answer prompt B under Requirement 1.
   */
  promptKeysAnyOrder?: PromptKey[]

  /**
   * An array of prompt keys for prompts that this requirement depends on, but that should not be
   * shown to users beneath this requirement. For instance, if you have a requirement that depends on
   * data from an external system, you may create a prompt to house that data, but you don't want
   * to expose it to applicants or reviewers.
   *
   * For another example, what if you have two mutually exclusive programs, like if our adopt a dog and
   * adopt a cat programs didn't allow you to adopt one of each? You would have a requirement/prompt
   * at the end of each program that says "Okay great you qualify, do you want this dog?" and "Okay
   * great you qualify, do you want this cat?" and the requirement for the dog would depend on
   * the prompt for the cat, but you don't want to show the cat prompt to the user when they are
   * applying for the dog. You just want the dog requirement to fail when they say "yes" to the cat
   * and vice versa.
   *
   * By default, listing a prompt here means the requirement waits for it: until the prompt has
   * been answered, none of this requirement's own prompts will be shown and it will stay PENDING.
   * That is usually what you want, but it makes the dependency useless for data that may never
   * arrive, such as a reviewer override that unlocks an applicant who has been disqualified. For
   * that case, list the prompt as `{ key: 'some_prompt', gate: false }` and `resolve` will be
   * called with `undefined` for it until (and unless) it is answered. See `NoDisplayPromptKey`.
   */
  promptKeysNoDisplay?: (PromptKey | NoDisplayPromptKey)[]

  /**
   * Provide a function that can evaluate the requirement based on answers to prompts.
   *
   * This function should not be async, as the justification for a rejection should
   * be part of the permanent record. Any pertinent data retrieved from external systems
   * should be stored by a prompt in the appRequest data.
   *
   * Optionally provide the reason why the resolve function is returning whatever status
   * it is returning. This will be shown to the applicant. It's unlikely a reason is needed
   * for the MET status, but it will be shown if provided. Note that the application will
   * only ever show a single reason, the last one provided by a failing or pending requirement.
   *
   * Optionally provide `blame`, an array of prompt keys naming the answer or answers responsible
   * for the status you are returning. The reviewer UI attaches the status indicator to those
   * prompts instead of every prompt this requirement consults, so a requirement that reads three
   * answers can point at the one that actually failed. Omit it and all of this requirement's
   * prompts are indicated, which is the historical behavior and is usually right for a
   * requirement that only has one prompt. The keys need not belong to this requirement - a
   * reviewer requirement may blame the upstream applicant prompt whose answer it just judged.
   * The keys are checked at compile time against the prompts your project registers, so a typo or a
   * key you have since renamed will not compile. Nothing is filtered at runtime, though: a key
   * naming a prompt the viewer cannot currently see simply has no effect.
   *
   * These values will be cached until the appRequest is updated in some way.
   *
   * You'll receive the appRequestData, the configuration data, a lookup object that
   * contains the configuration data for all requirements and prompts in the system, in
   * case you need to rely on the configuration from one of the required prompts, and a
   * `program` selector for the rare requirement whose answer depends on which program it is
   * evaluating for (see `ProgramSelector`). Most requirements never need the fourth parameter and
   * should simply leave it off.
   *
   * NOTE: The appRequest data passed to this function will only include data from the prompts this
   * requirement lists in `promptKeys`, `promptKeysAnyOrder` and `promptKeysNoDisplay`, and only
   * once each has been answered. Data from other requirements' prompts is not passed, so a
   * requirement that must react to an earlier requirement's outcome asks the selector for
   * `priorStatuses` rather than reading that requirement's answers.
   *
   * A prompt listed in `promptKeysNoDisplay` with `gate: false` is explicitly allowed to show up
   * late and change this requirement's determination. Anything you receive that way may be
   * `undefined` on one call and populated on the next.
   *
   * Pure requirements - those that never call `program` - are evaluated once per request however
   * many programs share them. See `ProgramSelector` for what reading program context costs.
   */
  resolve: (appRequestData: AppRequestData, config: ConfigurationDataType, configLookup: Record<string, any>, program: ProgramSelector) => ResolveResult
  /**
   * Often, you will want to allow application administrators to control various aspects of
   * how requirements will be evaluated. For example, you might want administrators to
   * set an income threshold to determine eligibility. The threshold may change from period
   * to period and we don't want to hard-code that into the `resolve` function.
   *
   * This part of the definition is meant to allow you to do that. You create a form for the
   * administrator, and we will collect the data in JSON and give it to the resolve function as
   * a parameter. You'll also receive the configuration JSON in your smartTitle function in case
   * it helps.
   */
  configuration?: ConfigurationDefinition
}

export interface RequirementDefinitionProcessed extends RequirementDefinition {
  key: string
  allPromptKeys: string[]
  visiblePromptKeys: string[]
  visiblePrompts: Prompt[]
  promptKeySet: Set<string>
  anyOrderPromptKeySet: Set<string>
  noDisplayPromptKeySet: Set<string>
  // the subset of noDisplayPromptKeySet that must not hold the requirement back while unanswered
  ungatedPromptKeySet: Set<string>
}

class RequirementRegistry {
  protected requirements: Record<string, RequirementDefinitionProcessed> = {}
  protected requirementsList: RequirementDefinitionProcessed[] = []
  protected configValidators: Record<string, ValidateFunction> = {}
  public authorizationKeys: Record<string, string[]> = {}
  // all the requirement definitions that are still actively used in new periods
  // it's possible to have definitions registered that are no longer used, but must be
  // registered so that historical data can be interpreted/rendered
  public reachable: RequirementDefinitionProcessed[] = []

  /**
   * `registeredName` is the name the definition was handed over under.
   * It becomes the requirement's key unless the definition carries an explicit one.
   */
  register (definition: RequirementDefinition, registeredName?: string) {
    const key = definition.key ?? registeredName
    if (key == null) throw new Error('Registered a requirement with no key. Either set `key` on the definition, or pass your requirements to RQServer.start as a keyed object (e.g. `requirements: myRequirements`) so the name each is exported under can be used.')
    const noDisplayEntries = (definition.promptKeysNoDisplay ?? []).map(entry => typeof entry === 'string' ? { key: entry, gate: true } : { gate: true, ...entry })
    const noDisplayPromptKeys = noDisplayEntries.map(entry => entry.key)
    const allPromptKeys = [...(definition.promptKeys ?? []), ...(definition.promptKeysAnyOrder ?? []), ...noDisplayPromptKeys]
    const visiblePromptKeys = [...(definition.promptKeys ?? []), ...(definition.promptKeysAnyOrder ?? [])]
    const definitionProcessed: RequirementDefinitionProcessed = {
      ...definition,
      key,
      allPromptKeys,
      visiblePromptKeys,
      visiblePrompts: [],
      promptKeySet: new Set(allPromptKeys),
      anyOrderPromptKeySet: new Set(definition.promptKeysAnyOrder ?? []),
      noDisplayPromptKeySet: new Set(noDisplayPromptKeys),
      ungatedPromptKeySet: new Set(noDisplayEntries.filter(entry => !entry.gate).map(entry => entry.key))
    }
    this.requirements[key] = definitionProcessed
    this.requirementsList.push(definitionProcessed)
    if (applicantRequirementTypes.has(definition.type)) {
      // deliberately not allPromptKeys: a no-display prompt is never shown to the applicant, so it
      // must not become one of their prompts just because an applicant requirement reads it
      for (const promptKey of visiblePromptKeys) promptRegistry.setUserPrompt(promptKey)
    }
    if (isNotEmpty(definition.configuration?.schema)) this.configValidators[key] = registryAjv.compile(definition.configuration.schema)
  }

  keys () {
    return Object.keys(this.requirements)
  }

  get (key: string) {
    return this.requirements[key]
  }

  list () {
    return this.requirementsList
  }

  finalize () {
    const reachableKeys = new Set(programRegistry.reachable.flatMap(program => [...program.requirementKeys, ...program.workflowStages?.flatMap(stage => stage.requirementKeys) ?? []]))
    this.reachable = this.requirementsList.filter(requirement => reachableKeys.has(requirement.key))
    promptRegistry.finalize()
    for (const reqKey of Object.keys(this.requirements)) {
      const req = this.requirements[reqKey]
      req.visiblePrompts = req.visiblePromptKeys.map(key => new Prompt(promptRegistry.get(key)))
    }
  }

  validateConfig (key: string, data: any) {
    const validate = this.configValidators[key]
    if (!validate) return true
    const valid = validate(data)
    if (!valid) console.error(validate.errors)
    return valid
  }
}

export const requirementRegistry = new RequirementRegistry()
