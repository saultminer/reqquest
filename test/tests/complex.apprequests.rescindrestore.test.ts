import { expect, test } from './fixtures.js'
import { promptMapReviewerQualified } from './complex.promptdata.js'
import { getState, application, answerAvailable, expectRefused, seededPeriodId, submitQualifiedRequest, finishBlockingWorkflow } from './complex.flow.js'

/**
 * Rescinding pulls an approved benefit back from the applicant; restoring puts it back exactly as it was. Both need
 * AppRequest.review plus the ApplicationApproved control, which the demo's Su role carries and the Reviewer role does
 * not. Each action emails the applicant with the reason given.
 *
 * Mail is not sent inline: the mutation queues an outbox row and the API's scheduler (util/scheduler.ts) flushes the
 * outbox on a ~90 s loop that first fires ~90 s after boot. The compose stack routes SMTP to a fake-smtp-server whose
 * HTTP API exposes what it received, so the mail assertions poll that with a generous timeout. Every demo user shares
 * the same address, so the emails are matched on the unique reason text rather than on the recipient.
 */
type Email = { subject: string, text: string, to: { value: { address: string, name: string }[] } }

const rescindMutation = `
  mutation Rescind($applicationId: ID!, $reason: String!, $validateOnly: Boolean) {
    rescind(applicationId: $applicationId, reason: $reason, validateOnly: $validateOnly) { success messages { message arg } }
  }
`
const restoreMutation = `
  mutation Restore($applicationId: ID!, $reason: String!, $validateOnly: Boolean) {
    restore(applicationId: $applicationId, reason: $reason, validateOnly: $validateOnly) { success messages { message arg } }
  }
`

const dog = 'adopt_a_dog_program'
const dogTitle = 'Adopt a Dog'
const expectedSubject = 'Update Regarding Your Reqquest Request'
const fakeSmtpEmails = 'http://fakesmtp:1080/api/emails'

test.describe.serial('Rescind and restore an approved benefit, notifying the applicant', { tag: '@complex' }, () => {
  // the seeded period allows one request per applicant and the other complex specs already use applicant/applicant2 in it
  test.use({ login: 'applicant3' })
  let appRequestId = 0
  let applicationId = ''
  let rescindReason = ''
  let restoreReason = ''

  test('Applicant - qualify for all three programs and submit', async ({ adminRequest, request }) => {
    appRequestId = await submitQualifiedRequest(request.graphql, 'applicant3', await seededPeriodId(adminRequest.graphql))
    rescindReason = `Rescind e2e ${appRequestId}: shelter records show the adoption fee was never paid`
    restoreReason = `Restore e2e ${appRequestId}: the fee payment was located and posted`
  })

  test('Reviewer - approve every application and finish blocking workflow', async ({ reviewerRequest }) => {
    await answerAvailable(reviewerRequest.graphql, appRequestId, promptMapReviewerQualified)
    await finishBlockingWorkflow(reviewerRequest.graphql, appRequestId)
    const state = await getState(reviewerRequest.graphql, appRequestId)
    const dogApp = application(state, dog)
    expect(dogApp.status).toEqual('ELIGIBLE')
    expect(dogApp.rescindedStatus).toBeNull()
    applicationId = dogApp.id
  })

  test('Reviewer - may neither rescind nor restore without the ApplicationApproved control', async ({ reviewerRequest }) => {
    const state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, dog).actions).toMatchObject({ rescindApplication: false, restoreApplication: false })
    await expectRefused(reviewerRequest.graphql, 'rescind', rescindMutation, { applicationId, reason: rescindReason, validateOnly: false })
    await expectRefused(reviewerRequest.graphql, 'restore', restoreMutation, { applicationId, reason: restoreReason, validateOnly: false })
  })

  test('Su - a rescind needs a reason', async ({ suRequest }) => {
    let state = await getState(suRequest.graphql, appRequestId)
    expect(application(state, dog).actions).toMatchObject({ rescindApplication: true, restoreApplication: false })
    const response = await suRequest.graphql<{ rescind: { success: boolean, messages: { message: string, arg: string }[] } }>(rescindMutation, { applicationId, reason: '   ', validateOnly: false })
    expect(response.rescind.success).toEqual(false)
    expect(response.rescind.messages.map(m => m.arg)).toContain('reason')
    state = await getState(suRequest.graphql, appRequestId)
    expect(application(state, dog).rescindedStatus).toBeNull()
  })

  test('Su - rescind the dog benefit', async ({ suRequest }) => {
    const response = await suRequest.graphql<{ rescind: { success: boolean, messages: { message: string }[] } }>(rescindMutation, { applicationId, reason: rescindReason, validateOnly: false })
    expect(response.rescind.success, response.rescind.messages.map(m => m.message).join('; ')).toEqual(true)
    const state = await getState(suRequest.graphql, appRequestId)
    const dogApp = application(state, dog)
    expect(dogApp.rescindedStatus).toEqual('RESCINDED')
    expect(dogApp.status).toEqual('RESCINDED')
    expect(dogApp.rescindedReason).toEqual(rescindReason)
    expect(dogApp.actions).toMatchObject({ rescindApplication: false, restoreApplication: true })
    // an already-rescinded benefit cannot be rescinded again
    await expectRefused(suRequest.graphql, 'rescind', rescindMutation, { applicationId, reason: rescindReason, validateOnly: false })
  })

  test('Su - restore the dog benefit to its prior status', async ({ suRequest }) => {
    const response = await suRequest.graphql<{ restore: { success: boolean, messages: { message: string }[] } }>(restoreMutation, { applicationId, reason: restoreReason, validateOnly: false })
    expect(response.restore.success, response.restore.messages.map(m => m.message).join('; ')).toEqual(true)
    const state = await getState(suRequest.graphql, appRequestId)
    const dogApp = application(state, dog)
    expect(dogApp.rescindedStatus).toEqual('RESTORED')
    expect(dogApp.status).toEqual('ELIGIBLE')
    expect(dogApp.restoredReason).toEqual(restoreReason)
    expect(dogApp.actions).toMatchObject({ rescindApplication: true, restoreApplication: false })
    // nothing is rescinded any more, so there is nothing to restore
    await expectRefused(suRequest.graphql, 'restore', restoreMutation, { applicationId, reason: restoreReason, validateOnly: false })
  })

  test('Applicant - receives one email for the rescind and one for the restore', async ({ suRequest }) => {
    test.setTimeout(300_000)
    const findEmails = async () => {
      const resp = await suRequest.request.get(fakeSmtpEmails)
      if (!resp.ok()) return []
      const emails = await resp.json() as Email[]
      return emails.filter(e => e.text?.includes(rescindReason) || e.text?.includes(restoreReason))
    }
    await expect.poll(async () => (await findEmails()).length, { message: 'waiting for the outbox scheduler to deliver both emails', timeout: 200_000, intervals: [3000] }).toEqual(2)
    const emails = await findEmails()
    const rescinded = emails.find(e => e.text.includes(rescindReason))!
    const restored = emails.find(e => e.text.includes(restoreReason))!
    for (const email of [rescinded, restored]) {
      expect(email.subject).toEqual(expectedSubject)
      expect(email.to.value[0].address).toEqual('reqquest-next@qual.txstate.edu')
      expect(email.text).toContain(dogTitle)
    }
    expect(rescinded.text).toContain(`Your previously granted approval for ${dogTitle} has been rescinded.`)
    expect(restored.text).toContain(`Your ${dogTitle} has been restored and is now approved.`)
  })
})
