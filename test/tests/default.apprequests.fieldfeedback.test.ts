import { DateTime } from 'luxon'
import { expect, test } from './fixtures.js'
import { answerAvailable, getState, requirement, type Graphql } from './complex.flow.js'
import { promptMapApplicantQualified } from './default.promptdata.js'

/**
 * A requirement's `resolve` can blame individual form fields, each with its own helper message and its own
 * presentation status. That result has to reach the form two ways and agree with itself: immediately, from a
 * validateOnly call that evaluates the unsaved answer without storing anything, and after a save, from what the
 * evaluation persisted.
 *
 * The default demo's cat tower requirement is the subject: answering "no tower, will not buy one" disqualifies,
 * with a WARNING message on `haveCatTower` and a message on `willPurchaseCatTower` that takes the requirement's
 * DISQUALIFYING status.
 */
const cat = 'adopt_a_cat_program'
const towerPrompt = 'have_a_cat_tower_prompt'
const towerRequirement = 'have_a_cat_tower_req'
const overallReason = 'Must own a cat tower or be willing to purchase one.'
const haveTowerMessage = 'Adopting a cat requires a cat tower.'
const willPurchaseMessage = 'Without a cat tower, you must agree to purchase one.'

type FieldReason = { fields: string[], message: string | null, status: string | null }
type StatusReason = { status: string, statusReason: string | null, programName: string, blamed: boolean, fieldReasons: FieldReason[] }
type UpdateResponse = { updatePrompt: { success: boolean, messages: { message: string, type: string, arg: string | null }[], statusReasons: StatusReason[] | null } }

const updatePrompt = `
  mutation UpdatePrompt($promptId: ID!, $data: JsonData!, $validateOnly: Boolean!) {
    updatePrompt(promptId: $promptId, data: $data, validateOnly: $validateOnly) {
      success
      messages { message type arg }
      statusReasons { status statusReason programName blamed fieldReasons { fields message status } }
    }
  }
`
const persistedBlame = `
  query ($ids: [ID!]) {
    appRequests(filter: { ids: $ids }) {
      applications { programKey requirements { key status statusReason blame blameFields { promptKey fields message status } } }
    }
  }
`

async function send (graphql: Graphql, promptId: number, data: any, validateOnly: boolean) {
  const response = await graphql<UpdateResponse & { errors?: { message: string }[] }>(updatePrompt, { promptId, data, validateOnly })
  expect(response.errors, JSON.stringify(response.errors)).toBeUndefined()
  return response.updatePrompt
}

async function towerOnFile (graphql: Graphql, appRequestId: number) {
  const { appRequests } = await graphql<{ appRequests: { applications: { programKey: string, requirements: { key: string, status: string, statusReason: string | null, blame: string[] | null, blameFields: { promptKey: string, fields: string[] | null, message: string | null, status: string | null }[] | null }[] }[] }[] }>(persistedBlame, { ids: [appRequestId] })
  return appRequests[0].applications.find(a => a.programKey === cat)!.requirements.find(r => r.key === towerRequirement)!
}

const towerReason = (reasons: StatusReason[] | null) => (reasons ?? []).find(r => r.statusReason === overallReason)

