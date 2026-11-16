import { expect, test } from './fixtures.js'
import { promptMapReviewerCatDenied, promptMapReviewerAllDenied, promptMapApplicantAcceptance, promptMapReviewerNonBlocking } from './complex.promptdata.js'
import { getState, application, requirement, answerAvailable, requestAction, applicationAction, expectAction, expectRefused, seededPeriodId, submitQualifiedRequest, finishBlockingWorkflow, updatePromptMutation } from './complex.flow.js'

/**
 * Non-blocking does not mean optional. A request cannot reach COMPLETE until every non-blocking requirement on every
 * application has resolved to something other than PENDING - including an application denied during review, because
 * the audit of the reviewer's work is needed whether or not the applicant was approved. Only an application screened
 * out before submission skips non-blocking workflow.
 *
 * In the complex demo only the cat program carries a non-blocking stage (confirm_cat_microchip_service_workflow), so the
 * cat application is the one denied in review here. Foster shares the cat review requirement, so it is denied along with
 * it; it has only a blocking stage, which makes it the control - denied, but with nothing non-blocking owed. The
 * pre-submission exception is not exercised in this demo: every pre-submission requirement that can disqualify is shared
 * by all three programs, so screening the cat out would screen the whole request out and it could never be submitted.
 */

const cat = 'adopt_a_cat_program'
const dog = 'adopt_a_dog_program'
const foster = 'foster_a_pet_program'

