import { expect, test } from './fixtures.js'
import { answerAvailable, application, getState, requirement, updatePromptMutation, type Graphql } from './complex.flow.js'

/**
 * Which programs an rc applicant sees, and what each row says, as eligibility is settled before submission:
 *
 * - project_management sets showIneligiblePreSubmit: false, so once the applicant is ruled out of it before submitting
 *   it is flagged hidden for the applicant, left out of their program list, and never handed to a reviewer.
 * - a program the applicant was ruled out of by an applicant requirement shows its description; one they opted out of
 *   does not, since the description explains eligibility and opting out is the applicant's own choice.
 * - help_desk_associate has no reviewer, acceptance or workflow requirements, so it completes as soon as the request
 *   is submitted.
 *
 * In rc every program includes step1_prequal_req, so a GPA under the 2.5 minimum rules the applicant out of all of them.
 */
const opsDescription = 'Requires operation infrastructure knowledge'
const optOut = { optOut: true, optInUnderstand: false, optOutUnderstand: true }
const lowGpa = new Map<string, Map<string, any>>([
  ['pre_qual_prompt', new Map([['fail', { gpa: 2.0, availability: true, acknowledgeExpectations: true }]])],
  ['pre_qual_user_info_prompt', new Map([['pass', { correct: true }]])]
])
const helpDeskQualified = new Map<string, Map<string, any>>([
  ['pre_qual_prompt', new Map([['pass', { gpa: 3.5, availability: true, acknowledgeExpectations: true }]])],
  ['pre_qual_user_info_prompt', new Map([['pass', { correct: true }]])],
  ['help_desk_weekend_availability_prompt', new Map([['pass', { weekendAvailable: true }]])],
  ['help_desk_customer_service_prompt', new Map([['pass', { describeCustomerService: 'Walked a user through resetting their VPN profile.' }]])]
])
// every program but help desk; their opt-out requirements start NOT_APPLICABLE, so answerAvailable never sends them
const optOutPromptKeys = ['operations_infrastructure_opt_out_prompt', 'software_dev_opt_out_prompt', 'project_management_opt_out_prompt', 'application_management_opt_out_prompt']

type ListedApplication = { programKey: string, status: string, ineligiblePhase: string | null, hiddenIneligiblePreSubmit: boolean }
async function listedApplications (graphql: Graphql, appRequestId: number) {
  const response = await graphql<{ appRequests?: { applications: ListedApplication[] }[], errors?: { message: string }[] }>(`
    query ($ids: [ID!]) { appRequests(filter: { ids: $ids }) { applications { programKey status ineligiblePhase hiddenIneligiblePreSubmit } } }
  `, { ids: [appRequestId] })
  if (!response.appRequests) throw new Error(`applications query failed: ${JSON.stringify(response.errors)}`)
  return response.appRequests[0].applications
}

async function createRequest (graphql: Graphql, login: string, periodId: string) {
  const { createAppRequest } = await graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(`
    mutation ($login: String!, $periodId: ID!) {
      createAppRequest(login: $login, periodId: $periodId, validateOnly: false) { appRequest { id } messages { message } }
    }
  `, { login, periodId })
  expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
  return createAppRequest.appRequest!.id
}

