import { DateTime } from 'luxon'
import { expect, test } from './fixtures.js'
import { promptMapApplicantQualified } from './default.promptdata.js'

/**
 * The reviewer screen groups an application's requirements into panels. Without a layout the panels are
 * type-based; the default demo's cat program declares one custom panel ("Other cats in the home") that
 * pairs the applicant's other-cats answer with the reviewer's vaccine check, and leaves
 * `applicant_seems_nice_req` unplaced so it falls into the trailing "Reviewer Questions" panel.
 */
test.describe.serial('Reviewer screen panels follow the program\'s reviewSections', { tag: '@default' }, () => {
  const timeZone = 'America/Chicago'
  const stamp = Date.now()
  const periodName = `Reviewer Screen Layout Period ${stamp}`
  const periodCode = `RSL${stamp}`
  const openDate = DateTime.now().setZone(timeZone).minus({ days: 1 }).toISO()
  const closeDate = DateTime.now().setZone(timeZone).plus({ days: 1 }).toISO()

  let periodId = 0
  let appRequestId = 0
  const programKey = 'adopt_a_cat_program'

  test('Admin - create period', async ({ adminRequest }) => {
    const query = `
      mutation CreatePeriod($name: String!, $code: String!, $openDate: DateTime!, $closeDate: DateTime!) {
        createPeriod(period: { name: $name, code: $code, openDate: $openDate, closeDate: $closeDate }, validateOnly: false) {
          period { id }
          messages { message }
        }
      }
    `
    const { createPeriod } = await adminRequest.graphql<{ createPeriod: { period: { id: number }, messages: { message: string }[] } }>(query, { name: periodName, code: periodCode, openDate, closeDate })
    periodId = createPeriod.period.id
    expect(periodId).toBeTruthy()
  })

  test('Admin - mark period reviewed', async ({ adminRequest }) => {
    const query = `
      mutation MarkPeriodReviewed($periodId: ID!) {
        markPeriodReviewed(periodId: $periodId) { period { id reviewed } messages { message } }
      }
    `
    const { markPeriodReviewed } = await adminRequest.graphql<{ markPeriodReviewed: { period: { reviewed: boolean } } }>(query, { periodId })
    expect(markPeriodReviewed.period.reviewed).toEqual(true)
  })

  test('Applicant - create, answer and submit app request', async ({ applicantRequest }) => {
    const create = `
      mutation CreateAppRequest($login: String!, $periodId: ID!) {
        createAppRequest(login: $login, periodId: $periodId, validateOnly: false) {
          appRequest { id }
          messages { message }
        }
      }
    `
    const { createAppRequest } = await applicantRequest.graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(create, { login: 'applicant', periodId })
    expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
    appRequestId = createAppRequest.appRequest!.id

    const getPrompts = `
      query GetPrompts($appRequestIds: [ID!]) {
        appRequests(filter: { ids: $appRequestIds }) {
          applications { requirements { prompts { id key answered visibility } } }
        }
      }
    `
    const updatePrompt = `
      mutation UpdatePrompt($promptId: ID!, $data: JsonData!) {
        updatePrompt(promptId: $promptId, data: $data, validateOnly: false) { success messages { message } }
      }
    `
    // prompts are revealed one requirement at a time, so keep answering until nothing is left
    for (let i = 0; i < promptMapApplicantQualified.size; i++) {
      const response = await applicantRequest.graphql<{ appRequests: { applications: { requirements: { prompts: { id: number, key: string, answered: boolean, visibility: string }[] }[] }[] }[] }>(getPrompts, { appRequestIds: [appRequestId] })
      const available = response.appRequests.flatMap(r => r.applications.flatMap(a => a.requirements.flatMap(req => req.prompts.filter(p => !p.answered && p.visibility === 'AVAILABLE'))))
      if (available.length === 0) break
      for (const prompt of available) {
        for (const value of promptMapApplicantQualified.get(prompt.key)?.values() ?? []) {
          const { updatePrompt: result } = await applicantRequest.graphql<{ updatePrompt: { success: boolean } }>(updatePrompt, { promptId: prompt.id, data: value })
          expect(result.success).toEqual(true)
        }
      }
    }

    const submit = `
      mutation SubmitAppRequest($appRequestId: ID!) {
        submitAppRequest(appRequestId: $appRequestId) { success messages { message } }
      }
    `
    const { submitAppRequest } = await applicantRequest.graphql<{ submitAppRequest: { success: boolean } }>(submit, { appRequestId })
    expect(submitAppRequest.success).toEqual(true)
  })

  test('Reviewer - custom panel sits between the program panel and Reviewer Questions', async ({ reviewerPage }) => {
    await reviewerPage.goto(`/requests/${appRequestId}/approve/${programKey}`)
    const panels = reviewerPage.locator('.panel')
    await expect(panels.first()).toBeVisible()
    const titles = await panels.locator('.panel-title').allInnerTexts()
    expect(titles.map(t => t.trim())).toEqual(['General Questions', 'Adopt a Cat', 'Other cats in the home', 'Reviewer Questions'])

    // the applicant's other-cats answer left the program panel for the custom one...
    const customPanel = panels.filter({ has: reviewerPage.locator('.panel-header', { hasText: 'Other cats in the home' }) })
    await expect(customPanel.locator('dt', { hasText: 'Do you have other cats?' }).first()).toBeVisible()
    const programPanel = panels.filter({ has: reviewerPage.locator('.panel-header', { hasText: 'Adopt a Cat' }) })
    await expect(programPanel.locator('dt', { hasText: 'Do you have other cats?' })).toHaveCount(0)
    await expect(programPanel.locator('dt', { hasText: 'Tuna Allergy' })).toBeVisible()

    // ...while the unplaced reviewer requirement trails in the default reviewer panel, even though it is
    // the last key in requirementKeys - the case the old interleaving heuristic got wrong
    const reviewerPanel = panels.filter({ has: reviewerPage.locator('.panel-header', { hasText: 'Reviewer Questions' }) })
    await expect(reviewerPanel.locator('dt', { hasText: 'Assess Applicant\'s Niceness' })).toBeVisible()
    await expect(customPanel.locator('dt', { hasText: 'Assess Applicant\'s Niceness' })).toHaveCount(0)

    // each panel with reviewer questions tallies how many are answered
    await expect(customPanel.locator('.reviewer-question-tally')).toContainText('1/2 answered')
    await expect(reviewerPanel.locator('.reviewer-question-tally')).toContainText('0/1 answered')

    // the cat program has reviewer work, so there is no "nothing to review" notice
    await expect(reviewerPage.locator('.system-determination-notice')).toHaveCount(0)
  })

  test('Reviewer - a program without a layout renders the type-based panels only', async ({ reviewerPage }) => {
    await reviewerPage.goto(`/requests/${appRequestId}/approve/adopt_a_dog_program`)
    const panels = reviewerPage.locator('.panel')
    await expect(panels.first()).toBeVisible()
    const titles = (await panels.locator('.panel-title').allInnerTexts()).map(t => t.trim())
    expect(titles).toEqual(['General Questions', 'Adopt a Dog'])
    // a panel with nothing to display is not rendered at all, not shown as an empty header
    await expect(panels.filter({ hasNot: reviewerPage.locator('dt') })).toHaveCount(0)
    // the dog program has no reviewer, workflow or acceptance requirements: the system decided it at submission
    const notice = reviewerPage.locator('.system-determination-notice')
    await expect(notice).toBeVisible()
    await expect(notice).toContainText('Nothing to review for Adopt a Dog')
    await expect(notice).toContainText('There are no remaining questions to answer for this program.')
  })
})

