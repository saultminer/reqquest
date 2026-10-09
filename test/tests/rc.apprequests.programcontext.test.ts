import { DateTime } from 'luxon'
import { expect, test } from './fixtures.js'
import { answerAvailable, application, getState, requirement, type Graphql } from './complex.flow.js'

/**
 * A requirement shared by several programs normally resolves identically in each. weekend_coverage_req is shared by
 * operations_infrastructure and application_management_support and asks the program selector for the program key when
 * the applicant has no weekend availability, so the same answer is DISQUALIFYING in one and WARNING in the other.
 *
 * The prompt it reads, help_desk_weekend_availability_prompt, is also help_desk_associate's own, so it is answered once
 * and shows up once: AVAILABLE where it was first reached, REQUEST_DUPE everywhere else.
 */
const prequalPass = new Map<string, Map<string, any>>([
  ['pre_qual_prompt', new Map([['pass', { gpa: 3.5, availability: true, acknowledgeExpectations: true }]])],
  ['pre_qual_user_info_prompt', new Map([['pass', { correct: true }]])]
])
const noWeekends = new Map([...prequalPass, ['help_desk_weekend_availability_prompt', new Map([['fail', { weekendAvailable: false }]])]])
const weekends = new Map([...prequalPass, ['help_desk_weekend_availability_prompt', new Map([['pass', { weekendAvailable: true }]])]])
const weekendRequirementPrograms = ['operations_infrastructure', 'application_management_support']

// an applicant may only hold one request per period and the seeded period belongs to the program list spec, so this spec opens its own
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

async function createRequest (graphql: Graphql, login: string, periodId: string) {
  const { createAppRequest } = await graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(`
    mutation ($login: String!, $periodId: ID!) {
      createAppRequest(login: $login, periodId: $periodId, validateOnly: false) { appRequest { id } messages { message } }
    }
  `, { login, periodId })
  expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
  return createAppRequest.appRequest!.id
}

test.describe.serial('Shared requirement with program context', { tag: '@rc' }, () => {
  let periodId = ''

  test('Admin - open a period for this spec', async ({ adminRequest }) => {
    periodId = await createPeriod(adminRequest.graphql, '2025 program context', 'PROGRAM_CONTEXT')
    expect(periodId).toBeTruthy()
  })

  test('No weekend availability disqualifies in one program and warns in the other', async ({ applicantRequest }) => {
    const appRequestId = await createRequest(applicantRequest.graphql, 'applicant', periodId)
    await answerAvailable(applicantRequest.graphql, appRequestId, noWeekends)
    const state = await getState(applicantRequest.graphql, appRequestId)

    const ops = requirement(state, 'operations_infrastructure', 'weekend_coverage_req')
    const ams = requirement(state, 'application_management_support', 'weekend_coverage_req')
    expect(ops.status).toEqual('DISQUALIFYING')
    expect(ams.status).toEqual('WARNING')
    expect(application(state, 'operations_infrastructure').ineligiblePhase).toEqual('QUALIFICATION')
    expect(application(state, 'application_management_support').ineligiblePhase).toBeNull()

    // the shared prompt is asked once; programs are evaluated in declared order so operations reaches it first
    const instances = state.applications.flatMap(a => a.requirements.flatMap(r => r.prompts.filter(p => p.key === 'help_desk_weekend_availability_prompt').map(p => ({ programKey: a.programKey, visibility: p.visibility }))))
    expect(instances.filter(i => i.visibility === 'AVAILABLE').map(i => i.programKey)).toEqual(['operations_infrastructure'])
    expect(instances.filter(i => i.visibility === 'REQUEST_DUPE').map(i => i.programKey).sort()).toEqual(['application_management_support', 'help_desk_associate'])
  })

  test('Weekend availability resolves the shared requirement identically everywhere, and the pure shared requirement always does', async ({ applicant2Request }) => {
    const appRequestId = await createRequest(applicant2Request.graphql, 'applicant2', periodId)
    await answerAvailable(applicant2Request.graphql, appRequestId, weekends)
    const state = await getState(applicant2Request.graphql, appRequestId)

    for (const programKey of weekendRequirementPrograms) expect(requirement(state, programKey, 'weekend_coverage_req').status, programKey).toEqual('MET')
    // step1_prequal_req never reads program context: one evaluation, five identical rows
    const prequalStatuses = state.applications.map(a => requirement(state, a.programKey, 'step1_prequal_req').status)
    expect(prequalStatuses).toHaveLength(5)
    expect(new Set(prequalStatuses)).toEqual(new Set(['MET']))
  })
})
