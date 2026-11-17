import type { Page } from '@playwright/test'
import { expect, test } from './fixtures.js'
import { answerAvailable, application, applicationAction, expectAction, expectRefused, getState, requestAction, requirement, updatePromptMutation, type Graphql, type State } from './complex.flow.js'

/**
 * A non-blocking workflow stage is editable from its `nonBlockingEmergence` phase until its `nonBlockingSunset` phase
 * or until a reviewer marks its program complete, whichever comes first.
 *
 * Two programs are applied for:
 * - software_development has audit stages that emerge at SUBMITTED - one sunsets at ACCEPTANCE, the other (the control)
 *   never does - plus two that emerge at WORKFLOW_NONBLOCKING. With stages still open in non-blocking workflow it must
 *   be marked complete by a reviewer, and can be reopened.
 * - operations_infrastructure's only non-blocking stage (the GPA override) sunsets when non-blocking workflow begins.
 *   Nothing is left for a reviewer to change, so it completes on its own and offers neither action.
 *
 * This demo has no acceptance phase, so completing the review carries the request straight past ACCEPTANCE into
 * WORKFLOW_NONBLOCKING. That needs the seeded 'Period 2' (see demos/src/rc/testdata.ts): a period created by a spec
 * is not yet known to carry non-blocking workflow and would skip to COMPLETE.
 */
const swdev = 'software_development'
const ops = 'operations_infrastructure'
const sunsetRequirement = 'audit_software_development_non_blocking_show_submitted_req2'
const sunsetPrompt = 'audit_software_development_non_blocking_show_submitted_prompt2'
const controlRequirement = 'audit_software_development_non_blocking_show_submitted_req'
const controlPrompt = 'audit_software_development_non_blocking_show_submitted_prompt'

const optOut = { optOut: true, optInUnderstand: false, optOutUnderstand: true }
const optOutPromptKeys = ['project_management_opt_out_prompt', 'application_management_opt_out_prompt', 'help_desk_opt_out_prompt']
const applicantAnswers = new Map<string, Map<string, any>>([
  ['pre_qual_prompt', new Map([['pass', { gpa: 3.5, availability: true, acknowledgeExpectations: true }]])],
  ['pre_qual_user_info_prompt', new Map([['pass', { correct: true }]])],
  ['data_related_puzzle_prompt', new Map([['pass', { puzzleAnswer: 'Join the two tables on the shared key.' }]])],
  ['outside_class_example_prompt', new Map([['pass', { outsideClassExample: true, description: 'Built a scheduling app for a student club.' }]])],
  ['critical_thinking_prompt', new Map([['pass', { criticalThinkingAnswer: 'Profile first, then optimize the slowest query.' }]])],
  ['help_desk_weekend_availability_prompt', new Map([['pass', { weekendAvailable: true }]])],
  ['written_automation_prompt', new Map([['pass', { hasWrittenAutomation: true, writtenAutomation: 'A nightly backup script.' }]])],
  ['investigated_future_career_prompt', new Map([['pass', { interestInCareer: 'Keeping systems running.' }]])],
  // no multipart parts are sent, so preProcessData stores the upload info as-is
  ['reccomendation_letter_prompt', new Map([['pass', { reccomendationLetter: { _type: 'UploadInfo', multipartIndex: 0, name: 'letter.pdf', mime: 'application/pdf', size: 1024 } }]])]
])
const reviewerAnswers = new Map<string, Map<string, any>>([
  ['assess_data_related_puzzle_prompt', new Map([['pass', { score: 'Good' }]])],
  ['assess_outside_class_example_prompt', new Map([['pass', { showCriticalThinking: true, explanation: 'Clear example.' }]])],
  ['assess_critical_thinking_prompt', new Map([['pass', { realIssue: true, feasable: true }]])],
  ['assess_reccomendation_letter_prompt', new Map([['pass', { score: 'Good' }]])],
  ['verify_reccomendation_letter_prompt', new Map([['pass', { authentic: true, addressesTechnicalSkills: true, relationship: 'Professor' }]])],
  ['evidence_automation_prompt', new Map([['pass', { appropriateAutomation: true, comments: 'Sensible choice.' }]])],
  ['rate_future_career_prompt', new Map([['pass', { scoreInterestInCareer: 'Good' }]])]
])
const secondEyesAnswer = new Map([['reviewer_software_development_second_eyes_prompt', new Map([['pass', { score: 80 }]])]])
const finalAuditAnswers = new Map<string, Map<string, any>>([
  [controlPrompt, new Map([['pass', { ok: true }]])],
  ['audit_software_development_non_blocking_show_regular_prompt', new Map([['pass', { ok: true }]])],
  ['audit_software_development_non_blocking_show_regular_prompt2', new Map([['pass', { ok: true }]])]
])