test.describe.serial('App Request - requirement feedback on individual form fields', { tag: '@default' }, () => {
  let appRequestId = 0
  let towerPromptId = 0
  let otherCatsPromptId = 0

  test('Set up a request that has reached the cat tower prompt', async ({ suRequest, applicantRequest }) => {
    const closeDate = DateTime.now().plus({ days: 1 }).setZone('America/Chicago').set({ millisecond: 0 }).toISO()
    const { createPeriod } = await suRequest.graphql<{ createPeriod: { period: { id: number } } }>(`
      mutation ($closeDate: DateTime!) {
        createPeriod(period: { name: "2025 field feedback", code: "FIELD_FEEDBACK", openDate: "2025-07-01T00:00:00.000-05:00", closeDate: $closeDate }, validateOnly: false) { period { id } }
      }
    `, { closeDate })
    const periodId = createPeriod.period.id
    await suRequest.graphql('mutation ($periodId: ID!) { markPeriodReviewed(periodId: $periodId) { period { id } } }', { periodId })

    const { createAppRequest } = await applicantRequest.graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(`
      mutation ($periodId: ID!) { createAppRequest(login: "applicant", periodId: $periodId, validateOnly: false) { appRequest { id } messages { message } } }
    `, { periodId })
    expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
    appRequestId = createAppRequest.appRequest!.id

    // answer everything except the two prompts this spec drives by hand
    const others = new Map(promptMapApplicantQualified)
    others.delete(towerPrompt)
    others.delete('other_cats_prompt')
    await answerAvailable(applicantRequest.graphql, appRequestId, others)

    const state = await getState(applicantRequest.graphql, appRequestId)
    const tower = requirement(state, cat, towerRequirement).prompts.find(p => p.key === towerPrompt)!
    expect(tower.visibility).toEqual('AVAILABLE')
    towerPromptId = tower.id
    otherCatsPromptId = state.applications.flatMap(a => a.requirements).flatMap(r => r.prompts).find(p => p.key === 'other_cats_prompt')!.id
  })

  test('validateOnly returns per-field feedback for the unsaved answer and stores nothing', async ({ applicantRequest }) => {
    const response = await send(applicantRequest.graphql, towerPromptId, { haveCatTower: false, willPurchaseCatTower: false }, true)
    const reason = towerReason(response.statusReasons)
    expect(reason, JSON.stringify(response.statusReasons)).toBeDefined()
    expect(reason!.status).toEqual('DISQUALIFYING')
    expect(reason!.blamed).toEqual(true)
    // one overall reason, and each blamed field keeps its own message; a field status is presentation only
    expect(reason!.fieldReasons).toEqual([
      { fields: ['haveCatTower'], message: haveTowerMessage, status: 'WARNING' },
      { fields: ['willPurchaseCatTower'], message: willPurchaseMessage, status: null }
    ])

    const onFile = await towerOnFile(applicantRequest.graphql, appRequestId)
    expect(onFile.status).toEqual('PENDING')
    expect(onFile.blame).toBeNull()
    expect(onFile.blameFields).toBeNull()
  })

  test('validateOnly follows the answer as it changes', async ({ applicantRequest }) => {
    const passing = await send(applicantRequest.graphql, towerPromptId, { haveCatTower: true }, true)
    expect(towerReason(passing.statusReasons)).toBeUndefined()
    expect(passing.statusReasons!.some(r => r.status === 'DISQUALIFYING')).toEqual(false)
  })

  test('validateOnly evaluates the answer as typed, validation errors or not', async ({ applicantRequest }) => {
    // "no tower" with the purchase question untouched fails validation, and the requirement is still consulted:
    // it reports PENDING rather than being skipped, so nothing blocks feedback on a half-finished form
    const response = await send(applicantRequest.graphql, towerPromptId, { haveCatTower: false }, true)
    expect(response.messages.some(m => m.type === 'error' && m.arg === 'willPurchaseCatTower')).toEqual(true)
    expect(response.statusReasons).not.toBeNull()
    expect(towerReason(response.statusReasons)).toBeUndefined()
  })

  test('An applicant is not shown what a reviewer requirement says about their answer', async ({ applicantRequest }) => {
    const response = await send(applicantRequest.graphql, otherCatsPromptId, { hasOtherCats: true }, true)
    expect(response.statusReasons).not.toBeNull()
    expect(response.statusReasons!.some(r => r.statusReason?.includes('Reviewer must assess'))).toEqual(false)
  })

  test('The form shows the feedback under the fields before anything is saved', async ({ applicantPage, applicantRequest }) => {
    await applicantPage.goto(`/requests/${appRequestId}/apply/${towerPromptId}`)
    await applicantPage.getByText('No', { exact: true }).click()
    await expect(applicantPage.getByText(haveTowerMessage)).toBeVisible()
    expect((await towerOnFile(applicantRequest.graphql, appRequestId)).status).toEqual('PENDING')

    // saving shows every field's message and the overall reason, and does not get in the way of the save itself
    await applicantPage.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(applicantPage.getByText(willPurchaseMessage)).toBeVisible()
    await expect(applicantPage.getByText(haveTowerMessage)).toBeVisible()
    await expect(applicantPage.getByText(overallReason).first()).toBeVisible()
  })

  test('Saving persists the same feedback', async ({ applicantRequest }) => {
    const onFile = await towerOnFile(applicantRequest.graphql, appRequestId)
    expect(onFile.status).toEqual('DISQUALIFYING')
    expect(onFile.statusReason).toEqual(overallReason)
    expect(onFile.blame).toEqual([towerPrompt])
    expect(onFile.blameFields).toEqual([
      { promptKey: towerPrompt, fields: ['haveCatTower'], message: haveTowerMessage, status: 'WARNING' },
      { promptKey: towerPrompt, fields: ['willPurchaseCatTower'], message: willPurchaseMessage, status: null }
    ])

    // a save reports the same thing a dry run of the same answer did
    const saved = await send(applicantRequest.graphql, towerPromptId, { haveCatTower: false, willPurchaseCatTower: false }, false)
    expect(saved.success).toEqual(true)
    expect(towerReason(saved.statusReasons)?.fieldReasons.map(f => f.message)).toEqual([haveTowerMessage, willPurchaseMessage])
  })
})
