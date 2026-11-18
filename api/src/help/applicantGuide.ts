import { parse } from 'acorn'
import {
  appConfig, applicantRequirementTypes, programRegistry, promptRegistry, requirementRegistry, RequirementType,
  type PromptDefinitionProcessed, type RequirementDefinitionProcessed
} from '../internal.js'

/**
 * The applicant guide is a Markdown document written for AI agents: an applicant points their
 * agent at it and asks what they need to do, why they are stuck on a prompt, or what comes next.
 *
 * It is rendered once at startup from the definitions handed to `RQServer.start`, and only when
 * `appConfig.applicantGuide` is on, because it is served without login.
 *
 * Reviewer-side definitions are not described. Only requirements of an applicant type are walked
 * and only prompts an applicant answers are listed. One thing does come through: an applicant rule
 * that reads staff-provided data is published in full like any other, so its code shows that staff
 * prompt's key and how its answer is used. Withholding it hid the applicant-side conditions too,
 * which are what an applicant most needs explained.
 */

let cachedGuide: string | undefined

export function getApplicantGuide () {
  return cachedGuide
}

export function buildApplicantGuide () {
  cachedGuide = renderApplicantGuide()
  return cachedGuide
}

const WRAPPERS: [string, string][] = [
  ['(', ')'], // arrow functions and function expressions
  ['({', '})'] // method shorthand: `resolve (data) { ... }`
]

/**
 * Returns the function's source with every comment removed, or undefined when it cannot be parsed.
 *
 * Callers must treat undefined as "publish nothing" - developer comments and commented-out code
 * are not meant for applicants, so an unparseable function is withheld rather than shown raw.
 * A real parser is used because `//` is ordinary text inside strings, templates and regexes.
 */
export function stripComments (fn: (...args: any[]) => any): string | undefined {
  const source = fn.toString()
  for (const [prefix, suffix] of WRAPPERS) {
    const wrapped = prefix + source + suffix
    const comments: [number, number][] = []
    try {
      parse(wrapped, { ecmaVersion: 'latest', onComment: (_block, _text, start, end) => { comments.push([start, end]) } })
    } catch {
      continue
    }
    let stripped = wrapped
    for (const [start, end] of comments.reverse()) stripped = stripped.slice(0, start) + stripped.slice(end)
    return tidy(stripped.slice(prefix.length, stripped.length - suffix.length))
  }
  return undefined
}

/** Drops the blank lines comments leave behind and the indentation the function had in its file. */
function tidy (source: string) {
  const lines = source.split('\n').map(line => line.trimEnd()).filter(line => line.length > 0)
  const indents = lines.slice(1).map(line => line.length - line.trimStart().length)
  const indent = indents.length ? Math.min(...indents) : 0
  return [lines[0].trimStart(), ...lines.slice(1).map(line => line.slice(indent))].join('\n')
}

const phaseLabels: Partial<Record<RequirementType, string>> = {
  [RequirementType.PREQUAL]: 'Pre-qualification',
  [RequirementType.QUALIFICATION]: 'Qualification',
  [RequirementType.POSTQUAL]: 'Before submitting',
  [RequirementType.ACCEPTANCE]: 'Accepting an offer'
}

function codeBlock (lang: string, body: string) {
  // a longer fence keeps a body that itself contains ``` from closing the block early
  const fence = body.includes('```') ? '````' : '```'
  return [fence + lang, body, fence]
}

function hasContent (value: unknown) {
  return value != null && (typeof value !== 'object' || Object.keys(value).length > 0)
}

function publishedSource (label: string, fn: ((...args: any[]) => any) | undefined, unparsed: string[]) {
  if (!fn) return undefined
  const source = stripComments(fn)
  if (source == null) unparsed.push(label)
  return source
}

function schemaFields (schema: any): string[] {
  if (schema?.type !== 'object' || schema.properties == null) return []
  const required = new Set<string>(schema.required ?? [])
  return Object.entries<any>(schema.properties).map(([name, prop]) => {
    const type = Array.isArray(prop?.type) ? prop.type.join(' or ') : prop?.type
    const details = [type, prop?.enum ? `one of ${prop.enum.map((v: unknown) => JSON.stringify(v)).join(', ')}` : undefined, required.has(name) ? 'required' : undefined].filter(Boolean).join(', ')
    return `- \`${name}\`${details ? ` (${details})` : ''}${prop?.description ? `: ${prop.description}` : ''}`
  })
}

