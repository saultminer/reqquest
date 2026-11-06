import { DateTime } from 'luxon'
import { expect, test } from './fixtures.js'
import { createSubmittedClosedRequest } from './default.submitclose.js'

/**
 * The reviewer dashboard filters by review stage through three status-based tabs: Review Pending
 * (PREAPPROVAL + APPROVAL), In Review (REVIEW_IN_PROGRESS) and Review Complete (REVIEW_COMPLETE onward).
 * There is no search box and no quick filter; the submitted-date filters live in the "More filters" dialog.
 * The list itself shows each program with its status tag(s), two-line dates, row checkboxes with a bulk
 * download, and expandable rows listing every program.
 */
test.describe.serial('Reviewer dashboard tabs and list', { tag: '@default' }, () => {
  const timeZone = 'America/Chicago'
  const stamp = Date.now()
  const periodName = `Reviewer Dashboard Tabs Period ${stamp}`
  const periodCode = `RDT${stamp}`
  const openDate = DateTime.now().setZone(timeZone).minus({ days: 1 }).toISO()
  const closeDate = DateTime.now().setZone(timeZone).plus({ days: 1 }).toISO()

  let periodId = ''
  let appRequestId = ''

  test('Admin - create and review period', async ({ adminRequest }) => {
    const create = `
      mutation CreatePeriod($name: String!, $code: String!, $openDate: DateTime!, $closeDate: DateTime!) {
        createPeriod(period: { name: $name, code: $code, openDate: $openDate, closeDate: $closeDate }, validateOnly: false) {
          period { id }
          messages { message }
        }
      }
    `
    const { createPeriod } = await adminRequest.graphql<{ createPeriod: { period: { id: string } } }>(create, { name: periodName, code: periodCode, openDate, closeDate })
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

  const dashboardStatuses = ['PREAPPROVAL', 'APPROVAL', 'REVIEW_IN_PROGRESS', 'REVIEW_COMPLETE', 'ACCEPTANCE', 'READY_TO_ACCEPT', 'ACCEPTED', 'NOT_ACCEPTED', 'APPROVED', 'NOT_APPROVED']
  const countsQuery = `
    query Counts($statuses: [AppRequestStatus!]) {
      all: countAppRequestApplicants { firstTime returning }
      dashboard: countAppRequestApplicants(filter: { closed: false, status: $statuses }) { firstTime returning }
    }
  `
  type Counts = { firstTime: number, returning: number }
  let countsBefore: { all: Counts, dashboard: Counts } = { all: { firstTime: 0, returning: 0 }, dashboard: { firstTime: 0, returning: 0 } }
  let applicantHasEarlierSubmission = false

  test('Reviewer - note applicant counts before the new request', async ({ reviewerRequest }) => {
    countsBefore = await reviewerRequest.graphql<{ all: Counts, dashboard: Counts }>(countsQuery, { statuses: dashboardStatuses })
    // other suites' periods open earlier than ours (each opens "a day ago" at an earlier instant), so a submitted
    // request by this login in any of them makes the new request a returning application
    const { countAppRequests } = await reviewerRequest.graphql<{ countAppRequests: number }>(`
      query { countAppRequests(filter: { logins: ["applicant"], status: [PREAPPROVAL, APPROVAL, REVIEW_IN_PROGRESS, REVIEW_COMPLETE, ACCEPTANCE, READY_TO_ACCEPT, ACCEPTED, NOT_ACCEPTED, APPROVED, NOT_APPROVED, WITHDRAWN] }) }
    `)
    applicantHasEarlierSubmission = countAppRequests > 0
  })

  test('Applicant - create an unsubmitted app request', async ({ applicantRequest }) => {
    const create = `
      mutation CreateAppRequest($login: String!, $periodId: ID!) {
        createAppRequest(login: $login, periodId: $periodId, validateOnly: false) {
          appRequest { id status applications { programKey status } }
          messages { message }
        }
      }
    `
    const { createAppRequest } = await applicantRequest.graphql<{ createAppRequest: { appRequest: { id: string, status: string, applications: { programKey: string, status: string }[] } | null, messages: { message: string }[] } }>(create, { login: 'applicant', periodId })
    expect(createAppRequest.appRequest, createAppRequest.messages.map(m => m.message).join('; ')).not.toBeNull()
    appRequestId = createAppRequest.appRequest!.id
    expect(createAppRequest.appRequest!.status).toEqual('STARTED')
    expect(createAppRequest.appRequest!.applications.every(a => a.status === 'PENDING')).toEqual(true)
  })

  test('Reviewer - an unsubmitted request is invisible to the dashboard counts; overall it is returning only after an earlier submission', async ({ reviewerRequest }) => {
    const after = await reviewerRequest.graphql<{ all: Counts, dashboard: Counts }>(countsQuery, { statuses: dashboardStatuses })
    // the dashboard scope excludes drafts, so the tiles do not move
    expect(after.dashboard).toEqual(countsBefore.dashboard)
    if (applicantHasEarlierSubmission) {
      expect(after.all.returning).toEqual(countsBefore.all.returning + 1)
      expect(after.all.firstTime).toEqual(countsBefore.all.firstTime)
    } else {
      expect(after.all.firstTime).toEqual(countsBefore.all.firstTime + 1)
      expect(after.all.returning).toEqual(countsBefore.all.returning)
    }
  })

  test('Reviewer - bare visit lands on Review Pending; tabs carry counts; stat tiles and list toolbar match the design', async ({ reviewerPage }) => {
    await reviewerPage.goto('/dashboards/reviewer')
    await expect(reviewerPage).toHaveURL(/t\.status\.0=PREAPPROVAL/)
    await expect(reviewerPage).toHaveURL(/t\.status\.1=APPROVAL/)
    // tabs carry their counts in the label
    const pendingTab = reviewerPage.getByRole('radio', { name: /^Review Pending \(\d+\)$/ })
    await expect(pendingTab).toBeVisible()
    await expect(pendingTab).toBeChecked()
    await expect(reviewerPage.getByRole('radio', { name: /^In Review \(\d+\)$/ })).toBeVisible()
    await expect(reviewerPage.getByRole('radio', { name: /^Review Complete \(\d+\)$/ })).toBeVisible()
    await expect(reviewerPage.getByRole('radio', { name: 'Awaiting Review' })).toHaveCount(0)
    // no search box or quick filters in the filter bar, and no dialog button there either (the list header owns those)
    await expect(reviewerPage.locator('.quickfilters-form')).toHaveCount(0)
    // scoped to the filter bar: the list's Pagination renders two selects (comboboxes) once the queue has rows
    await expect(reviewerPage.locator('.filter-ui-container')).toHaveCount(1)
    await expect(reviewerPage.locator('.filter-ui-container').getByRole('combobox')).toHaveCount(0)
    await expect(reviewerPage.locator('.nested-multiselect')).toHaveCount(0)
    await expect(reviewerPage.getByRole('button', { name: /(More|Add) filters/i })).toHaveCount(0)
    await expect(reviewerPage.getByRole('heading', { name: 'Review pending' })).toBeVisible()
    // the intro subtitle uses the panel's full width instead of wrapping at the library's 28rem cap
    const subtitleBox = (await reviewerPage.locator('.intro-subtitle').boundingBox())!
    expect(subtitleBox.height).toBeLessThan(24)
    // the list toolbar shares the intro panel's background and sits flush beneath it, reading as one block
    const [panelBg, headerBg] = await Promise.all(['.intro-panel', '.column-list-header'].map(async sel => await reviewerPage.locator(sel).evaluate(el => getComputedStyle(el).backgroundColor)))
    expect(headerBg).toEqual(panelBg)
    const [panelBox, headerBox] = await Promise.all([reviewerPage.locator('.intro-panel').boundingBox(), reviewerPage.locator('.column-list-header').boundingBox()])
    expect(Math.abs(headerBox!.y - (panelBox!.y + panelBox!.height))).toBeLessThan(1.5)

    // stat tiles: applicant counts always; average review time only for users who may view metrics (the demo reviewer may not)
    await expect(reviewerPage.locator('.stat-tile', { hasText: 'First time application' })).toContainText(/\d+ applications?/)
    await expect(reviewerPage.locator('.stat-tile', { hasText: 'Returning application' })).toContainText(/\d+ applications?/)
    await expect(reviewerPage.locator('.periods-open')).toHaveCount(0)
    // reviewers may read metrics; the tile shows for metrics viewers, and with no decided applications it says so
    const token = (await reviewerPage.evaluate(() => sessionStorage.getItem('token')))!
    const metrics = await reviewerPage.request.post('http://api/graphql', { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, data: JSON.stringify({ query: '{ access { viewMetrics } applicationMetrics { toDecision { avg } } }' }) })
    const { data } = await metrics.json() as { data: { access: { viewMetrics: boolean }, applicationMetrics: { toDecision: { avg: number | null } } } }
    expect(data.access.viewMetrics).toEqual(true)
    const avgTile = reviewerPage.locator('.stat-tile', { hasText: 'Avg. time to finish review' })
    if (data.applicationMetrics.toDecision.avg != null) await expect(avgTile).toContainText(/(\d+ (day|hour|minute)s?|under a minute)/)
    else await expect(avgTile).toContainText('--:--')
    // the tabs sit at the bottom of the tile row
    const [tabBox, tileBox] = await Promise.all([pendingTab.boundingBox(), reviewerPage.locator('.stat-tile', { hasText: 'First time application' }).boundingBox()])
    expect(Math.abs((tabBox!.y + tabBox!.height) - (tileBox!.y + tileBox!.height))).toBeLessThan(6)
    // on a narrow screen the row wraps and the tabs drop below the tiles, staying directly above the intro panel
    const fullSize = reviewerPage.viewportSize()!
    await reviewerPage.setViewportSize({ width: 700, height: fullSize.height })
    const [narrowTab, narrowTile] = await Promise.all([pendingTab.boundingBox(), reviewerPage.locator('.stat-tile', { hasText: 'First time application' }).boundingBox()])
    expect(narrowTab!.y).toBeGreaterThanOrEqual(narrowTile!.y + narrowTile!.height)
    await reviewerPage.setViewportSize(fullSize)

    await reviewerPage.getByRole('radio', { name: /^In Review \(\d+\)$/ }).click()
    await expect(reviewerPage).toHaveURL(/t\.status\.0=REVIEW_IN_PROGRESS/)
    expect(reviewerPage.url()).not.toMatch(/PREAPPROVAL/)
    await expect(reviewerPage.getByRole('heading', { name: 'In review' })).toBeVisible()

    await reviewerPage.getByRole('radio', { name: /^Review Complete \(\d+\)$/ }).click()
    await expect(reviewerPage).toHaveURL(/t\.status\.0=REVIEW_COMPLETE/)
    await expect(reviewerPage).toHaveURL(/NOT_APPROVED/)
    await expect(reviewerPage.getByRole('heading', { name: 'Review complete' })).toBeVisible()

    // list header toolbar: magnifier opens the search field, funnel opens the date filters, Export is the primary action
    await reviewerPage.getByRole('button', { name: /^Search / }).click()
    await expect(reviewerPage.getByRole('searchbox')).toBeVisible()
    await reviewerPage.keyboard.press('Escape')
    await reviewerPage.getByRole('button', { name: /^Filter / }).click()
    await expect(reviewerPage.getByLabel('Submitted After')).toBeVisible()
    await expect(reviewerPage.getByLabel('Submitted Before')).toBeVisible()
    await reviewerPage.keyboard.press('Escape')
    await expect(reviewerPage.getByRole('menuitem', { name: 'Export' })).toBeVisible()
    await expect(reviewerPage.getByRole('menuitem', { name: 'Download' })).toHaveCount(0)
  })

  test('Reviewer - Program column, two-line dates, expansion and bulk download', async ({ reviewerPage }) => {
    // autoHideColumns drops Last Updated at Playwright's default width, so widen for this test and restore afterwards
    const original = reviewerPage.viewportSize() ?? { width: 1280, height: 720 }
    await reviewerPage.setViewportSize({ width: 1800, height: 900 })
    // dialog-key filters: scope to this test's period and to unsubmitted requests without implying a tab
    await reviewerPage.goto(`/dashboards/reviewer?f.status.0=STARTED&f.periodIds.0=${periodId}`)
    // ColumnList renders its cell tags as listitems; the trigger's selection-count badge is also a .bx--tag, so scope by role
    const requestTag = reviewerPage.locator('[role="listitem"].bx--tag', { hasText: new RegExp(`^\\s*${appRequestId}\\s*$`) })
    const row = reviewerPage.locator('.column-list-row').filter({ has: requestTag })
    await expect(row).toBeVisible()

    // two programs render inline: title followed by its status tag
    const programCell = row.locator('.column-list-col.program')
    await expect(programCell).toContainText('Adopt a Dog')
    await expect(programCell).toContainText('Adopt a Cat')
    await expect(programCell.locator('[role="listitem"].bx--tag', { hasText: 'Pending' })).toHaveCount(2)
    await expect(programCell.locator('.bx--tag', { hasText: /programs$/ })).toHaveCount(0)

    // dates split into a date line and a time line
    await expect(row.locator('.column-list-col.dateSubmitted div')).toHaveCount(2)
    await expect(row.locator('.column-list-col.lastUpdated div')).toHaveCount(2)

    // "Expand all" appears in the list header once there are at least two expandable rows
    if (await reviewerPage.locator('.column-list-row').count() >= 2) await expect(reviewerPage.getByRole('button', { name: 'Expand all' })).toBeVisible()

    // the chevron expands to the full program list
    await row.getByRole('button', { name: 'Expand Row' }).click()
    const detail = row.locator('.column-list-expandable')
    await expect(detail).toContainText('Programs')
    await expect(detail).toContainText('Adopt a Dog')
    await expect(detail).toContainText('Adopt a Cat')
    await row.getByRole('button', { name: 'Collapse Row' }).click()
    // ColumnList keeps an empty detail cell in every expandable row and only drops its contents on collapse
    await expect(row.getByRole('button', { name: 'Expand Row' })).toBeVisible()
    await expect(detail).not.toContainText('Programs')

    // selecting a row reveals the bulk download action
    // carbon hides the input behind its label, so click the label and confirm the input toggled
    await row.locator('.column-list-col.checkbox label').click()
    await expect(row.getByLabel('select row')).toBeChecked()
    await expect(reviewerPage.getByRole('status').filter({ hasText: '1 row selected' })).toBeVisible()
    // ActionSet renders actions as menuitems with the label as the icon description
    await expect(reviewerPage.getByRole('menuitem', { name: 'Download selected' })).toBeVisible()
    await reviewerPage.setViewportSize(original)
  })

  let closedRequestId = ''

  test('Applicant2 - submit a request, Reviewer - close it', async ({ applicant2Request, reviewerRequest }) => {
    closedRequestId = await createSubmittedClosedRequest(applicant2Request, reviewerRequest, 'applicant2', periodId)
  })

  test('Reviewer - the filter pop-out has Program status, Program and Period; closed requests show only when filtered for', async ({ reviewerPage }) => {
    await reviewerPage.goto(`/dashboards/reviewer?f.periodIds.0=${periodId}`)
    const closedTag = reviewerPage.locator('[role="listitem"].bx--tag', { hasText: new RegExp(`^\\s*${closedRequestId}\\s*$`) })
    // open-only by default
    await expect(reviewerPage.locator('.column-list-row').first()).toBeVisible()
    await expect(closedTag).toHaveCount(0)

    await reviewerPage.getByRole('button', { name: /^(Filter |\d+\s*active filters?, edit filters for )/ }).click()
    const dialog = reviewerPage.locator('dialog[open]')
    for (const label of [/^Program status$/, /^Program$/, /^Periods$/]) await expect(dialog.locator('.bx--label', { hasText: label })).toHaveCount(1)
    // Period trails Program directly; every other filter follows
    const labels = (await dialog.locator('.bx--label').allInnerTexts()).map(t => t.trim()).filter(Boolean)
    expect(labels.indexOf('Periods')).toEqual(labels.indexOf('Program') + 1)
    expect(labels.indexOf('Program')).toEqual(labels.indexOf('Program status') + 1)
    // the first filter is Program status, the dates come after Period
    expect(labels[0]).toEqual('Program status')
    expect(labels.indexOf('Submitted After')).toBeGreaterThan(labels.indexOf('Periods'))
    await dialog.getByText('Closed or Cancelled only', { exact: true }).click()
    await dialog.getByRole('button', { name: 'Apply' }).click()
    await expect(reviewerPage).toHaveURL(/f\.closed=true/)

    // now listed, with the request-level Closed tag in its Programs section
    await expect(closedTag).toBeVisible()
    const row = reviewerPage.locator('.column-list-row').filter({ has: closedTag })
    await expect(row.locator('.column-list-col.program [role="listitem"].bx--tag', { hasText: /^\s*Closed\s*$/ })).toHaveCount(1)
  })
})
