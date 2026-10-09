import { DateTime } from 'luxon'
import { expect, test } from './fixtures.js'
import { answerAvailable, application, applicationAction, expectAction, getState, requestAction, type Graphql } from './complex.flow.js'
import { promptMapApplicantQualified, promptMapReviewerQualified } from './default.promptdata.js'
import type { CatTowerPromptData } from '../../demos/src/default/definitions/models/index.js'

/**
 * A program with nothing after submission (no PREAPPROVAL, APPROVAL, workflow or acceptance requirements) needs no one to act on
 * it, so its application is COMPLETE as soon as the request is submitted. The whole request only completes on its own when that
 * is true of every program, or when the only programs that do have reviewer work were ruled out before submission - those have
 * nothing for a reviewer to decide, so the review completes itself.
 *
 * In the default demo the dog program is applicant-only, the cat program has two APPROVAL requirements.
 */
const dog = 'adopt_a_dog_program'
const cat = 'adopt_a_cat_program'
const catReviewerRequirements = ['applicant_seems_nice_req', 'other_cats_reviewer_req']

const promptMapCatIneligible = new Map(promptMapApplicantQualified)
promptMapCatIneligible.set('have_a_cat_tower_prompt', new Map<string, CatTowerPromptData>([['fail_0', { haveCatTower: false, willPurchaseCatTower: false }]]))

const timeZone = 'America/Chicago'
const openDate = '2025-07-01T00:00:00.000-05:00'
const closeDate = DateTime.now().plus({ days: 1 }).setZone(timeZone).set({ millisecond: 0 }).toISO()

async function createPeriod (graphql: Graphql, name: string, code: string) {
  const { createPeriod } = await graphql<{ createPeriod: { period: { id: number } } }>(`
    mutation CreatePeriod($name: String!, $code: String!, $openDate: DateTime!, $closeDate: DateTime!) {
      createPeriod(period: { name: $name, code: $code, openDate: $openDate, closeDate: $closeDate }, validateOnly: false) { period { id } }
    }
  `, { name, code, openDate, closeDate })
  const periodId = createPeriod.period.id
  await graphql('mutation ($periodId: ID!) { markPeriodReviewed(periodId: $periodId) { period { id } } }', { periodId })
  return periodId
}

async function createAndSubmit (graphql: Graphql, login: string, periodId: number, answers: Map<string, Map<string, any>>) {
  const { createAppRequest } = await graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(`
    mutation CreateAppRequest($login: String!, $periodId: ID!) {
      createAppRequest(login: $login, periodId: $periodId, validateOnly: false) { appRequest { id } messages { message } }
    }
  `, { login, periodId })
  expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
  const appRequestId = createAppRequest.appRequest!.id
  await answerAvailable(graphql, appRequestId, answers)
  await expectAction(graphql, 'submitAppRequest', requestAction('submitAppRequest'), { appRequestId })
  return appRequestId
}

