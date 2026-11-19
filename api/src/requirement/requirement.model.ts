import { Field, ID, InputType, ObjectType, registerEnumType } from 'type-graphql'
import { ApplicationPhase, ApplicationRequirementRow, AppRequestPhase, type BlameEntry, PeriodProgramKey, PeriodProgramRequirementRow, programRegistry, RequirementDefinitionProcessed, requirementRegistry, WorkflowStage } from '../internal.js'

@ObjectType({ description: 'A requirement for a program. Each program has an ordered array of requirements, all of which must pass for an application to the program to succeed.' })
export class Requirement {
  definition: RequirementDefinitionProcessed
  constructor (definition: RequirementDefinitionProcessed) {
    this.definition = definition
    this.key = definition.key
    this.title = definition.title
    this.navTitle = definition.navTitle ?? definition.title
    this.description = definition.description
    this.type = definition.type
    this.authorizationKeys = { requirement: requirementRegistry.authorizationKeys[definition.key] ?? [] }
  }

  @Field({ description: 'A human and machine readable unique and stable identifier that we can use to add javascript logic to the evaluation of whether a requirement is satisfied. For example: "gi_ch33_must_be_post911"' })
  key: string

  @Field({ description: 'An internal description of the requirement. Probably not shown to users.' })
  description: string

  @Field({ description: 'A human readable title for the requirement. This is what will be shown to users.' })
  title: string

  @Field({ description: 'A human readable title for the requirement in the navigation. You probably want it to be shorter than the full title. If not provided, the title will be used.' })
  navTitle: string

  @Field(type => RequirementType, { description: 'The type of requirement. This determines when the requirement is evaluated and who can see the requirement.' })
  type: RequirementType

  authorizationKeys: Record<string, string[]>
}

export enum RequirementType {
  PREQUAL = 'PREQUAL',
  QUALIFICATION = 'QUALIFICATION',
  POSTQUAL = 'POSTQUAL',
  PREAPPROVAL = 'PREAPPROVAL',
  APPROVAL = 'APPROVAL',
  WORKFLOW = 'WORKFLOW',
  ACCEPTANCE = 'ACCEPTANCE'
}
registerEnumType(RequirementType, {
  name: 'RequirementType',
  valuesConfig: {
    PREQUAL: { description: 'A requirement that should have a non-PENDING status before the user is shown their programs. Only the applications for programs whose PREQUAL requirements are MET or NOT_APPLICABLE should be visible. The others should be entirely hidden, rather than being shown in a disabled/ineligible state.' },
    QUALIFICATION: { description: 'A requirement that should have a non-pending status before an application may be submitted for review. Programs with a DISQUALIFYING requirement of type APPLICATION should be visible to the submitter but visually distinct as disabled/ineligible.' },
    POSTQUAL: { description: 'A requirement that should be shown to applicants at the end of the request process, prior to review and submission, outside the context of the individual programs. It is intended for acknowledgements like "I affirm that I have given truthful answers". It wouldn\'t make sense to have them affirm that their answers are truthful in one application but not in the others.' },
    PREAPPROVAL: { description: 'A requirement that has no prompts and must have a non-PENDING status before an application may be reviewed. Use this for materials/data that must appear in an external system before a reviewer will be able to begin their work.' },
    APPROVAL: { description: 'A requirement that should only be shown to agents/reviewers and must have a non-pending status before an application is closed.' },
    WORKFLOW: { description: 'This requirement belongs to a workflow stage. It should only be included in a workflow stage and should not appear in the standard requirementKeys array of a program.' },
    ACCEPTANCE: { description: 'A requirement that should only be shown to applicants after the application has been through review and an offer has been made. The applicant can come back and fill out the requirement\'s prompts to accept the offer.' }
  }
})
export enum RequirementStatus {
  MET = 'MET',
  DISQUALIFYING = 'DISQUALIFYING',
  WARNING = 'WARNING',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING'
}
registerEnumType(RequirementStatus, {
  name: 'RequirementStatus',
  valuesConfig: {
    MET: { description: 'The requirement has been met.' },
    DISQUALIFYING: { description: 'The requirement has not been met, and it means the application is denied/ineligible.' },
    WARNING: { description: 'The requirement has not been met, but the application may still be approved. The requirement should be marked in some way as not quite satisfactory. The statusReason may explain further what is wrong.' },
    NOT_APPLICABLE: { description: 'The requirement is not applicable. The application should not yet be denied, proceed to the next requirement.' },
    PENDING: { description: 'The requirement cannot be evaluated yet because one or more questions are unanswered.' }
  }
})

