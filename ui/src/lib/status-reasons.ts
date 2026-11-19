import type { Feedback } from '@txstate-mws/svelte-forms'
import type { StatusFieldReason, StatusReason } from './types.js'

/**
 * Requirement status -> svelte-forms Feedback type. A status missing from this map is never surfaced as a
 * notification, so this is the one place to narrow which statuses show.
 */
const statusFeedbackType: Record<string, Feedback['type']> = {
  PENDING: 'info',
  WARNING: 'warning',
  DISQUALIFYING: 'error',
  MET: 'success',
  NOT_APPLICABLE: 'info'
}

/**
 * Turn a prompt's `statusReasons` into the `Feedback` objects `FormInlineNotification` renders, so a
 * requirement's reason looks exactly like a svelte-forms validation message.
 *
 * Entries with no reason text are dropped. Identical type+message pairs (the same requirement reached
 * through several programs) collapse into one notification; when the prompt's entries span more than one
 * program, each notification is titled with the program(s) it came from.
 *
 * `blamedOnly` keeps only entries whose requirement explicitly named this prompt in `blame`, and `statuses`
 * keeps only entries with one of those statuses - the framework's edit forms pass both, with `statuses` from
 * `uiRegistry.statusReasonNotificationStatuses(promptKey)`. A display component may do the same to follow
 * the project's configuration, or pass neither to show everything it was handed.
 */
export function statusReasonsToFeedback (statusReasons?: StatusReason[] | null, opts?: { blamedOnly?: boolean, statuses?: Iterable<string> }): Feedback[] {
  const allowed = opts?.statuses ? new Set(opts.statuses) : undefined
  const entries = (statusReasons ?? []).filter(r => (!opts?.blamedOnly || r.blamed) && (allowed == null || allowed.has(r.status)))
  const programs = new Set(entries.map(r => r.programName))
  const grouped = new Map<string, { type: Feedback['type'], message: string, programs: Set<string> }>()
  for (const r of entries) {
    const type = statusFeedbackType[r.status]
    const message = r.statusReason?.trim()
    if (!type || !message) continue
    const key = `${type}\u0000${message}`
    const entry = grouped.get(key) ?? { type, message, programs: new Set<string>() }
    entry.programs.add(r.programName)
    grouped.set(key, entry)
  }
  return [...grouped.values()].map(e => ({
    type: e.type,
    message: e.message,
    extra: programs.size > 1 ? { title: [...e.programs].join(', ') } : undefined
  }))
}

/**
 * The field-level counterpart of `statusReasonsToFeedback`: one `Feedback` per form field a requirement
 * blamed, carrying a `path`, so svelte-forms shows it underneath that input exactly like a validation
 * message. Add the result to the messages a form's `validate` and `submit` return.
 *
 * The text is the blame entry's own message, or the requirement's overall reason when it gave none. The
 * type follows the blame entry's own status when it gave one, otherwise the requirement's status. The same
 * field+type+message reached through several programs collapses into one.
 *
 * The framework's edit forms call this with no options and show every field message: a requirement that
 * wrote a message for a field means it to be seen, so the project's `statusReasonNotifications` setting
 * (which governs the notification below a form) deliberately does not apply. `statuses` is there for a
 * display component that wants to narrow what it renders; it is matched against the effective per-field
 * status. `blamedOnly` changes nothing here: an entry with field reasons is always blamed.
 */
export function statusReasonsToFieldFeedback (statusReasons?: StatusReason[] | null, opts?: { blamedOnly?: boolean, statuses?: Iterable<string> }): Feedback[] {
  const allowed = opts?.statuses ? new Set(opts.statuses) : undefined
  const seen = new Set<string>()
  const feedback: Feedback[] = []
  for (const r of statusReasons ?? []) {
    if (opts?.blamedOnly && !r.blamed) continue
    for (const fieldReason of r.fieldReasons ?? []) {
      const status = fieldReason.status ?? r.status
      if (allowed != null && !allowed.has(status)) continue
      const type = statusFeedbackType[status]
      if (!type) continue
      const message = (fieldReason.message ?? r.statusReason)?.trim()
      if (!message) continue
      for (const path of fieldReason.fields) {
        const key = `${path}\u0000${type}\u0000${message}`
        if (seen.has(key)) continue
        seen.add(key)
        feedback.push({ type, path, message })
      }
    }
  }
  return feedback
}

/**
 * Pick out of a requirement's `blameFields` the field reasons aimed at one prompt, in the shape
 * `StatusReason.fieldReasons` carries them.
 */
export function fieldReasonsForPrompt (blameFields: { promptKey: string, fields?: string[] | null, message?: string | null, status?: string | null }[] | null | undefined, promptKey: string): StatusFieldReason[] {
  return (blameFields ?? [])
    .filter(b => b.promptKey === promptKey && b.fields?.length)
    .map(b => ({ fields: b.fields!, message: b.message, status: b.status }))
}