test.describe.serial('App Request - auto-complete programs with no reviewer work', { tag: '@default' }, () => {
  let periodId = 0
  test('Admin - create period where the cat program still needs review', async ({ suRequest }) => {
    periodId = await createPeriod(suRequest.graphql, '2025 auto-complete mixed', 'AUTO_COMPLETE_MIXED')
  })

  test('Mixed request - dog completes at submission, cat still goes through review', async ({ applicantRequest, suRequest }) => {
    const appRequestId = await createAndSubmit(applicantRequest.graphql, 'applicant', periodId, promptMapApplicantQualified)
    let state = await getState(suRequest.graphql, appRequestId)
    expect(state.phase).toEqual('SUBMITTED')
    expect(state.status).toEqual('APPROVAL')
    expect(application(state, dog).phase).toEqual('COMPLETE')
    expect(application(state, dog).status).toEqual('ELIGIBLE')
    expect(application(state, cat).phase).toEqual('APPROVAL')

    // the auto-completed result is released to the applicant right away, the cat result stays hidden until review is complete
    const applicantState = await getState(applicantRequest.graphql, appRequestId)
    expect(application(applicantState, dog).status).toEqual('ELIGIBLE')
    expect(application(applicantState, cat).status).toEqual('PENDING')

    await answerAvailable(suRequest.graphql, appRequestId, promptMapReviewerQualified)
    state = await getState(suRequest.graphql, appRequestId)
    expect(application(state, cat).phase).toEqual('READY_FOR_WORKFLOW')
    // a reviewer has answered, so the request reads as mid-review until the cat application is advanced
    expect(state.status).toEqual('REVIEW_IN_PROGRESS')
    await expectAction(suRequest.graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: application(state, cat).id })

    state = await getState(suRequest.graphql, appRequestId)
    expect(state.status).toEqual('REVIEW_COMPLETE')
    await expectAction(suRequest.graphql, 'completeReview', requestAction('completeReview'), { appRequestId })
    state = await getState(suRequest.graphql, appRequestId)
    expect(state.phase).toEqual('COMPLETE')
    expect(state.status).toEqual('APPROVED')
  })

  test('Cat ruled out before submission does not hold the review, it completes automatically', async ({ applicant2Request, suRequest }) => {
    const appRequestId = await createAndSubmit(applicant2Request.graphql, 'applicant2', periodId, promptMapCatIneligible)
    const state = await getState(suRequest.graphql, appRequestId)
    // the period has no acceptance or non-blocking workflow, so the automatic Complete Review lands at COMPLETE
    expect(state.phase).toEqual('COMPLETE')
    expect(state.status).toEqual('APPROVED')
    expect(application(state, dog).status).toEqual('ELIGIBLE')
    expect(application(state, cat).status).toEqual('INELIGIBLE')
    for (const app of state.applications) expect(app.phase, app.programKey).toEqual('COMPLETE')
  })

  let noReviewPeriodId = 0
  async function setCatReviewerRequirementsDisabled (graphql: Graphql, disabled: boolean) {
    for (const requirementKey of catReviewerRequirements) {
      const response = await graphql<any>('mutation ($periodId: String!, $requirementKey: String!, $disabled: Boolean!) { updatePeriodRequirement(periodId: $periodId, requirementKey: $requirementKey, disabled: $disabled) { success } }', { periodId: String(noReviewPeriodId), requirementKey, disabled })
      expect(response.errors, JSON.stringify(response.errors)).toBeUndefined()
      expect(response.updatePeriodRequirement.success).toEqual(true)
    }
  }
  test('Admin - create period where neither program has reviewer work', async ({ suRequest }) => {
    noReviewPeriodId = await createPeriod(suRequest.graphql, '2025 auto-complete no review', 'AUTO_COMPLETE_NONE')
    await setCatReviewerRequirementsDisabled(suRequest.graphql, true)
  })

  let autoCompletedId = 0
  test('Every program without reviewer work - submit completes the whole request', async ({ applicantRequest, suRequest }) => {
    autoCompletedId = await createAndSubmit(applicantRequest.graphql, 'applicant', noReviewPeriodId, promptMapApplicantQualified)
    const state = await getState(suRequest.graphql, autoCompletedId)
    for (const key of catReviewerRequirements) expect(application(state, cat).requirements.find(r => r.key === key), key).toBeUndefined()
    expect(state.phase).toEqual('COMPLETE')
    expect(state.status).toEqual('APPROVED')
    for (const app of state.applications) expect(app.phase, app.programKey).toEqual('COMPLETE')
  })

  test('Every program without reviewer work - an ineligible program does not hold the request back', async ({ applicant2Request, suRequest }) => {
    const appRequestId = await createAndSubmit(applicant2Request.graphql, 'applicant2', noReviewPeriodId, promptMapCatIneligible)
    const state = await getState(suRequest.graphql, appRequestId)
    expect(state.phase).toEqual('COMPLETE')
    expect(state.status).toEqual('APPROVED')
    expect(application(state, cat).status).toEqual('INELIGIBLE')
    for (const app of state.applications) expect(app.phase, app.programKey).toEqual('COMPLETE')
  })

  test('Auto-completed request returned to review and to the applicant re-evaluates, and completes again on resubmission', async ({ applicantRequest, suRequest }) => {
    await expectAction(suRequest.graphql, 'returnToReview', requestAction('returnToReview'), { appRequestId: autoCompletedId })
    let state = await getState(suRequest.graphql, autoCompletedId)
    expect(state.phase).toEqual('SUBMITTED')
    expect(state.status).toEqual('REVIEW_COMPLETE')

    await expectAction(suRequest.graphql, 'returnToApplicant', requestAction('returnToApplicant'), { appRequestId: autoCompletedId })
    state = await getState(suRequest.graphql, autoCompletedId)
    expect(state.phase).toEqual('STARTED')
    for (const app of state.applications) expect(app.phase, app.programKey).toEqual('READY_TO_SUBMIT')

    await expectAction(applicantRequest.graphql, 'submitAppRequest', requestAction('submitAppRequest'), { appRequestId: autoCompletedId })
    state = await getState(suRequest.graphql, autoCompletedId)
    expect(state.phase).toEqual('COMPLETE')
    expect(state.status).toEqual('APPROVED')
  })

  // createPeriod copies the disabled requirements of the most recent period, so leaving these disabled would strip the cat
  // reviewer requirements from whatever period the next spec creates
  test.afterAll(async ({ suRequest }) => {
    if (noReviewPeriodId) await setCatReviewerRequirementsDisabled(suRequest.graphql, false)
  })
})
