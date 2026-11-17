<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import { resolve } from '$app/paths'
  import type { ApplicationForDetails, AppRequestForDetails, Scalars } from '@reqquest/ui'
  import {
    AnnouncementBanner, api, ApplicationDetailsView, AppRequestCard, exportTitle, IntroPanel, type AppRequestForExportResponse, type DashboardAppRequest,
    getPeriodDisplayInfo, getPeriodStatus, getStatusActionType, getSubmitButtonText, PrintExport
  } from '$internal'
  import { CardGrid, FieldMultiselect, FilterUI, Panel, PanelDialog, Toasts } from '@txstate-mws/carbon-svelte'
  import { toasts } from '@txstate-mws/svelte-components'
  import { Button, Dropdown, InlineNotification, Modal, Tooltip } from 'carbon-components-svelte'
  import Close from 'carbon-icons-svelte/lib/Close.svelte'
  import Reset from 'carbon-icons-svelte/lib/Reset.svelte'
  import DocumentExport from 'carbon-icons-svelte/lib/DocumentExport.svelte'
  import { uiRegistry } from '$local'
  import type { PageData } from './$types'

  interface FilterState {
    tab?: 'recent_applications' | 'past_applications'
    search?: string
    periodIds?: string[]
    status?: string[]
  }

  export let data: PageData
  $: ({ appRequests, availablePeriods, availableStatuses, access, openPeriods, recentCutoffIso, recentDays, announcement } = data)

  let sidePanelOpen = false
  let loading = false

  // Selected Items
  let selectedAppRequest: AppRequestForDetails | undefined = undefined
  let selectedPeriodId: string | undefined = undefined
  let lastInsertedId: string | undefined

  // Application Details Data (loaded when side panel opens)
  let appData: Scalars['JsonData'] = {}
  let prequalPrompts: AppRequestForExportResponse['prequalPrompts'] | undefined = undefined
  let postqualPrompts: AppRequestForExportResponse['postqualPrompts'] | undefined = undefined
  let applications: ApplicationForDetails[] = []
  let filterDataSearch: FilterState | undefined

  // Modal State
  let cancelConfirmation: { open: boolean, requestId: string | null, isWithdraw: boolean } = { open: false, requestId: null, isWithdraw: false }

  // Auto-select first displayable period
  $: displayablePeriods = openPeriods.length > 0 ? getOpenAndUpcomingPeriods(openPeriods, recentCutoffIso) : []
  $: if (displayablePeriods.length > 0 && !selectedPeriodId) {
    selectedPeriodId = displayablePeriods[0].id
  }
  $: currentPeriod = getCurrentPeriod(displayablePeriods, selectedPeriodId)
  $: periodInfo = currentPeriod ? getPeriodDisplayInfo(currentPeriod) : null

  // ==========================================
  // Period Management Helper Functions
  // ==========================================
  function getCurrentPeriod (periods: typeof openPeriods, selectedId: string | undefined) {
    if (periods.length === 1) return periods[0]
    if (selectedId) return periods.find(p => p.id === selectedId) ?? null
    return null
  }

  function getOpenAndUpcomingPeriods (periods: typeof openPeriods, recentCutoffIso: string): typeof openPeriods {
    const recentCutoff = new Date(recentCutoffIso)

    return periods
      .filter(period => {
        const status = getPeriodStatus(period)
        // Show periods that are open/upcoming AND have been reviewed
        if ((status === 'open' || status === 'upcoming') && period.reviewed) return true
        // Also show closed periods that closed within the recent window
        if (status === 'closed' && period.closeDate) {
          const closeDate = new Date(period.closeDate)
          return closeDate >= recentCutoff && period.reviewed
        }
        return false
      })
      .sort((a, b) => new Date(a.openDate).getTime() - new Date(b.openDate).getTime())
  }

  function showError (message: string) {
    toasts.add(message, 'error', 7000)
  }

  function isSubmitted (status: string): boolean {
    return status !== 'STARTED' && status !== 'READY_TO_SUBMIT'
  }

  // ==========================================
  // API Action Handlers
  // ==========================================

  async function handleApiAction (
    action: () => Promise<any>,
    errorMessage: string,
    successMessage?: string
  ) {
    try {
      const result = await action()
      if (result.success) {
        await invalidate('api:getApplicantRequests')
        if (successMessage) {
          toasts.add(successMessage, 'success', 5000)
        }
      } else {
        const error = result.messages?.find((m: { type: string, message: string }) => m.type === 'error')?.message
        showError(error ?? errorMessage)
      }
    } catch (error) {
      showError(errorMessage)
    }
  }

  // ==========================================
  // UI Card Action Builders
  // ==========================================

  // TODO probably switch this to hide actions instead of disable, but it is nice to see them for now.
  // In general these actions are based off of the text info in https://www.figma.com/design/VXFWNXZ6UNlDxmGNwVoEuu/ReqQuest?node-id=954-101490&m=dev
  function buildCardActions (request: DashboardAppRequest) {
    const submitted = isSubmitted(request.status)
    const cancelWithdrawLabel = submitted ? `Withdraw ${uiRegistry.getWord('appRequest')}` : `Cancel ${uiRegistry.getWord('appRequest')}`

    return [
      {
        label: `View ${uiRegistry.getWord('appRequest')}`,
        onClick: async () => await openSidePanel(request)
      },
      // {
      //   label: 'Download Offer',
      //   onClick: async () => await downloadOffer(request.id),
      //   icon: Download,
      //   disabled: !request.actions.offer
      // },
      // {
      //   label: 'Appeal Decision',
      //   onClick: async () => await appealDecision(request.id),
      //   icon: Warning,
      //   disabled: !request.actions.returnToApplicant
      // },
      {
        label: `Export ${uiRegistry.getWord('appRequest')}`,
        onClick: async () => await exportApplication(request.id),
        icon: DocumentExport
      },
      {
        label: cancelWithdrawLabel,
        onClick: () => { cancelConfirmation = { open: true, requestId: request.id, isWithdraw: submitted } },
        icon: Close,
        disabled: !request.actions.cancel
      },
      {
        label: 'Reinstate Application',
        onClick: async () => await reinstateApplication(request.id),
        icon: Reset,
        disabled: !request.actions.reopen
      }
    ]
  }

  // ==========================================
  // Application Actions
  // ==========================================
  // const appealDecision = async (requestId: string) =>
  //   await handleApiAction(
  //     async () => await api.returnAppRequest(requestId),
  //     'Failed to appeal decision',
  //     'Appeal submitted successfully'
  //   )

  const reinstateApplication = async (requestId: string) =>
    await handleApiAction(
      async () => await api.reopenAppRequest(requestId),
      'Failed to reinstate application',
      'Application reinstated successfully'
    )

  // async function downloadOffer (requestId: string) {
  //   // TODO: Implement actual download logic
  //   console.log('Download offer for', requestId)
  // }

  let printExport: PrintExport

  // only show app request number in export if more than one in period
  function hasSiblingInPeriod (requestId: string) {
    const periodId = appRequests.find(r => r.id === requestId)?.period.id
    return periodId != null && appRequests.some(r => r.id !== requestId && r.period.id === periodId)
  }

  // print the export in place
  async function exportApplication (requestId: string) {
    try {
      await printExport.print(requestId, { includeRequestNumber: hasSiblingInPeriod(requestId) })
    } catch (error) {
      showError(`Failed to export ${uiRegistry.getWord('appRequest').toLowerCase()}`)
      console.error('Error exporting application:', error)
    }
  }

  // ==========================================
  // Panel Dialog Management
  // ==========================================

  async function openSidePanel (appRequest: DashboardAppRequest) {
    sidePanelOpen = true
    loading = true

    try {
      // Fetch additional application details for the side panel
      const details = await api.getAppRequestForExport(appRequest.id)

      selectedAppRequest = details.appRequest as AppRequestForDetails | undefined

      appData = details.appRequest.data
      applications = details.applicationsReview
      prequalPrompts = details.prequalPrompts
      postqualPrompts = details.postqualPrompts
    } catch (error) {
      showError('Failed to load application details')
      console.error('Error loading application details:', error)
    } finally {
      loading = false
    }
  }

  function closeSidePanel () {
    sidePanelOpen = false
    selectedAppRequest = undefined
    appData = {}
    prequalPrompts = undefined
    postqualPrompts = undefined
  }

  async function handleCancelConfirm () {
    if (!cancelConfirmation.requestId) return

    const actionType = cancelConfirmation.isWithdraw ? 'withdraw' : 'cancel'
    await handleApiAction(
      async () => await api.cancelAppRequest(cancelConfirmation.requestId!),
      `Failed to ${actionType} ${uiRegistry.getWord('appRequest').toLowerCase()}`,
      `${uiRegistry.getWord('appRequest')} ${actionType === 'withdraw' ? 'withdrawn' : 'cancelled'} successfully`
    )

    cancelConfirmation = { open: false, requestId: null, isWithdraw: false }
  }

  // Handle submit action based on status action type, used for PanelDialog, specifically for the App View-only side panel
  async function handleSubmitAction () {
    if (!selectedAppRequest) return

    const { status, id } = selectedAppRequest
    const actionType = getStatusActionType(status)

    switch (actionType) {
    case 'navigate':
      await goto(resolve(`/requests/${id}/apply`))
      break
    case 'export':
      await exportApplication(id)
      break
    // case 'download':
    //   await downloadOffer(id)
    //   break
    case 'none':
      // No action for completed/final statuses
      break
    }
  }

  // ==========================================
  // Form Handlers
  // ==========================================

  async function clickCreateAppRequest () {
    // Use the currently selected period
    if (!selectedPeriodId) return
    const { success } = await submitAppRequest({ periodId: selectedPeriodId })
    if (success) await onSaved()
  }

  async function onSaved () {
    await invalidate('api:getAccess')
    await goto(resolve(`/requests/${lastInsertedId}/apply`))
  }

  async function submitAppRequest (data: { periodId: string }) {
    const response = await api.createAppRequest(data.periodId, access.user!.login)
    if (response.success) lastInsertedId = response.id
    return {
      ...response,
      data
    }
  }

  // ==========================================
  // FilterUI Helper Functions
  // ==========================================

  // Reactive statements for filter options
  $: periodOptions = availablePeriods.map(p => ({ value: p.id, label: p.name }))
  $: statusOptions = availableStatuses.map(label => ({ value: label, label }))
  $: isPastTab = filterDataSearch?.tab === 'past_applications'
  $: pastFiltersReady = isPastTab && (periodOptions.length > 0 || statusOptions.length > 0)
  $: showIntroPanel = !isPastTab