export function renderApplicantGuide (): string {
  const unparsed: string[] = []
  const programs = programRegistry.reachable.map(program => ({
    program,
    requirements: program.requirementKeys
      .map(key => requirementRegistry.get(key))
      .filter((req): req is RequirementDefinitionProcessed => req != null && applicantRequirementTypes.has(req.type))
  })).filter(p => p.requirements.length > 0)

  // each requirement and prompt is described once, in the order an applicant first meets it
  const requirements = new Map<string, RequirementDefinitionProcessed>()
  const programsByRequirement = new Map<string, string[]>()
  for (const { program, requirements: reqs } of programs) {
    for (const req of reqs) {
      requirements.set(req.key, req)
      programsByRequirement.set(req.key, [...(programsByRequirement.get(req.key) ?? []), program.title])
    }
  }
  const prompts = new Map<string, PromptDefinitionProcessed>()
  const requirementsByPrompt = new Map<string, string[]>()
  for (const req of requirements.values()) {
    for (const key of req.allPromptKeys) {
      if (!promptRegistry.isUserPrompt(key)) continue
      const prompt = promptRegistry.get(key)
      if (!prompt) continue
      prompts.set(key, prompt)
      requirementsByPrompt.set(key, [...(requirementsByPrompt.get(key) ?? []), req.title])
    }
  }
  const promptRef = (key: string) => `"${prompts.get(key)?.title ?? key}" (\`${key}\`)`

  const out: string[] = []
  out.push(
    '# Applicant guide',
    '',
    '## For the AI agent reading this',
    '',
    'This document describes what an applicant must do to complete an application request in this system: the programs offered, the requirements each program checks, and the questions ("prompts") the applicant answers to satisfy them. It is generated from the system\'s own rules each time the system starts.',
    '',
    'Use it to help an applicant who is stuck on a question or unsure what comes next.',
    '',
    '- Explain in plain, everyday language. The rule code below is for your understanding; do not show code, keys or field names to the applicant.',
    '- You cannot see the applicant\'s answers or the current state of their request. Ask them what the screen shows.',
    '- Values labelled "default settings" can be changed by administrators for each application period, so treat specific numbers and names as likely rather than certain, and tell the applicant to trust what the application itself displays.',
    '- Requirements can be switched off for a period. If the applicant never sees something described here, that is expected.',
    '- This document covers only the applicant\'s side. What staff do during review is not described here, and you should not guess at it.',
    '',
    '## How applying works',
    '',
    `- An applicant creates an application request during an open application period. ${appConfig.multipleRequestsPerPeriod ? 'An applicant may have more than one request in the same period.' : 'An applicant has one request per period.'}`,
    '- One request covers every program offered. Each program is evaluated separately, so an applicant can qualify for some programs and not others.',
    '- Each program has an ordered list of requirements. A requirement is a rule; it is decided from the applicant\'s answers to one or more prompts.',
    '- Prompts are revealed one at a time. While a requirement is still undecided the next prompt it needs appears; once the requirement is decided, its remaining prompts are never asked. Only needed information is collected.',
    '- A prompt can serve several requirements. It is answered once and the answer is reused.',
    '- A prompt only counts once it is saved without errors. Until then the requirements that need it stay undecided.',
    '',
    'Each requirement ends in one of these outcomes:',
    '',
    '- **Pending** (`PENDING`): undecided; more answers are needed.',
    '- **Met** (`MET`): satisfied.',
    '- **Warning** (`WARNING`): satisfied, but with a concern the applicant is told about. It does not block the application.',
    '- **Disqualifying** (`DISQUALIFYING`): not satisfied; the applicant is not eligible for that program. Other programs are unaffected.',
    '- **Not applicable** (`NOT_APPLICABLE`): the rule does not apply to this applicant and is treated as satisfied.',
    '',
    'The steps, in order:',
    '',
    '1. **Pre-qualification.** Early questions that decide which programs are relevant. Programs the applicant does not pre-qualify for are hidden.',
    '2. **Qualification.** The main questions for each program. Every qualification requirement must be decided before submitting.',
    '3. **Before submitting.** Final questions that apply to the request as a whole, such as acknowledgements.',
    '4. **Submit.** Once nothing is pending the applicant submits the request. Answers cannot be changed after that unless staff return the request.',
    '5. **Staff review.** Staff review the request. The applicant waits.',
    '6. **Accepting an offer.** Some programs ask the applicant to come back after review and answer further questions to accept.',
    ''
  )

  out.push('## Programs', '')
  if (!programs.length) out.push('No programs with applicant requirements are currently defined.', '')
  for (const { program, requirements: reqs } of programs) {
    out.push(`### ${program.title}`, '')
    if (program.applicantDescription) out.push(program.applicantDescription, '')
    if (program.eligibilityDescription) out.push(`**Eligibility:** ${program.eligibilityDescription}`, '')
    out.push('Requirements, in the order they are evaluated:', '')
    reqs.forEach((req, i) => out.push(`${i + 1}. ${req.title} (\`${req.key}\`) - ${phaseLabels[req.type]}`))
    out.push('')
  }

  out.push('## Requirements', '')
  for (const req of requirements.values()) {
    out.push(`### ${req.title}`, '')
    out.push(`- Key: \`${req.key}\``)
    out.push(`- Step: ${phaseLabels[req.type]}`)
    out.push(`- Used by: ${programsByRequirement.get(req.key)!.join(', ')}`)
    out.push('')
    if (req.description) out.push(req.description, '')

    const noDisplay = [...req.noDisplayPromptKeySet]
    const staffDependent = req.allPromptKeys.some(key => !promptRegistry.isUserPrompt(key))
    const ordered = (req.promptKeys ?? []).filter(key => prompts.has(key))
    const anyOrder = (req.promptKeysAnyOrder ?? []).filter(key => prompts.has(key))
    if (ordered.length) {
      out.push('Prompts asked, one at a time in this order, until the requirement is decided:', '')
      ordered.forEach((key, i) => out.push(`${i + 1}. ${promptRef(key)}`))
      out.push('')
    }
    if (anyOrder.length) {
      out.push('Prompts shown together, answerable in any order:', '')
      for (const key of anyOrder) out.push(`- ${promptRef(key)}`)
      out.push('')
    }
    const reused = noDisplay.filter(key => prompts.has(key))
    if (reused.length) {
      out.push('Also uses answers the applicant gives elsewhere (not asked again here):', '')
      for (const key of reused) {
        out.push(`- ${promptRef(key)}${req.ungatedPromptKeySet.has(key) ? ' - used if already answered, but does not hold this requirement back' : ' - must be answered before this requirement can be decided'}`)
      }
      out.push('')
    }
    if (!ordered.length && !anyOrder.length && !reused.length && !staffDependent) out.push('This requirement asks the applicant nothing; it is decided automatically.', '')

    if (hasContent(req.configuration?.default)) {
      out.push('Default settings (administrators may change these per period; the rule refers to them as `config`):', '', ...codeBlock('json', JSON.stringify(req.configuration!.default, null, 2)), '')
    }
    if (staffDependent) {
      const waitsOnStaff = req.allPromptKeys.some(key => !promptRegistry.isUserPrompt(key) && !req.ungatedPromptKeySet.has(key))
      out.push(`Part of this requirement depends on a staff review step. ${waitsOnStaff ? 'It can stay undecided until staff have acted, and the applicant cannot answer that part.' : 'What staff record during review can change its outcome later; the applicant cannot answer that part.'} In the rule below, any answer key that is not one of the applicant prompts listed above is filled in by staff, not the applicant.`, '')
    }
    const source = publishedSource(`requirement ${req.key}`, req.resolve, unparsed)
    if (source) {
      out.push('Rule logic. The first argument holds the answers keyed by prompt key (absent until that prompt is answered), the second the settings above. A `reason` is the message the applicant sees:', '', ...codeBlock('js', source), '')
    }
  }

  out.push('## Prompts', '')
  for (const [key, prompt] of prompts) {
    out.push(`### ${prompt.title}`, '')
    out.push(`- Key: \`${key}\``)
    out.push(`- Needed by: ${requirementsByPrompt.get(key)!.join(', ')}`)
    out.push('')
    if (prompt.description) out.push(prompt.description, '')
    const fields = schemaFields(prompt.schema)
    if (fields.length) out.push('Information collected:', '', ...fields, '')
    if (hasContent(prompt.configuration?.default)) {
      out.push('Default settings (administrators may change these per period):', '', ...codeBlock('json', JSON.stringify(prompt.configuration!.default, null, 2)), '')
    }
    const validate = publishedSource(`prompt ${key} validate`, prompt.validate, unparsed)
    if (validate) {
      out.push('Answer checks. Each message is shown to the applicant next to the field named by `arg`; an error-type message means the prompt does not count as answered yet:', '', ...codeBlock('js', validate), '')
    }
    if (Array.isArray(prompt.invalidUponChange)) {
      const targets = prompt.invalidUponChange.filter(target => prompts.has(target.promptKey))
      if (targets.length) {
        out.push('Changing this answer means these prompts must be answered again:', '')
        for (const target of targets) out.push(`- ${promptRef(target.promptKey)}`)
        out.push('')
      }
    } else if (prompt.invalidUponChange) {
      out.push('Depending on the answer given here, other prompts may need to be answered again.', '')
    }
  }

  const sharedPrompts = [...requirementsByPrompt].filter(([, reqs]) => reqs.length > 1)
  const sharedRequirements = [...programsByRequirement].filter(([, progs]) => progs.length > 1)
  if (sharedPrompts.length || sharedRequirements.length) {
    out.push('## Dependencies at a glance', '')
    if (sharedPrompts.length) {
      out.push('Prompts whose one answer feeds several requirements:', '')
      for (const [key, reqs] of sharedPrompts) out.push(`- ${promptRef(key)}: ${reqs.join(', ')}`)
      out.push('')
    }
    if (sharedRequirements.length) {
      out.push('Requirements checked by several programs (decided separately for each program, from the same answers):', '')
      for (const [key, progs] of sharedRequirements) out.push(`- ${requirements.get(key)!.title} (\`${key}\`): ${progs.join(', ')}`)
      out.push('')
    }
  }

  if (unparsed.length) console.warn(`Applicant guide: source withheld because it could not be parsed for comment removal: ${unparsed.join(', ')}`)
  return out.join('\n')
}
