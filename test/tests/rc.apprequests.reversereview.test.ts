import { DateTime } from 'luxon'
import { expect, test } from './fixtures.js'
import { answerAvailable, application, applicationAction, expectAction, getState, requestAction, requirement, updatePromptMutation, type Graphql } from './complex.flow.js'

/**
 * A review that disqualified an application must still be reversible. Software Development's custom "Assessments"
 * panel holds every one of its review requirements, so when one of them is DISQUALIFYING that panel is the only place
 * the "Edit answers" button can land. It used to also require every requirement in the panel to be MET, which left a
 * disqualified review with no way back: after Return to review the request sat at the end of blocking workflow.
 */
const swdev = 'software_development'
const optOut = { optOut: true, optInUnderstand: false, optOutUnderstand: true }
const optOutPromptKeys = ['operations_infrastructure_opt_out_prompt', 'project_management_opt_out_prompt', 'application_management_opt_out_prompt', 'help_desk_opt_out_prompt']
const applicantAnswers = new Map<string, Map<string, any>>([
  ['pre_qual_prompt', new Map([['pass', { gpa: 3.5, availability: true, acknowledgeExpectations: true }]])],
  ['pre_qual_user_info_prompt', new Map([['pass', { correct: true }]])],
  ['future_communication_opt_in_prompt', new Map([['pass', { optIn: true }]])],
  ['data_related_puzzle_prompt', new Map([['pass', { puzzleAnswer: 'Join the two tables on the shared key.' }]])],
  ['outside_class_example_prompt', new Map([['pass', { outsideClassExample: true, description: 'Built a scheduling app for a student club.' }]])],
  ['critical_thinking_prompt', new Map([['pass', { criticalThinkingAnswer: 'Profile first, then optimize the slowest query.' }]])],
  // no multipart parts are sent, so preProcessData stores the upload info as-is
  ['reccomendation_letter_prompt', new Map([['pass', { reccomendationLetter: { _type: 'UploadInfo', multipartIndex: 0, name: 'letter.pdf', mime: 'application/pdf', size: 1024 } }]])]
])
const reviewerDisqualifyingAnswers = new Map<string, Map<string, any>>([
  ['assess_data_related_puzzle_prompt', new Map([['pass', { score: 'Good' }]])],
  ['assess_outside_class_example_prompt', new Map([['pass', { showCriticalThinking: true, explanation: 'Clear example.' }]])],
  ['assess_critical_thinking_prompt', new Map([['pass', { realIssue: true, feasable: true }]])],
  ['assess_reccomendation_letter_prompt', new Map([['pass', { score: 'Good' }]])],
  ['verify_reccomendation_letter_prompt', new Map([['fail', { authentic: false, addressesTechnicalSkills: true, relationship: 'Professor' }]])]
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

test.describe.serial('Reverse a disqualified review out of blocking workflow', { tag: '@rc' }, () => {
  let periodId = ''
  let appRequestId = 0

  test('Admin - open a period for this spec', async ({ adminRequest }) => {
    periodId = await createPeriod(adminRequest.graphql, '2025 reverse disqualified review', 'REVERSE_DISQUALIFIED')
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

  test('Reviewer - disqualify at review, pass the blocking stage, complete review and return to review', async ({ reviewerRequest }) => {
    await answerAvailable(reviewerRequest.graphql, appRequestId, reviewerDisqualifyingAnswers)
    let state = await getState(reviewerRequest.graphql, appRequestId)
    expect(requirement(state, swdev, 'verify_reccomendation_letter_req').status).toEqual('DISQUALIFYING')
    expect(application(state, swdev).phase).toEqual('READY_FOR_WORKFLOW')

    // a disqualified application still goes through blocking workflow
    await expectAction(reviewerRequest.graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: application(state, swdev).id })
    await answerAvailable(reviewerRequest.graphql, appRequestId, new Map([['reviewer_software_development_second_eyes_prompt', new Map([['pass', { score: 80 }]])]]))
    state = await getState(reviewerRequest.graphql, appRequestId)
    await expectAction(reviewerRequest.graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: application(state, swdev).id })
    await expectAction(reviewerRequest.graphql, 'completeReview', requestAction('completeReview'), { appRequestId })
    await expectAction(reviewerRequest.graphql, 'returnToReview', requestAction('returnToReview'), { appRequestId })

    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.phase).toEqual('SUBMITTED')
    // Return to review lands at the end of the last blocking stage, not straight back in review
    expect(application(state, swdev).phase).toEqual('READY_FOR_WORKFLOW')
    expect(application(state, swdev).workflowStage?.key).toEqual('software_development_blocking_second_eyes')
  })

  test('Reviewer - "Edit answers" is offered once despite the disqualification and reopens review', async ({ reviewerPage, reviewerRequest }) => {
    await reviewerPage.goto(`/requests/${appRequestId}/approve/${swdev}`)
    const editAnswers = reviewerPage.getByRole('button', { name: 'Edit answers' })
    await expect(editAnswers).toHaveCount(1)
    await editAnswers.click()
    // reversal re-evaluates, and with every review requirement already resolved the application settles at the end of
    // review (READY_FOR_WORKFLOW with no stage) rather than APPROVAL - out of the blocking stage, back in review
    await expect.poll(async () => application(await getState(reviewerRequest.graphql, appRequestId), swdev).workflowStage?.key ?? null).toBeNull()
    const state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, swdev).phase).toEqual('READY_FOR_WORKFLOW')

    // back in review, the applicant's letter can be edited again with the pencil
    const letterPrompt = requirement(state, swdev, 'reccomendation_letter_req').prompts.find(p => p.key === 'reccomendation_letter_prompt')!
    await expect(reviewerPage.locator(`#edit-btn-${letterPrompt.id}`)).toBeVisible()
  })

  test('Reviewer - Export in Reviewer Actions prints the reviewer export without leaving the review screen', async ({ reviewerPage }) => {
    const reviewUrl = `/requests/${appRequestId}/approve/${swdev}`
    await reviewerPage.goto(reviewUrl)
    // a real print dialog would block the page, so record the call instead
    await reviewerPage.evaluate(() => { window.print = () => { (window as any).printCalls = ((window as any).printCalls ?? 0) + 1 } })
    await reviewerPage.getByRole('button', { name: 'export', exact: true }).click()
    await expect.poll(async () => await reviewerPage.evaluate(() => (window as any).printCalls)).toEqual(1)
    expect(new URL(reviewerPage.url()).pathname).toEqual(reviewUrl)

    const exportView = reviewerPage.locator('.rq-print-root .application-details')
    const reviewerActions = reviewerPage.getByText('Reviewer Actions')
    await expect(exportView).toBeHidden()
    await reviewerPage.emulateMedia({ media: 'print' })
    try {
      await expect(exportView).toBeVisible()
      // '{applicant}, {period} {appRequest word}'; no request number while it is the applicant's only request in the period
      await expect(exportView.getByRole('heading', { name: /^\S.*, 2025 reverse disqualified review [A-Za-z]+$/ })).toBeVisible()
      await expect(exportView.getByText(/^Complete \S+ details for review\.$/)).toBeVisible()
      await expect(reviewerActions).toBeHidden()

      await reviewerPage.evaluate(() => window.dispatchEvent(new Event('afterprint')))
      await expect(exportView).toHaveCount(0)
      await expect(reviewerActions).toBeVisible()
    } finally {
      await reviewerPage.emulateMedia({ media: null })
    }
  })
})