</script>

<div class="flow applicant-dashboard" class:past-tab={isPastTab}>
  <!-- Filter UI for recent/past applications -->
  <FilterUI
    search={isPastTab}
    hasQuickFilters={pastFiltersReady}
    tabs={[
      { label: `Recent ${uiRegistry.getPlural('appRequest')}`, value: 'recent_applications' },
      { label: `Past ${uiRegistry.getPlural('appRequest')}`, value: 'past_applications' }
    ]}
    on:apply={e => { filterDataSearch = e.detail }}
    on:mount={e => { filterDataSearch = e.detail }}>
    <svelte:fragment slot="quickfilters">
      {#if pastFiltersReady}
        <FieldMultiselect path="periodIds" label={uiRegistry.getWord('period')} items={periodOptions} />
        <FieldMultiselect path="status" label="Status" items={statusOptions} />
      {/if}
    </svelte:fragment>
  </FilterUI>

  <!-- Time sensitive banner -->
  {#if announcement}
    <AnnouncementBanner subject={announcement.subject} body={announcement.body} link={announcement.link} linkText={announcement.linkText} />
  {/if}

  {#if showIntroPanel}
    <IntroPanel
      title={uiRegistry.config.applicantDashboardIntroHeader}
      subtitle={uiRegistry.config.applicantDashboardIntroDetail}

    >       
      <svelte:fragment slot="block-end">
        {#if displayablePeriods.length > 0}
          <!-- Show period info and action for selected period -->
          {#if currentPeriod && periodInfo}
            <div class="flex flex-wrap gap-4 items-center">
              <!-- Period Information Section -->
              <section class="text-base text-center flex-col gap-2">
                <dl class="flex gap-4  text-sm">
                  <div class="flex flex-col bg-[var(--cds-ui-03,#d9d9d9)] py-4 px-4  justify-center">
                    <dt class="font-bold">{uiRegistry.getWord('appRequest')} opens:</dt>
                    <dd>
                      <time datetime={periodInfo.openDateMachineFormat}>
                        {periodInfo.openLabel}
                      </time>
                    </dd>
                  </div>
                  {#if currentPeriod.closeDate}
                  <div class="flex flex-col bg-[var(--cds-ui-03,#d9d9d9)] py-4 px-4  justify-center">
                    <dt class="font-bold">{uiRegistry.getWord('appRequest')} closes:</dt>
                    <dd>
                      <time datetime={periodInfo.closeDateMachineFormat}>
                        {periodInfo.closeDate}
                      </time>
                    </dd>
                  </div>
                  {/if}
                </dl>
              </section>
              <section class="flex flex-wrap gap-4 items-end intro-actions">
                <!-- Period selector (if multiple) -->
                {#if displayablePeriods.length > 1}
                  <div class="min-w-[250px] intro-dropdown-wrapper">
                    <Dropdown
                      size="lg"
                      labelText="Select a {uiRegistry.getWord('period').toLowerCase()}"
                      hideLabel
                      placeholder="Choose a {uiRegistry.getWord('period').toLowerCase()}"
                      bind:selectedId={selectedPeriodId}
                      items={displayablePeriods.map(p => ({
                        id: p.id,
                        text: p.name
                      }))}
                    />
                  </div>
                {/if}

                <!-- Action Button. Only show start button if no existing application and user can act -->
                {#if periodInfo.canStartNew && access.createAppRequestSelf}
                  <Button
                    on:click={clickCreateAppRequest}
                    kind="primary"
                    size="field"
                  >
                    Start {uiRegistry.getWord('appRequest').toLowerCase()}
                  </Button>
                {:else if (!periodInfo.canStartNew || !access.createAppRequestSelf) && appRequests.length > 0}
                  <Tooltip>
                    <p>{uiRegistry.getWord('appRequest')} started, see dashboard card for details.</p>
                  </Tooltip>
                {/if}
              </section>

            </div>
          {/if}
        {:else}
          <p>No {uiRegistry.getWord('appRequest').toLowerCase()} {uiRegistry.getPlural('period').toLowerCase()} are currently available.</p>
        {/if}
      </svelte:fragment>   
      <svelte:fragment>
        {#if uiRegistry.config.slots?.applicantDashboardIntroSlot}          
          <svelte:component this={uiRegistry.config.slots?.applicantDashboardIntroSlot} {appRequests} {api} />
        {/if}          
      </svelte:fragment>   
    </IntroPanel>
  {/if}
  <!-- Application Cards -->
  <Panel title={filterDataSearch?.tab === 'past_applications' ? `All past ${uiRegistry.getPlural('appRequest').toLowerCase()}` : `All recent ${uiRegistry.getPlural('appRequest').toLowerCase()}`}>
    {#if appRequests.length === 0}
      {#if filterDataSearch?.tab === 'past_applications'}
        <InlineNotification
          kind="info"
          title="No results found."
          subtitle={pastFiltersReady ? 'You may need to refine your searched terms, filters or try again.' : undefined}
          lowContrast
          hideCloseButton
        />
      {:else}
        <InlineNotification
          kind="info"
          title="No recent {uiRegistry.getPlural('appRequest').toLowerCase()} found."
          subtitle="You have no {uiRegistry.getPlural('appRequest').toLowerCase()} created or modified in the last {recentDays} days. Check under Past {uiRegistry.getPlural('appRequest').toLowerCase()} tab."
          lowContrast
          hideCloseButton
        />
      {/if}
    {:else}
      <CardGrid cardSize="500px">
        {#each appRequests as request (request.id)}
          <div class="max-w-[680px]">
            <AppRequestCard
              {request}
              actions={buildCardActions(request)}
              showAcceptanceButtons={true}
            />
          </div>
        {/each}
      </CardGrid>
    {/if}
  </Panel>

  <!-- Inlined Application Details Panel -->
  <PanelDialog
    size="large"
    open={sidePanelOpen}
    title={selectedAppRequest?.period?.name ?? `${uiRegistry.getWord('appRequest')} Details`}
    cancelText="Close"
    submitText={selectedAppRequest?.status ? getSubmitButtonText(selectedAppRequest.status) : ''}
    on:cancel={closeSidePanel}
    on:submit={handleSubmitAction}>
    {#if selectedAppRequest}
      <ApplicationDetailsView
        appRequest={selectedAppRequest}
        {applications}
        {appData}
        {prequalPrompts}
        {postqualPrompts}
        {loading}
        {uiRegistry}
        title={exportTitle(selectedAppRequest, uiRegistry, hasSiblingInPeriod(selectedAppRequest.id))}
        showCorrectionsInline
      />
    {/if}
  </PanelDialog>

  <Modal
    bind:open={cancelConfirmation.open}
    modalHeading={cancelConfirmation.isWithdraw ? `Withdraw ${uiRegistry.getWord('appRequest')}` : `Cancel ${uiRegistry.getWord('appRequest')}`}
    primaryButtonText={cancelConfirmation.isWithdraw ? `Yes, Withdraw ${uiRegistry.getWord('appRequest')}` : `Yes, Cancel ${uiRegistry.getWord('appRequest')}`}
    secondaryButtonText={`Keep ${uiRegistry.getWord('appRequest')}`}
    on:click:button--secondary={() => { cancelConfirmation = { open: false, requestId: null, isWithdraw: false } }}
    on:submit={handleCancelConfirm}
    on:close={() => { cancelConfirmation = { open: false, requestId: null, isWithdraw: false } }}
  >
    <p>
      {#if cancelConfirmation.isWithdraw}
        Withdrawing your {uiRegistry.getWord('appRequest').toLowerCase()} will remove it from consideration and any approved benefits will be lost. You can reopen and edit this {uiRegistry.getWord('appRequest').toLowerCase()} to resubmit it, as long as the {uiRegistry.getWord('appRequest').toLowerCase()} window is still open.
      {:else}
        Canceling your {uiRegistry.getWord('appRequest').toLowerCase()} will remove it from consideration. You can reinstate and submit it later, as long as the {uiRegistry.getWord('appRequest').toLowerCase()} window is still open.
      {/if}
    </p>
  </Modal>

  <PrintExport bind:this={printExport} {uiRegistry} />

  <Toasts />
</div>

<style>
  .applicant-dashboard {
    --repel-vertical-alignment:top;
  }

  .intro-dropdown-wrapper :global(.bx--dropdown__wrapper.bx--list-box__wrapper) {
    display: flex;
    flex-direction: column;
    margin-top:-5px;
  }
  .intro-actions :global(.bx--list-box__field) {
    background: var(--cds-field-02,#ffffff);
  }
  .applicant-dashboard.past-tab :global(.quickfilters-form) {
    min-height: 2.5rem;
  }
</style>
