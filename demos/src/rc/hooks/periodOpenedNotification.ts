import { DateTime } from 'luxon'
import { appConfig, AppRequestPhase, getAppRequestData, getAppRequests, getPeriods, MailService, type ScheduledHook } from '@reqquest/api'

/**
 * rc's "a new period has opened" notification. Who should hear about a new period is specific to
 * each downstream application, so this is not a platform feature: it is a `hooks.scheduled` job
 * defined by the demo, and doubles as the worked example of writing one.
 *
 * rc's rule: everyone who submitted an app request in the previous period is told when the next
 * period opens, unless they already have a request in the new period or answered "No" to that
 * previous request's future_communication_opt_in_prompt. A previous request with no answer at all
 * (it predates the prompt) is still notified.
 *
 * Runs hourly. Idempotency comes from the dedup key - one email per user per newly opened period -
 * and from only announcing the most recently opened period, and only within 7 days of its openDate.
 * That keeps a first deploy from announcing a period that opened long ago while still catching up
 * after a few days of downtime.
 */
export const periodOpenedNotification: ScheduledHook = {
  minutesBetween: 60,
  async run (ctx) {
    const now = DateTime.now()
    // getPeriods orders by openDate DESC, so the first opened period is the current one and the
    // first period older than it is its predecessor
    const opened = await getPeriods({ opensBefore: now })
    const period = opened[0]
    if (!period || period.openDate < now.minus({ days: 7 })) return
    const previous = opened.find(p => p.openDate < period.openDate)
    if (!previous) return

    const [previousRequests, currentRequests] = await Promise.all([
      getAppRequests({ periodIds: [previous.id] }),
      getAppRequests({ periodIds: [period.id] })
    ])
    const alreadyApplied = new Set(currentRequests.map(ar => ar.userInternalId))
    // "submitted" = left the applicant phase; submittedAt is cleared on return-to-applicant, phase is the stable signal
    const candidates = previousRequests.filter(ar => ar.phase !== AppRequestPhase.STARTED && !alreadyApplied.has(ar.userInternalId))
    if (!candidates.length) return

    // prompt answers are not on the AppRequest rows, so load them for the candidates only
    const optedOut = new Set(
      (await getAppRequestData(candidates.map(ar => ar.internalId)))
        .filter(row => row.data['future_communication_opt_in_prompt']?.optIn === false)
        .map(row => row.id)
    )
    const userIds = Array.from(new Set(candidates.filter(ar => !optedOut.has(ar.internalId)).map(ar => ar.userInternalId)))
    if (!userIds.length) return

    await ctx.svc(MailService).sendmulti({
      from: appConfig.emailConfig.from,
      userIds,
      templateKey: 'period_opened',
      extra: {
        ...appConfig.emailConfig,
        periodName: period.name,
        openDate: period.openDate.toFormat('DDDD'),
        closeDate: period.closeDate?.toFormat('DDDD') ?? ''
      },
      dedupKey: userInternalId => `period_opened_${period.id}_${userInternalId}`
    })
  }
}