test.describe.serial('Non-blocking workflow is owed by an application denied in review', { tag: '@complex' }, () => {
  let appRequestId = 0

  test('Applicant - qualify for all three programs and submit', async ({ adminRequest, applicantRequest }) => {
    appRequestId = await submitQualifiedRequest(applicantRequest.graphql, 'applicant', await seededPeriodId(adminRequest.graphql))
  })

  test('Reviewer - deny the cat application (and with it foster), approve the dog', async ({ reviewerRequest }) => {
    await answerAvailable(reviewerRequest.graphql, appRequestId, promptMapReviewerCatDenied)
    const state = await getState(reviewerRequest.graphql, appRequestId)
    for (const denied of [cat, foster]) {
      expect(application(state, denied).status, denied).toEqual('INELIGIBLE')
      expect(application(state, denied).ineligiblePhase, denied).toEqual('APPROVAL')
    }
    expect(application(state, dog).status).toEqual('ELIGIBLE')
    for (const app of state.applications) expect(app.phase, app.programKey).toEqual('READY_FOR_WORKFLOW')
  })

  test('Reviewer - walk every application through blocking workflow and complete the review', async ({ reviewerRequest }) => {
    await finishBlockingWorkflow(reviewerRequest.graphql, appRequestId)
    await expectAction(reviewerRequest.graphql, 'completeReview', requestAction('completeReview'), { appRequestId })
    expect((await getState(reviewerRequest.graphql, appRequestId)).phase).toEqual('ACCEPTANCE')
  })

  test('Applicant - accept the offer, which starts non-blocking workflow', async ({ applicantRequest }) => {
    await answerAvailable(applicantRequest.graphql, appRequestId, promptMapApplicantAcceptance)
    expect((await getState(applicantRequest.graphql, appRequestId)).status).toEqual('READY_TO_ACCEPT')
    await expectAction(applicantRequest.graphql, 'acceptOffer', requestAction('acceptOffer'), { appRequestId })
    const state = await getState(applicantRequest.graphql, appRequestId)
    expect(state.phase).toEqual('WORKFLOW_NONBLOCKING')
    expect(application(state, dog).status).toEqual('ACCEPTED')
    // a denial that predates the offer is not a declined offer: the acceptance phase must not relabel it
    for (const denied of [cat, foster]) {
      expect(application(state, denied).status, denied).toEqual('INELIGIBLE')
      expect(application(state, denied).ineligiblePhase, denied).toEqual('APPROVAL')
    }
  })

  test('Reviewer - the denied application still owes its non-blocking stage, so the request cannot complete', async ({ reviewerRequest }) => {
    const state = await getState(reviewerRequest.graphql, appRequestId)
    // dog and foster have no non-blocking stage, so there is nothing for a reviewer to mark complete: they are complete already
    for (const other of [dog, foster]) {
      expect(application(state, other).phase, other).toEqual('COMPLETE')
      expect(application(state, other).actions.completeApplication, other).toEqual(false)
      expect(application(state, other).actions.reopenApplication, other).toEqual(false)
    }
    // the denied cat is held by its PENDING non-blocking requirement, whose prompt is open to the reviewer
    expect(application(state, cat).phase).toEqual('WORKFLOW_NONBLOCKING')
    expect(application(state, cat).actions.completeApplication).toEqual(false)
    const microchip = requirement(state, cat, 'confirm_cat_microchip_service_workflow_req')
    expect(microchip.status).toEqual('PENDING')
    expect(microchip.prompts.find(p => p.key === 'confirm_cat_microchip_service_prompt')?.visibility).toEqual('AVAILABLE')
    // mayCompleteRequest is readyToComplete plus permission, and the reviewer has the permission
    expect(state.actions.completeRequest).toEqual(false)
    await expectRefused(reviewerRequest.graphql, 'completeRequest', requestAction('completeRequest'), { appRequestId })
  })

  test('Reviewer - answering the non-blocking stage makes the program ready to be marked complete, still editable', async ({ reviewerRequest }) => {
    await answerAvailable(reviewerRequest.graphql, appRequestId, promptMapReviewerNonBlocking)
    const state = await getState(reviewerRequest.graphql, appRequestId)
    const microchip = requirement(state, cat, 'confirm_cat_microchip_service_workflow_req')
    expect(microchip.status).toEqual('MET')
    expect(application(state, cat).phase).toEqual('READY_TO_COMPLETE')
    expect(application(state, cat).actions.completeApplication).toEqual(true)
    expect(application(state, cat).actions.reopenApplication).toEqual(false)
    expect(microchip.prompts.find(p => p.key === 'confirm_cat_microchip_service_prompt')?.actions.update).toEqual(true)
    // ready is not marked: the request waits for every program to be marked complete
    expect(state.actions.completeRequest).toEqual(false)
    await expectRefused(reviewerRequest.graphql, 'completeRequest', requestAction('completeRequest'), { appRequestId })
    // non-blocking workflow is not advanced like blocking workflow is
    await expectRefused(reviewerRequest.graphql, 'advanceWorkflow', applicationAction('advanceWorkflow'), { applicationId: application(state, cat).id })
  })

  test('Reviewer - marking the program complete locks its non-blocking answers and leaves the request waiting', async ({ reviewerRequest }) => {
    let state = await getState(reviewerRequest.graphql, appRequestId)
    const catId = application(state, cat).id
    await expectAction(reviewerRequest.graphql, 'completeApplication', applicationAction('completeApplication'), { applicationId: catId })
    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, cat).phase).toEqual('COMPLETE')
    expect(application(state, cat).actions.completeApplication).toEqual(false)
    expect(application(state, cat).actions.reopenApplication).toEqual(true)
    const prompt = requirement(state, cat, 'confirm_cat_microchip_service_workflow_req').prompts.find(p => p.key === 'confirm_cat_microchip_service_prompt')!
    expect(prompt.actions.update).toEqual(false)
    await expectRefused(reviewerRequest.graphql, 'updatePrompt', updatePromptMutation, { promptId: prompt.id, data: promptMapReviewerNonBlocking.get(prompt.key)!.values().next().value })
    // the request itself has not moved: it now only waits for its own Complete
    expect(state.phase).toEqual('WORKFLOW_NONBLOCKING')
    expect(state.actions.completeRequest).toEqual(true)
  })

  test('Reviewer - reopening the program makes its non-blocking answers editable again and holds the request', async ({ reviewerRequest }) => {
    let state = await getState(reviewerRequest.graphql, appRequestId)
    const catId = application(state, cat).id
    await expectAction(reviewerRequest.graphql, 'reopenApplication', applicationAction('reopenApplication'), { applicationId: catId })
    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(application(state, cat).phase).toEqual('READY_TO_COMPLETE')
    const prompt = requirement(state, cat, 'confirm_cat_microchip_service_workflow_req').prompts.find(p => p.key === 'confirm_cat_microchip_service_prompt')!
    expect(prompt.actions.update).toEqual(true)
    await expectAction(reviewerRequest.graphql, 'updatePrompt', updatePromptMutation, { promptId: prompt.id, data: promptMapReviewerNonBlocking.get(prompt.key)!.values().next().value })
    expect(state.actions.completeRequest).toEqual(false)
    // a program that completed on its own was never marked, so it cannot be reopened
    await expectRefused(reviewerRequest.graphql, 'reopenApplication', applicationAction('reopenApplication'), { applicationId: application(state, dog).id })
  })

  test('Reviewer - with every program marked complete the request completes, and nothing can be reopened per program', async ({ reviewerRequest }) => {
    let state = await getState(reviewerRequest.graphql, appRequestId)
    await expectAction(reviewerRequest.graphql, 'completeApplication', applicationAction('completeApplication'), { applicationId: application(state, cat).id })
    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.actions.completeRequest).toEqual(true)
    await expectAction(reviewerRequest.graphql, 'completeRequest', requestAction('completeRequest'), { appRequestId })
    state = await getState(reviewerRequest.graphql, appRequestId)
    expect(state.phase).toEqual('COMPLETE')
    // one accepted application makes the request ACCEPTED; the denied ones must not drag it to NOT_ACCEPTED
    expect(state.status).toEqual('ACCEPTED')
    for (const app of state.applications) {
      expect(app.phase, app.programKey).toEqual('COMPLETE')
      expect(app.actions.reopenApplication, app.programKey).toEqual(false)
    }
    expect(requirement(state, cat, 'confirm_cat_microchip_service_workflow_req').prompts.find(p => p.key === 'confirm_cat_microchip_service_prompt')?.actions.update).toEqual(false)
  })
})