@ObjectType({ description: 'One answer a requirement holds responsible for its current status, optionally narrowed to specific form fields.' })
export class RequirementBlame {
  @Field({ description: 'The key of the prompt whose answer is at fault.' })
  promptKey!: string

  @Field(type => [String], { nullable: true, description: 'Dotted paths into the prompt\'s data naming the form fields at fault. Null when the whole prompt is implicated.' })
  fields?: string[]

  @Field({ nullable: true, description: 'A helper message for the named fields. When null, the requirement\'s statusReason applies.' })
  message?: string

  @Field(type => RequirementStatus, { nullable: true, description: 'How the message on the named fields should be presented. It does not affect the requirement, whose own status decides its outcome. When null, the requirement\'s status applies.' })
  status?: RequirementStatus
}

/**
 * Turn whatever a `resolve` returned for `blame` (or what was stored) into the two shapes the model
 * carries: the distinct prompt keys, and one detailed entry per blame.
 */
export function normalizeBlame (raw: BlameEntry[] | undefined | null): { blame?: string[], blameFields?: RequirementBlame[] } {
  if (!Array.isArray(raw) || !raw.length) return {}
  const blameFields: RequirementBlame[] = []
  for (const entry of raw) {
    if (typeof entry === 'string') blameFields.push({ promptKey: entry })
    else if (entry != null && typeof entry.prompt === 'string') {
      const fields = Array.isArray(entry.fields) ? entry.fields.filter(f => typeof f === 'string' && f.length) : []
      blameFields.push({
        promptKey: entry.prompt,
        ...(fields.length ? { fields } : {}),
        ...(typeof entry.message === 'string' && entry.message.length ? { message: entry.message } : {}),
        ...(entry.status != null && entry.status in RequirementStatus ? { status: entry.status } : {})
      })
    }
  }
  if (!blameFields.length) return {}
  return { blame: [...new Set(blameFields.map(b => b.promptKey))], blameFields }
}

/**
 * The stored form of a requirement's blame. Entries that name no fields, message or status are
 * written as bare prompt keys, so a requirement that only ever blamed whole prompts stores exactly
 * what it always has.
 */
export function serializeBlame (blameFields: RequirementBlame[] | undefined): string | undefined {
  if (!blameFields?.length) return undefined
  return JSON.stringify(blameFields.map(b => b.fields?.length || b.message || b.status
    ? { prompt: b.promptKey, ...(b.fields?.length ? { fields: b.fields } : {}), ...(b.message ? { message: b.message } : {}), ...(b.status ? { status: b.status } : {}) }
    : b.promptKey))
}

@ObjectType({ description: 'The specific instance of a requirement on a particular application. Stores the status of the requirement, e.g. being satisfied or not.' })
export class ApplicationRequirement extends Requirement {
  internalId: number
  evaluationOrder: number
  appRequestInternalId: number
  appRequestId: string
  applicationInternalId: number
  applicationId: string
  applicationPhase: ApplicationPhase
  appRequestPhase: AppRequestPhase
  userInternalId: number
  periodId: string
  programKey: string
  appRequestTags?: Record<string, string[]>
  workflowStageKey?: string
  workflowStageDefinition?: WorkflowStage

  constructor (row: ApplicationRequirementRow) {
    const definition = requirementRegistry.get(row.requirementKey)
    super(definition)
    this.internalId = row.id
    this.id = String(row.id)
    this.evaluationOrder = row.evaluationOrder
    this.type = row.type
    this.definition = definition
    this.programKey = row.programKey
    this.applicationInternalId = row.applicationId
    this.applicationId = String(row.applicationId)
    this.applicationPhase = row.applicationPhase
    this.appRequestInternalId = row.appRequestId
    this.appRequestId = String(row.appRequestId)
    this.appRequestPhase = row.appRequestPhase
    this.periodId = String(row.periodId)
    this.userInternalId = row.userId
    this.status = row.status
    this.statusReason = row.statusReason
    this.setBlame(row.blame ? JSON.parse(row.blame) : undefined)
    this.workflowStageKey = row.workflowStage
    this.workflowStageDefinition = row.workflowStage ? programRegistry.workflowStagesByKey[row.workflowStage] : undefined
  }

