import { expect } from './fixtures.js'
import { promptMapApplicantQualified, promptMapApproveReviewerQualified } from './complex.promptdata.js'

/**
 * Helpers for driving a complex-demo request through the API: read its state, answer whatever prompts are open,
 * submit, and walk it through blocking workflow. Shared by the complex app-request specs.
 */
export type Graphql = <T = any>(query: string, variables?: Record<string, any>) => Promise<T>
export type Prompt = { id: number, key: string, answered: boolean, visibility: string, actions: { update: boolean } }
export type Requirement = { key: string, type: string, status: string, prompts: Prompt[] }
export type Actions = { rescindApplication: boolean, restoreApplication: boolean, completeApplication: boolean, reopenApplication: boolean }
export type Application = { id: string, programKey: string, phase: string, status: string, ineligiblePhase: string | null, workflowStage: { key: string } | null, rescindedStatus: string | null, rescindedReason: string | null, restoredReason: string | null, actions: Actions, requirements: Requirement[] }
export type State = { phase: string, status: string, actions: { completeRequest: boolean }, applications: Application[] }

export const stateQuery = `
  query ComplexRequestState($ids: [ID!]) {
    appRequests(filter: { ids: $ids }) {
      phase status actions { completeRequest }
      applications {
        id programKey phase status ineligiblePhase workflowStage { key } rescindedStatus rescindedReason restoredReason
        actions { rescindApplication restoreApplication completeApplication reopenApplication }
        requirements { key type status prompts { id key answered visibility actions { update } } }
      }
    }
  }
`
export async function getState (graphql: Graphql, appRequestId: number): Promise<State> {
  const response = await graphql<{ appRequests: State[], errors?: { message: string }[] }>(stateQuery, { ids: [appRequestId] })
  if (!response.appRequests) throw new Error(`state query failed: ${JSON.stringify(response.errors)}`)
  return response.appRequests[0]
}
export const application = (state: State, programKey: string) => state.applications.find(a => a.programKey === programKey)!
export const requirement = (state: State, programKey: string, key: string) => application(state, programKey).requirements.find(r => r.key === key)!

export const updatePromptMutation = `
  mutation UpdatePrompt($promptId: ID!, $data: JsonData!) {
    updatePrompt(promptId: $promptId, data: $data, validateOnly: false) { success messages { message arg } }
  }
`
/**
 * Answer every AVAILABLE prompt of a still-PENDING requirement that the map knows, repeating because each answer
 * reveals the next prompts. Keyed on what this run has sent rather than the API's `answered` flag: a prompt with no
 * validation rules (the movie-lover review) reads as answered before it holds any data, and a prompt shared by programs
 * is one answer. The PENDING filter keeps it from re-sending a prompt whose requirement has already resolved - a
 * passed blocking stage locks its prompt, and the API refuses the update.
 */
export async function answerAvailable (graphql: Graphql, appRequestId: number, answers: Map<string, Map<string, any>>) {
  const sent = new Set<string>()
  for (let i = 0; i <= answers.size; i++) {
    const state = await getState(graphql, appRequestId)
    const available = state.applications.flatMap(a => a.requirements.filter(r => r.status === 'PENDING').flatMap(r => r.prompts.filter(p => p.visibility === 'AVAILABLE' && answers.has(p.key) && !sent.has(p.key))))
    if (!available.length) return
    for (const prompt of available) {
      if (sent.has(prompt.key)) continue
      sent.add(prompt.key)
      for (const value of answers.get(prompt.key)!.values()) {
        const response = await graphql<{ updatePrompt?: { success: boolean, messages: { message: string }[] }, errors?: { message: string }[] }>(updatePromptMutation, { promptId: prompt.id, data: value })
        expect(response.errors, `${prompt.key}: ${JSON.stringify(response.errors)}`).toBeUndefined()
        expect(response.updatePrompt!.success, `${prompt.key}: ${response.updatePrompt!.messages.map(m => m.message).join('; ')}`).toEqual(true)
      }
    }
  }
}

export const requestAction = (name: string) => `mutation ($appRequestId: ID!) { ${name}(appRequestId: $appRequestId) { success messages { message } } }`
export const applicationAction = (name: string) => `mutation ($applicationId: ID!) { ${name}(applicationId: $applicationId) { success messages { message } } }`
/** The fixture hands back `{ data, errors }` instead of `data` when the API refuses, so both shapes are checked. */
export async function expectAction (graphql: Graphql, name: string, mutation: string, variables: Record<string, any>) {
  const response = await graphql<any>(mutation, variables)
  expect(response.errors, `${name}: ${JSON.stringify(response.errors)}`).toBeUndefined()
  expect(response[name].success, `${name}: ${response[name].messages.map((m: { message: string }) => m.message).join('; ')}`).toEqual(true)
}
export async function expectRefused (graphql: Graphql, name: string, mutation: string, variables: Record<string, any>) {
  const response = await graphql<any>(mutation, variables)
  expect(response.errors ?? [], `${name} should have been refused`).not.toHaveLength(0)
}

/**
 * The API caches which periods carry acceptance and non-blocking workflow (util/auth.ts) and only refreshes on the
 * cache's own clock, so a period created by a spec would still read as having neither and completeReview would skip
 * straight to COMPLETE. The demo's seeded period has been in that cache since startup, and no other spec uses it.
 */
export async function seededPeriodId (graphql: Graphql) {
  const { periods } = await graphql<{ periods: { id: number, code: string }[] }>('{ periods { id code } }')
  const seeded = periods.find(period => period.code === '2025 Sem 1')
  expect(seeded, 'the complex demo seeds period "2025 Sem 1" in testdata.ts').toBeDefined()
  return seeded!.id
}

/** Create a request for `login`, qualify for every program and submit it. Returns the request id. */
export async function submitQualifiedRequest (graphql: Graphql, login: string, periodId: number) {
  const create = `
    mutation CreateAppRequest($login: String!, $periodId: ID!) {
      createAppRequest(login: $login, periodId: $periodId, validateOnly: false) { appRequest { id } messages { message } }
    }
  `
  const { createAppRequest } = await graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(create, { login, periodId })
  expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
  const appRequestId = createAppRequest.appRequest!.id
  await answerAvailable(graphql, appRequestId, promptMapApplicantQualified)
  await expectAction(graphql, 'submitAppRequest', requestAction('submitAppRequest'), { appRequestId })
  const state = await getState(graphql, appRequestId)
  expect(state.phase).toEqual('SUBMITTED')
  for (const app of state.applications) expect(app.status, app.programKey).toEqual('PENDING')
  return appRequestId
}

/**
 * Walk every READY_FOR_WORKFLOW application through its blocking stages: dog and foster each have one (a denied
 * application is not exempt from it), cat has none and goes straight to REVIEW_COMPLETE.
 */
export async function finishBlockingWorkflow (graphql: Graphql, appRequestId: number) {
  for (let i = 0; i < 4; i++) {
    const state = await getState(graphql, appRequestId)
    const advancing = state.applications.filter(a => a.phase === 'READY_FOR_WORKFLOW')
    if (!advancing.length) break
    // waiting on or in blocking workflow reads as in review
    expect(state.status).toEqual('REVIEW_IN_PROGRESS')
    for (const app of advancing) await expectAction(graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: app.id })
    await answerAvailable(graphql, appRequestId, promptMapApproveReviewerQualified)
  }
  const state = await getState(graphql, appRequestId)
  for (const app of state.applications) expect(app.phase, app.programKey).toEqual('REVIEW_COMPLETE')
  expect(state.status).toEqual('REVIEW_COMPLETE')
}