test.describe.serial('A request denied entirely in review reads Ineligible, not Offer declined', { tag: '@complex' }, () => {
  let appRequestId = 0

  test('Applicant2 - qualify for all three programs and submit', async ({ adminRequest, applicant2Request }) => {
    appRequestId = await submitQualifiedRequest(applicant2Request.graphql, 'applicant2', await seededPeriodId(adminRequest.graphql))
  })

  test('Reviewer - deny every application in review', async ({ reviewerRequest }) => {
    await answerAvailable(reviewerRequest.graphql, appRequestId, promptMapReviewerAllDenied)
    const state = await getState(reviewerRequest.graphql, appRequestId)
    for (const app of state.applications) {
      expect(app.status, app.programKey).toEqual('INELIGIBLE')
      expect(app.ineligiblePhase, app.programKey).toEqual('APPROVAL')
      expect(app.phase, app.programKey).toEqual('READY_FOR_WORKFLOW')
    }
  })

  test('Reviewer - finish blocking workflow and complete the review', async ({ reviewerRequest }) => {
    await finishBlockingWorkflow(reviewerRequest.graphql, appRequestId)
    await expectAction(reviewerRequest.graphql, 'completeReview', requestAction('completeReview'), { appRequestId })
  })

  test('The request is Ineligible (NOT_APPROVED) and every application stays denied at APPROVAL', async ({ reviewerRequest }) => {
    const state = await getState(reviewerRequest.graphql, appRequestId)
    // the period has an acceptance phase, so the request enters it even though there is nothing to offer
    expect(state.phase).toEqual('ACCEPTANCE')
    for (const app of state.applications) {
      expect(app.status, app.programKey).toEqual('INELIGIBLE')
      expect(app.ineligiblePhase, app.programKey).toEqual('APPROVAL')
    }
    // NOT_ACCEPTED means the applicant declined an offer; nobody here was offered anything
    expect(state.status).toEqual('NOT_APPROVED')
  })
})