/**
 * Advance every application a reviewer has to act on through blocking workflow, then complete the review. An
 * application screened out before submission (here, the opted-out programs) also sits at READY_FOR_WORKFLOW, but the
 * request does not wait for it: it reads REVIEW_COMPLETE as soon as the others are, and advancing is refused from then on.
 */
async function finishReview (graphql: Graphql, appRequestId: number) {
  for (let i = 0; i < 8; i++) {
    const state = await getState(graphql, appRequestId)
    const next = state.applications.find(a => a.phase === 'READY_FOR_WORKFLOW' && !['PREQUAL', 'QUALIFICATION'].includes(a.ineligiblePhase ?? ''))
    if (!next) break
    await expectAction(graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: next.id })
    await answerAvailable(graphql, appRequestId, secondEyesAnswer)
  }
  await expectAction(graphql, 'completeReview', requestAction('completeReview'), { appRequestId })
}

const auditPrompt = (state: State, requirementKey: string, promptKey: string) => requirement(state, swdev, requirementKey).prompts.find(p => p.key === promptKey)!
/** Either way the reviewer screen offers an edit: the pencil/dialog button, or the prompt's form rendered inline. */
const editControls = (promptId: number) => `#edit-btn-${promptId}, dd[role="group"][aria-labelledby="dt-title-${promptId}"]`

const markComplete = (page: Page) => page.getByRole('button', { name: 'Complete review', exact: true })
const reopen = (page: Page) => page.getByRole('button', { name: 'Edit review', exact: true })