  setBlame (raw: BlameEntry[] | undefined | null) {
    const { blame, blameFields } = normalizeBlame(raw)
    this.blame = blame
    this.blameFields = blameFields
  }

  static clone (req: ApplicationRequirement) {
    return new ApplicationRequirement({
      id: req.internalId,
      type: req.type,
      applicationId: req.applicationInternalId,
      applicationPhase: req.applicationPhase,
      appRequestId: req.appRequestInternalId,
      appRequestPhase: req.appRequestPhase,
      periodId: Number(req.periodId),
      userId: req.userInternalId,
      requirementKey: req.key,
      programKey: req.programKey,
      evaluationOrder: req.evaluationOrder,
      status: req.status,
      statusReason: req.statusReason,
      blame: serializeBlame(req.blameFields),
      workflowStage: req.workflowStageKey
    })
  }

  @Field(type => ID)
  id: string

  @Field(type => RequirementStatus, { description: 'The status of the requirement. This is what will be shown to users.' })
  status: RequirementStatus

  @Field({ nullable: true, description: 'The reason why the requirement is in the status it is in. This will be shown to the applicant.' })
  statusReason?: string

  @Field(type => [String], { nullable: true, description: 'The prompt keys the requirement named as responsible for its current status. Used to attach status indicators to the specific answers at fault instead of every prompt the requirement consults. Null when the requirement did not name any, in which case all of its prompts are implicated.' })
  blame?: string[]

  @Field(type => [RequirementBlame], { nullable: true, description: 'The same answers as `blame`, one entry per blame, with the specific form fields at fault and a helper message for them when the requirement named any. Null when `blame` is null.' })
  blameFields?: RequirementBlame[]
}

@InputType()
export class ApplicationRequirementFilter {
  @Field(type => [ID], { nullable: true })
  ids?: string[]

  @Field(type => [ID], { nullable: true })
  applicationIds?: string[]

  @Field(type => [ID], { nullable: true })
  requirementKeys?: string[]

  @Field(type => [ID], { nullable: true })
  appRequestIds?: string[]
}

@ObjectType()
export class PeriodProgramRequirement extends Requirement {
  constructor (row: PeriodProgramRequirementRow) {
    super(requirementRegistry.get(row.requirementKey))
    this.periodId = String(row.periodId)
    this.programKey = row.programKey
    this.enabled = !row.disabled
  }

  @Field({ description: 'Whether the requirement is enabled in this period. This is set by the system administrator.' })
  enabled: boolean

  periodId: string
  programKey: string
}

@ObjectType()
export class PeriodRequirementAccess {}

@ObjectType()
export class PeriodProgramRequirementAccess {}

@InputType()
export class PeriodProgramRequirementKey extends PeriodProgramKey {
  @Field()
  requirementKey!: string
}

@InputType()
export class PeriodRequirementKey {
  @Field()
  periodId!: string

  @Field()
  requirementKey!: string
}

@InputType()
export class PeriodProgramRequirementFilters {
  @Field(type => [PeriodProgramRequirementKey], { nullable: true, description: 'Return individual PeriodProgramRequirement records.' })
  keys?: PeriodProgramRequirementKey[]

  @Field(type => [PeriodProgramKey], { nullable: true, description: 'Return requirements for these PeriodProgram keys.' })
  periodPrograms?: PeriodProgramKey[]

  @Field(type => [ID], { nullable: true, description: 'Return requirements for these period IDs.' })
  periodIds?: string[]

  @Field(type => [ID], { nullable: true, description: 'Return requirements for these program keys.' })
  programKeys?: string[]

  @Field(type => [String], { nullable: true, description: 'Return requirements for these requirement keys.' })
  requirementKeys?: string[]

  @Field(type => [PeriodRequirementKey], { nullable: true, description: 'Return PeriodProgramRequirements by periodId and requirementKey.' })
  periodRequirementKeys?: PeriodRequirementKey[]
}