test.describe.serial('Applicant program list - hidden, opted-out and auto-completed programs', { tag: '@rc' }, () => {
  let periodId = ''
  let lowGpaId = 0
  let helpDeskId = 0

  test('Admin - find the open period', async ({ adminRequest }) => {
    const { periods } = await adminRequest.graphql<{ periods: { id: string, code: string }[] }>('{ periods { id code } }')
    periodId = periods.find(p => p.code === 'Period 1')!.id
    expect(periodId).toBeTruthy()
  })

  test('Applicant - a low GPA flags project_management hidden and leaves the other programs listed', async ({ applicantRequest }) => {
    lowGpaId = await createRequest(applicantRequest.graphql, 'applicant', periodId)
    await answerAvailable(applicantRequest.graphql, lowGpaId, lowGpa)
    const applications = await listedApplications(applicantRequest.graphql, lowGpaId)
    // the applicant still receives the hidden application, so they can change the answers that ruled them out
    const projectManagement = applications.find(a => a.programKey === 'project_management')
    expect(projectManagement).toBeDefined()
    expect(projectManagement!.ineligiblePhase).toEqual('PREQUAL')
    expect(projectManagement!.hiddenIneligiblePreSubmit).toEqual(true)
    for (const app of applications.filter(a => a.programKey !== 'project_management')) {
      expect(app.ineligiblePhase, app.programKey).toEqual('PREQUAL')
      expect(app.hiddenIneligiblePreSubmit, app.programKey).toEqual(false)
    }
  })

  test('Applicant - program list leaves out the hidden program and describes the ones ruled out', async ({ applicantPage }) => {
    await applicantPage.goto(`/requests/${lowGpaId}/apply/programs`)
    await expect(applicantPage.getByText('Software Development').first()).toBeVisible()
    await expect(applicantPage.getByText('Project Management')).toHaveCount(0)
    // ApplicantProgramList always renders its (css-hidden) .tooltip-text-row when it has descriptions to show
    await expect(applicantPage.locator('.tooltip-text-item', { hasText: opsDescription })).toHaveCount(1)
    // opting out of a program the applicant is already ineligible for means nothing, so none offer it
    await expect(applicantPage.getByRole('button', { name: 'Opt out', exact: true })).toHaveCount(0)
    await applicantPage.goto(`/requests/${lowGpaId}/export`)
    await expect(applicantPage.getByText(opsDescription).first()).toBeAttached()
    await expect(applicantPage.getByText(/^Exported \d{2}\/\d{2}\/\d{4} at \d{2}:\d{2}(AM|PM)$/)).toBeVisible()
    await expect(applicantPage.getByRole('button', { name: 'Print', exact: true })).toBeVisible()
  })

  test('Applicant 2 - help desk prompts resolve and the other programs are opted out', async ({ applicant2Request }) => {
    helpDeskId = await createRequest(applicant2Request.graphql, 'applicant2', periodId)
    await answerAvailable(applicant2Request.graphql, helpDeskId, helpDeskQualified)
    const before = await getState(applicant2Request.graphql, helpDeskId)
    for (const key of optOutPromptKeys) {
      const prompt = before.applications.flatMap(a => a.requirements.flatMap(r => r.prompts)).find(p => p.key === key)!
      const response = await applicant2Request.graphql<{ updatePrompt?: { success: boolean }, errors?: { message: string }[] }>(updatePromptMutation, { promptId: prompt.id, data: optOut })
      expect(response.errors, key).toBeUndefined()
      expect(response.updatePrompt!.success, key).toEqual(true)
    }
    const state = await getState(applicant2Request.graphql, helpDeskId)
    expect(requirement(state, 'help_desk_associate', 'help_desk_weekend_availability_req').status).toEqual('MET')
    expect(requirement(state, 'help_desk_associate', 'help_desk_customer_service_req').status).toEqual('MET')
    expect(application(state, 'help_desk_associate').ineligiblePhase).toBeNull()
    expect(requirement(state, 'operations_infrastructure', 'operations_infrastructure_opt_out_req').status).toEqual('DISQUALIFYING')
    expect(application(state, 'operations_infrastructure').ineligiblePhase).toEqual('QUALIFICATION')
    expect(state.status).toEqual('READY_TO_SUBMIT')
  })

  test('Applicant 2 - help desk prompt and review screens render registered components', async ({ applicant2Page, applicant2Request }) => {
    const state = await getState(applicant2Request.graphql, helpDeskId)
    const promptId = requirement(state, 'help_desk_associate', 'help_desk_weekend_availability_req').prompts[0].id
    await applicant2Page.goto(`/requests/${helpDeskId}/apply/${promptId}`)
    await expect(applicant2Page.getByText('Can you work at least one weekend shift per month?')).toBeVisible()
    await expect(applicant2Page.getByText(/No .* component is registered/)).toHaveCount(0)
    await applicant2Page.goto(`/requests/${helpDeskId}/apply/review`)
    await expect(applicant2Page.getByRole('button', { name: 'Submit application' })).toBeVisible()
    await expect(applicant2Page.getByText(/No .* component is registered/)).toHaveCount(0)
  })

  test('Applicant 2 - an opted-out program shows no description', async ({ applicant2Page }) => {
    await applicant2Page.goto(`/requests/${helpDeskId}/apply/programs`)
    await expect(applicant2Page.getByText('Operations & Infrastructure').first()).toBeVisible()
    await expect(applicant2Page.getByText('Opted out').first()).toBeVisible()
    await expect(applicant2Page.locator('.tooltip-text-item', { hasText: opsDescription })).toHaveCount(0)
    // the four opted-out programs offer to opt back in; help desk, still eligible, can still be opted out of
    await expect(applicant2Page.getByRole('button', { name: 'Opt In', exact: true })).toHaveCount(4)
    await expect(applicant2Page.getByRole('button', { name: 'Opt out', exact: true })).toHaveCount(1)
  })

  test('Applicant 2 - submit from the review page; help desk completes at submission', async ({ applicant2Page, applicant2Request }) => {
    await applicant2Page.goto(`/requests/${helpDeskId}/apply/review`)
    await applicant2Page.getByRole('button', { name: 'Submit application' }).click()
    await applicant2Page.waitForURL(/\/dashboards\/applicant/, { timeout: 20_000 })
    const state = await getState(applicant2Request.graphql, helpDeskId)
    // the only eligible program needs no review, so the whole request finishes on its own
    expect(state.status).toEqual('APPROVED')
    expect(application(state, 'help_desk_associate').phase).toEqual('COMPLETE')
    expect(application(state, 'help_desk_associate').status).toEqual('ELIGIBLE')
    for (const key of ['operations_infrastructure', 'software_development', 'project_management', 'application_management_support']) {
      expect(application(state, key).status, key).toEqual('INELIGIBLE')
    }
  })

  test('Reviewer - never receives the program hidden before submission', async ({ reviewerRequest }) => {
    const programKeys = (await listedApplications(reviewerRequest.graphql, helpDeskId)).map(a => a.programKey)
    expect(programKeys).not.toContain('project_management')
    expect(programKeys).toContain('help_desk_associate')
  })
})