/**
 * A requirement that resolves PENDING with a reason marks its blamed prompt on the reviewer screen the same way a
 * WARNING or DISQUALIFYING one does: an icon in the prompt's title cell whose tooltip carries the reason. The default
 * demo's `other_cats_reviewer_req` returns PENDING blaming `vaccine_review_prompt` until the reviewer assesses the
 * records, which only happens when the applicant has other cats.
 */
test.describe.serial('Reviewer screen shows a PENDING reason as a prompt tooltip', { tag: '@default' }, () => {
  const timeZone = 'America/Chicago'
  const stamp = Date.now()
  const periodName = `Reviewer Screen Pending Period ${stamp}`
  const periodCode = `RSP${stamp}`
  const openDate = DateTime.now().setZone(timeZone).minus({ days: 1 }).toISO()
  const closeDate = DateTime.now().setZone(timeZone).plus({ days: 1 }).toISO()

  let periodId = 0
  let appRequestId = 0
  const programKey = 'adopt_a_cat_program'

  // the qualified applicant answers, except this applicant has other cats and uploads their records
  const doc = (i: number) => ({ _type: 'UploadInfo', name: `doc${i}.pdf`, mime: 'application/pdf', size: 100, multipartIndex: i })
  const answers = new Map<string, Map<string, any>>([
    ...promptMapApplicantQualified,
    ['other_cats_prompt', new Map([['other_cats', { hasOtherCats: true }]])],
    ['other_cats_vaccines_prompt', new Map([['docs', { distemperDoc: doc(0), rabiesDoc: doc(1), felineLeukemiaDoc: doc(2), felineHIVDoc: doc(3) }]])]
  ])

  test('Admin - create and review period', async ({ adminRequest }) => {
    const create = `
      mutation CreatePeriod($name: String!, $code: String!, $openDate: DateTime!, $closeDate: DateTime!) {
        createPeriod(period: { name: $name, code: $code, openDate: $openDate, closeDate: $closeDate }, validateOnly: false) {
          period { id }
          messages { message }
        }
      }
    `
    const { createPeriod } = await adminRequest.graphql<{ createPeriod: { period: { id: number }, messages: { message: string }[] } }>(create, { name: periodName, code: periodCode, openDate, closeDate })
    periodId = createPeriod.period.id
    expect(periodId).toBeTruthy()
    const review = `
      mutation MarkPeriodReviewed($periodId: ID!) {
        markPeriodReviewed(periodId: $periodId) { period { id reviewed } messages { message } }
      }
    `
    const { markPeriodReviewed } = await adminRequest.graphql<{ markPeriodReviewed: { period: { reviewed: boolean } } }>(review, { periodId })
    expect(markPeriodReviewed.period.reviewed).toEqual(true)
  })

  test('Applicant - answer with other cats and submit', async ({ applicantRequest }) => {
    const create = `
      mutation CreateAppRequest($login: String!, $periodId: ID!) {
        createAppRequest(login: $login, periodId: $periodId, validateOnly: false) {
          appRequest { id }
          messages { message }
        }
      }
    `
    const { createAppRequest } = await applicantRequest.graphql<{ createAppRequest: { appRequest: { id: number } | null, messages: { message: string }[] } }>(create, { login: 'applicant', periodId })
    expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
    appRequestId = createAppRequest.appRequest!.id

    const getPrompts = `
      query GetPrompts($appRequestIds: [ID!]) {
        appRequests(filter: { ids: $appRequestIds }) {
          applications { requirements { prompts { id key answered visibility } } }
        }
      }
    `
    const updatePrompt = `
      mutation UpdatePrompt($promptId: ID!, $data: JsonData!) {
        updatePrompt(promptId: $promptId, data: $data, validateOnly: false) { success messages { message } }
      }
    `
    for (let i = 0; i < answers.size; i++) {
      const response = await applicantRequest.graphql<{ appRequests: { applications: { requirements: { prompts: { id: number, key: string, answered: boolean, visibility: string }[] }[] }[] }[] }>(getPrompts, { appRequestIds: [appRequestId] })
      const available = response.appRequests.flatMap(r => r.applications.flatMap(a => a.requirements.flatMap(req => req.prompts.filter(p => !p.answered && p.visibility === 'AVAILABLE'))))
      if (available.length === 0) break
      for (const prompt of available) {
        for (const value of answers.get(prompt.key)?.values() ?? []) {
          const { updatePrompt: result } = await applicantRequest.graphql<{ updatePrompt: { success: boolean, messages: { message: string }[] } }>(updatePrompt, { promptId: prompt.id, data: value })
          expect(result.success, `${prompt.key}: ${result.messages.map(m => m.message).join('; ')}`).toEqual(true)
        }
      }
    }

    const submit = `
      mutation SubmitAppRequest($appRequestId: ID!) {
        submitAppRequest(appRequestId: $appRequestId) { success messages { message } }
      }
    `
    const { submitAppRequest } = await applicantRequest.graphql<{ submitAppRequest: { success: boolean, messages: { message: string }[] } }>(submit, { appRequestId })
    expect(submitAppRequest.success, submitAppRequest.messages.map(m => m.message).join('; ')).toEqual(true)
  })

  test('Reviewer - the blamed prompt carries the PENDING reason, other prompts do not', async ({ reviewerPage }) => {
    await reviewerPage.goto(`/requests/${appRequestId}/approve/${programKey}`)
    const customPanel = reviewerPage.locator('.panel').filter({ has: reviewerPage.locator('.panel-header', { hasText: 'Other cats in the home' }) })
    await expect(customPanel).toBeVisible()

    // the reviewer prompt the requirement blames gets the indicator and its reason
    const vaccineReview = customPanel.locator('dt', { hasText: 'Vaccine Review' }).first()
    const indicator = vaccineReview.locator('.indicator-tooltip')
    await expect(indicator).toBeVisible()
    await expect(indicator.locator('svg')).toHaveCount(1)
    await indicator.locator('.bx--tooltip__trigger').hover()
    await expect(reviewerPage.locator('.bx--tooltip--shown')).toContainText('Reviewer must assess all vaccine records.')

    // ...but the applicant prompt the same requirement also consults does not, because blame names one prompt
    await expect(customPanel.locator('dt', { hasText: 'Do you have other cats?' }).locator('.indicator-tooltip')).toHaveCount(0)

    // and a PENDING reviewer requirement that gives no reason marks its unanswered reviewer prompt "Required"
    const reviewerPanel = reviewerPage.locator('.panel').filter({ has: reviewerPage.locator('.panel-header', { hasText: 'Reviewer Questions' }) })
    const niceness = reviewerPanel.locator('dt', { hasText: 'Assess Applicant\'s Niceness' })
    await expect(niceness).toBeVisible()
    const nicenessIndicator = niceness.locator('.indicator-tooltip')
    await expect(nicenessIndicator).toBeVisible()
    await expect(nicenessIndicator.locator('svg')).toHaveCount(1)
    await nicenessIndicator.locator('.bx--tooltip__trigger').hover()
    // the Vaccine Review tooltip above stays open, so scope to this prompt's own indicator
    await expect(nicenessIndicator.locator('.bx--tooltip--shown')).toContainText('Required')
  })
})
