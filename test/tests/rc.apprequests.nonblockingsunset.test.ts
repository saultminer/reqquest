import { DateTime } from 'luxon'
import { expect, test } from './fixtures.js'
import { answerAvailable, application, applicationAction, expectAction, expectRefused, getState, requestAction, requirement, updatePromptMutation, type Graphql, type State } from './complex.flow.js'

/**
 * A non-blocking workflow stage is editable from its `nonBlockingEmergence` phase until its `nonBlockingSunset` phase.
 * Software Development has two audit stages that both emerge at SUBMITTED. Only the second one sunsets (at ACCEPTANCE),
 * so the first is the control: same program, same emergence, no sunset.
 *
 * This demo has no acceptance phase, so completing the review carries the request straight past ACCEPTANCE. Whether it
 * lands in WORKFLOW_NONBLOCKING or COMPLETE depends on the API's period cache (see `seededPeriodId` in complex.flow.ts),
 * and the sunset has been reached either way, so the spec does not depend on which.
 */
const swdev = 'software_development'
const sunsetRequirement = 'audit_software_development_non_blocking_show_submitted_req2'
const sunsetPrompt = 'audit_software_development_non_blocking_show_submitted_prompt2'
const controlRequirement = 'audit_software_development_non_blocking_show_submitted_req'
const controlPrompt = 'audit_software_development_non_blocking_show_submitted_prompt'

const optOut = { optOut: true, optInUnderstand: false, optOutUnderstand: true }
const optOutPromptKeys = ['operations_infrastructure_opt_out_prompt', 'project_management_opt_out_prompt', 'application_management_opt_out_prompt', 'help_desk_opt_out_prompt']
const applicantAnswers = new Map<string, Map<string, any>>([
  ['pre_qual_prompt', new Map([['pass', { gpa: 3.5, availability: true, acknowledgeExpectations: true }]])],
  ['pre_qual_user_info_prompt', new Map([['pass', { correct: true }]])],
  ['data_related_puzzle_prompt', new Map([['pass', { puzzleAnswer: 'Join the two tables on the shared key.' }]])],
  ['outside_class_example_prompt', new Map([['pass', { outsideClassExample: true, description: 'Built a scheduling app for a student club.' }]])],
  ['critical_thinking_prompt', new Map([['pass', { criticalThinkingAnswer: 'Profile first, then optimize the slowest query.' }]])],
  // no multipart parts are sent, so preProcessData stores the upload info as-is
  ['reccomendation_letter_prompt', new Map([['pass', { reccomendationLetter: { _type: 'UploadInfo', multipartIndex: 0, name: 'letter.pdf', mime: 'application/pdf', size: 1024 } }]])]
])
const reviewerAnswers = new Map<string, Map<string, any>>([
  ['assess_data_related_puzzle_prompt', new Map([['pass', { score: 'Good' }]])],
  ['assess_outside_class_example_prompt', new Map([['pass', { showCriticalThinking: true, explanation: 'Clear example.' }]])],
  ['assess_critical_thinking_prompt', new Map([['pass', { realIssue: true, feasable: true }]])],
  ['assess_reccomendation_letter_prompt', new Map([['pass', { score: 'Good' }]])],
  ['verify_reccomendation_letter_prompt', new Map([['pass', { authentic: true, addressesTechnicalSkills: true, relationship: 'Professor' }]])]
])

const timeZone = 'America/Chicago'
const openDate = '2025-07-01T00:00:00.000-05:00'
const closeDate = DateTime.now().plus({ days: 1 }).setZone(timeZone).set({ millisecond: 0 }).toISO()
async function createPeriod (graphql: Graphql, name: string, code: string) {
  const { createPeriod } = await graphql<{ createPeriod: { period: { id: string } } }>(`
    mutation CreatePeriod($name: String!, $code: String!, $openDate: DateTime!, $closeDate: DateTime!) {
      createPeriod(period: { name: $name, code: $code, openDate: $openDate, closeDate: $closeDate }, validateOnly: false) { period { id } }
    }
  `, { name, code, openDate, closeDate })
  const periodId = String(createPeriod.period.id)
  await graphql('mutation ($periodId: ID!) { markPeriodReviewed(periodId: $periodId) { period { id } } }', { periodId })
  return periodId
}

const auditPrompt = (state: State, requirementKey: string, promptKey: string) => requirement(state, swdev, requirementKey).prompts.find(p => p.key === promptKey)!
/** Either way the reviewer screen offers an edit: the pencil/dialog button, or the prompt's form rendered inline. */
const editControls = (promptId: number) => `#edit-btn-${promptId}, dd[role="group"][aria-labelledby="dt-title-${promptId}"]`