test.describe.serial('Non-blocking workflow closes at its sunset phase or when its program is marked complete', { tag: '@rc' }, () => {
  let appRequestId = 0

  test('Applicant - apply to software development and operations & infrastructure, and submit', async ({ adminRequest, applicantRequest }) => {
    const { periods } = await adminRequest.graphql<{ periods: { id: string, code: string }[] }>('{ periods { id code } }')
    const periodId = periods.find(p => p.code === 'Period 2')?.id
    expect(periodId, 'the rc demo seeds period "Period 2" in testdata.ts').toBeTruthy()
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
    await answerAvailable(applicantRequest.graphql, appRequestId, applicantAnswers)
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

  test('Reviewer - answer the sunset stage while it is open, then finish the review', async ({ reviewerPage, reviewerRequest }) => {
    // the control stage is deliberately left unanswered
    await answerAvailable(reviewerRequest.graphql, appRequestId, new Map([[sunsetPrompt, new Map([['pass', { ok: true }]])]]))
    await answerAvailable(reviewerRequest.graphql, appRequestId, reviewerAnswers)
    const state = await getState(reviewerRequest.graphql, appRequestId)
    expect(requirement(state, swdev, sunsetRequirement).status).toEqual('MET')
    for (const key of [swdev, ops]) expect(application(state, key).phase, key).toEqual('READY_FOR_WORKFLOW')
    // advancing a stage is offered as "Mark complete", whatever stage comes next
    await reviewerPage.goto(`/requests/${appRequestId}/approve/${swdev}`)
    await expect(reviewerPage.getByRole('button', { name: 'Mark complete', exact: true })).toHaveCount(1)
    await expect(reviewerPage.getByRole('button', { name: /^Send to/ })).toHaveCount(0)

    // only software development has non-blocking workflow still open in the non-blocking phase
    const { appRequests } = await reviewerRequest.graphql<{ appRequests: { applications: { programKey: string, completesAfterNonBlocking: boolean }[] }[] }>(
      'query ($ids: [ID!]) { appRequests(filter: { ids: $ids }) { applications { programKey completesAfterNonBlocking } } }', { ids: [appRequestId] })
    const completesAfterNonBlocking = (key: string) => appRequests[0].applications.find(a => a.programKey === key)!.completesAfterNonBlocking
    expect(completesAfterNonBlocking(swdev)).toEqual(true)
    expect(completesAfterNonBlocking(ops)).toEqual(false)

    // so operations & infrastructure has nothing after review: its last "Mark complete" is the panel's "Complete review",
    // and "Edit review" takes it back
    await reviewerPage.goto(`/requests/${appRequestId}/approve/${ops}`)
    await expect(reviewerPage.getByText('review is ready to complete.')).toBeVisible()
    await expect(reviewerPage.getByRole('button', { name: 'Mark complete', exact: true })).toHaveCount(0)
    await markComplete(reviewerPage).click()
    await expect(reopen(reviewerPage)).toHaveCount(1)
    await expect(markComplete(reviewerPage)).toHaveCount(0)
    expect(application(await getState(reviewerRequest.graphql, appRequestId), ops).phase).toEqual('REVIEW_COMPLETE')
    await reopen(reviewerPage).click()
    await expect(markComplete(reviewerPage)).toBeEnabled()
    expect(application(await getState(reviewerRequest.graphql, appRequestId), ops).phase).toEqual('READY_FOR_WORKFLOW')
    await finishReview(reviewerRequest.graphql, appRequestId)
    expect((await getState(reviewerRequest.graphql, appRequestId)).phase).toEqual('WORKFLOW_NONBLOCKING')
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
    // the open stage's audits are unanswered, so the completion panel says so and offers nothing to click
    await expect(reviewerPage.getByText('review is not ready to complete.')).toBeVisible()
    await expect(markComplete(reviewerPage)).toBeDisabled()
  })

  test('Reviewer - a program whose non-blocking stages have all sunset completes on its own, with nothing to mark or reopen', async ({ reviewerPage, reviewerRequest }) => {
    const state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, ops).phase).toEqual('COMPLETE')
    expect(application(state, ops).actions.completeApplication).toEqual(false)
    expect(application(state, ops).actions.reopenApplication).toEqual(false)
    await expectRefused(reviewerRequest.graphql, 'reopenApplication', applicationAction('reopenApplication'), { applicationId: application(state, ops).id })
    // software development still has open stages with unanswered audits
    expect(application(state, swdev).phase).toEqual('WORKFLOW_NONBLOCKING')
    expect(application(state, swdev).actions.completeApplication).toEqual(false)

    await reviewerPage.goto(`/requests/${appRequestId}/approve/${ops}`)
    await expect(reviewerPage.getByText('Reviewer Actions')).toBeVisible()
    await expect(reviewerPage.getByText('Override GPA Warning').first()).toBeVisible()
    // it reads as complete, with neither action offered
    await expect(reviewerPage.getByText('is complete', { exact: false }).first()).toBeVisible()
    await expect(markComplete(reviewerPage)).toHaveCount(0)
    await expect(reopen(reviewerPage)).toHaveCount(0)
  })

  test('Reviewer - returning the request to review, before the sunset phase, makes the stage editable again', async ({ reviewerRequest }) => {
    await expectAction(reviewerRequest.graphql, 'returnToReview', requestAction('returnToReview'), { appRequestId })
    let state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.phase).toEqual('SUBMITTED')
    const sunset = auditPrompt(state, sunsetRequirement, sunsetPrompt)
    expect(sunset.actions.update, sunsetPrompt).toEqual(true)
    await expectAction(reviewerRequest.graphql, 'updatePrompt', updatePromptMutation, { promptId: sunset.id, data: { ok: false } })

    await finishReview(reviewerRequest.graphql, appRequestId)
    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.phase).toEqual('WORKFLOW_NONBLOCKING')
    expect(application(state, ops).phase).toEqual('COMPLETE')
  })

  test('Reviewer - once the open audits are answered the program can be marked complete, which locks them and leaves the request waiting', async ({ reviewerPage, reviewerRequest }) => {
    await answerAvailable(reviewerRequest.graphql, appRequestId, finalAuditAnswers)
    let state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, swdev).phase).toEqual('READY_TO_COMPLETE')
    expect(application(state, swdev).actions.completeApplication).toEqual(true)
    // ready is not marked: the answers are still editable and the request cannot complete yet
    const control = auditPrompt(state, controlRequirement, controlPrompt)
    expect(control.actions.update).toEqual(true)
    expect(state.actions.completeRequest).toEqual(false)

    await reviewerPage.goto(`/requests/${appRequestId}/approve/${swdev}`)
    await expect(reviewerPage.locator(editControls(control.id))).toHaveCount(1)
    await expect(reopen(reviewerPage)).toHaveCount(0)
    await expect(reviewerPage.getByText('review is ready to complete.')).toBeVisible()
    await expect(markComplete(reviewerPage)).toBeEnabled()
    await markComplete(reviewerPage).click()

    await expect(reopen(reviewerPage)).toHaveCount(1)
    await expect(markComplete(reviewerPage)).toHaveCount(0)
    await expect(reviewerPage.locator(`#dt-title-${control.id}`)).toHaveCount(1)
    await expect(reviewerPage.locator(editControls(control.id))).toHaveCount(0)

    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, swdev).phase).toEqual('COMPLETE')
    expect(auditPrompt(state, controlRequirement, controlPrompt).actions.update).toEqual(false)
    await expectRefused(reviewerRequest.graphql, 'updatePrompt', updatePromptMutation, { promptId: control.id, data: { ok: false } })
    // marking the last program complete does not complete the request, it only makes that possible
    expect(state.phase).toEqual('WORKFLOW_NONBLOCKING')
    expect(state.actions.completeRequest).toEqual(true)
  })

  test('Reviewer - reopening the program unlocks only the stages that have not sunset', async ({ reviewerPage, reviewerRequest }) => {
    await reviewerPage.goto(`/requests/${appRequestId}/approve/${swdev}`)
    await reopen(reviewerPage).click()
    await expect(markComplete(reviewerPage)).toBeEnabled()

    const state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, swdev).phase).toEqual('READY_TO_COMPLETE')
    const control = auditPrompt(state, controlRequirement, controlPrompt)
    const sunset = auditPrompt(state, sunsetRequirement, sunsetPrompt)
    expect(control.actions.update).toEqual(true)
    expect(sunset.actions.update).toEqual(false)
    expect(state.actions.completeRequest).toEqual(false)
    await expect(reviewerPage.locator(editControls(control.id))).toHaveCount(1)
    await expect(reviewerPage.locator(editControls(sunset.id))).toHaveCount(0)
  })

  test('Reviewer - with every program complete the request completes and everything stays locked', async ({ reviewerRequest }) => {
    let state = await getState(reviewerRequest.graphql, appRequestId)
    await expectAction(reviewerRequest.graphql, 'completeApplication', applicationAction('completeApplication'), { applicationId: application(state, swdev).id })
    await expectAction(reviewerRequest.graphql, 'completeRequest', requestAction('completeRequest'), { appRequestId })
    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.phase).toEqual('COMPLETE')
    for (const app of state.applications) expect(app.actions.reopenApplication, app.programKey).toEqual(false)
    expect(auditPrompt(state, controlRequirement, controlPrompt).actions.update).toEqual(false)
  })
})
