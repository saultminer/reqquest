import { DateTime } from 'luxon'

// Date Formatting Functions

export function longDateTime (dt: DateTime | string) {
  const dateTime = typeof dt === 'string' ? DateTime.fromISO(dt) : dt
  return dateTime.toFormat("MMMM d, yyyy '@' H:mm a")
}

export function longNumericTime (dt: DateTime | string) {
  const dateTime = typeof dt === 'string' ? DateTime.fromISO(dt) : dt
  return dateTime.toFormat('MM/dd/yyyy h:mm a')
}

export function exportTimestamp (dt: DateTime | string) {
  const dateTime = typeof dt === 'string' ? DateTime.fromISO(dt) : dt
  return dateTime.toFormat("MM/dd/yyyy 'at' hh:mma")
}

export function machineDateTime (dt: DateTime | string) {
  const dateTime = typeof dt === 'string' ? DateTime.fromISO(dt) : dt
  return dateTime.toISO({ suppressMilliseconds: true })
}

export function twoLineDateHtml (iso: string) {
  const d = DateTime.fromISO(iso)
  return `<div>${d.toFormat('D')}</div><div>${d.toFormat('t')}</div>`
}

export function booleanToWord (bool?: boolean) {
  return bool ? 'Yes' : 'No'
}