test.describe.serial('A non-blocking workflow stage stops being editable at its sunset phase', { tag: '@rc' }, () => {
  let periodId = ''
  let appRequestId = 0

  test('Admin - open a period for this spec', async ({ adminRequest }) => {
    periodId = await createPeriod(adminRequest.graphql, '2025 non-blocking sunset', 'NONBLOCKING_SUNSET')
  })

  test('Applicant - apply to software development only and submit', async ({ applicantRequest }) => {
    const { createAppRequest } = await applicantRequest.graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(`
      mutation ($login: String!, $periodId: ID!) {
        createAppRequest(login: $login, periodId: $periodId, validateOnly: false) { appRequest { id } messages { message } }
      }
    `, { login: 'applicant', periodId })
    expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
    appRequestId = createAppRequest.appRequest!.id
    await answerAvailable(applicantRequest.graphql, appRequestId, applicantAnswers)
    const before = await getState(applicantRequest.graphql, appRequestId)
    for (const key of optOutPromptKeys) {
      const prompt = before.applications.flatMap(a => a.requirements.flatMap(r => r.prompts)).find(p => p.key === key)!
      const response = await applicantRequest.graphql<{ updatePrompt?: { success: boolean }, errors?: { message: string }[] }>(updatePromptMutation, { promptId: prompt.id, data: optOut })
      expect(response.errors, key).toBeUndefined()
      expect(response.updatePrompt!.success, key).toEqual(true)
    }
    await expectAction(applicantRequest.graphql, 'submitAppRequest', requestAction('submitAppRequest'), { appRequestId })
  })

  test('Reviewer - during review both audit stages have emerged and are editable, in the API and on screen', async ({ reviewerPage, reviewerRequest }) => {
    const state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.phase).toEqual('SUBMITTED')
    const sunset = auditPrompt(state, sunsetRequirement, sunsetPrompt)
    const control = auditPrompt(state, controlRequirement, controlPrompt)
    expect(sunset.actions.update, sunsetPrompt).toEqual(true)
    expect(control.actions.update, controlPrompt).toEqual(true)

    await reviewerPage.goto(`/requests/${appRequestId}/approve/${swdev}`)
    await expect(reviewerPage.locator(editControls(sunset.id))).toHaveCount(1)
    await expect(reviewerPage.locator(editControls(control.id))).toHaveCount(1)
  })

  test('Reviewer - answer the sunset stage while it is open, then finish the review', async ({ reviewerRequest }) => {
    // the control stage is deliberately left unanswered
    await answerAvailable(reviewerRequest.graphql, appRequestId, new Map([[sunsetPrompt, new Map([['pass', { ok: true }]])]]))
    await answerAvailable(reviewerRequest.graphql, appRequestId, reviewerAnswers)
    let state = await getState(reviewerRequest.graphql, appRequestId)
    expect(requirement(state, swdev, sunsetRequirement).status).toEqual('MET')
    expect(application(state, swdev).phase).toEqual('READY_FOR_WORKFLOW')

    await expectAction(reviewerRequest.graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: application(state, swdev).id })
    await answerAvailable(reviewerRequest.graphql, appRequestId, new Map([['reviewer_software_development_second_eyes_prompt', new Map([['pass', { score: 80 }]])]]))
    state = await getState(reviewerRequest.graphql, appRequestId)
    await expectAction(reviewerRequest.graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: application(state, swdev).id })
    await expectAction(reviewerRequest.graphql, 'completeReview', requestAction('completeReview'), { appRequestId })
    expect(['WORKFLOW_NONBLOCKING', 'COMPLETE']).toContain((await getState(reviewerRequest.graphql, appRequestId)).phase)
  })

  test('Reviewer - past the sunset the stage is still shown but read-only, while the stage without a sunset stays editable', async ({ reviewerPage, reviewerRequest }) => {
    const state = await getState(reviewerRequest.graphql, appRequestId)
    const sunset = auditPrompt(state, sunsetRequirement, sunsetPrompt)
    const control = auditPrompt(state, controlRequirement, controlPrompt)
    expect(sunset.actions.update, sunsetPrompt).toEqual(false)
    expect(control.actions.update, controlPrompt).toEqual(true)
    // the sunset only stops edits: the answer given during review is still there
    expect(requirement(state, swdev, sunsetRequirement).status).toEqual('MET')
    await expectRefused(reviewerRequest.graphql, 'updatePrompt', updatePromptMutation, { promptId: sunset.id, data: { ok: false } })
    expect(requirement(await getState(reviewerRequest.graphql, appRequestId), swdev, sunsetRequirement).status).toEqual('MET')

    await reviewerPage.goto(`/requests/${appRequestId}/approve/${swdev}`)
    // wait on the control so the absence checked next is not just a page that has not rendered yet
    await expect(reviewerPage.locator(editControls(control.id))).toHaveCount(1)
    await expect(reviewerPage.locator(`#dt-title-${sunset.id}`)).toHaveCount(1)
    await expect(reviewerPage.locator(editControls(sunset.id))).toHaveCount(0)
  })

  test('Reviewer - returning the request to review, before the sunset phase, makes the stage editable again', async ({ reviewerRequest }) => {
    await expectAction(reviewerRequest.graphql, 'returnToReview', requestAction('returnToReview'), { appRequestId })
    const state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.phase).toEqual('SUBMITTED')
    const sunset = auditPrompt(state, sunsetRequirement, sunsetPrompt)
    expect(sunset.actions.update, sunsetPrompt).toEqual(true)
    await expectAction(reviewerRequest.graphql, 'updatePrompt', updatePromptMutation, { promptId: sunset.id, data: { ok: false } })
  })
})
