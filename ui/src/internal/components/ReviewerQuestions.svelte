<script lang="ts">
  import { Form } from '@txstate-mws/svelte-forms'
  import MachineLearning from 'carbon-icons-svelte/lib/MachineLearning.svelte'
  import WarningFilled from 'carbon-icons-svelte/lib/WarningFilled.svelte'
  import Edit from 'carbon-icons-svelte/lib/Edit.svelte'
  import SidePanelOpenFilled from 'carbon-icons-svelte/lib/SidePanelOpenFilled.svelte'
  import { enumRequirementStatus, enumRequirementType, PromptIndicators, statusReasonsToFeedback, translateMutations, type PhaseChangeMutations, type StatusReason } from '@reqquest/ui'
  import { isInlineReviewerEditPrompt, isDisplayablePrompt, hasDisplayablePrompts, RenderDisplayComponent, applicantRequirementTypes, reviewerRequirementTypes, api, PromptSaveQueue, type BasicRequestData } from '$internal'
  import { FormInlineNotification, Panel, PanelFormDialog, TagSet } from '@txstate-mws/carbon-svelte'
  import { Tooltip } from 'carbon-components-svelte'
  import { uiRegistry } from '$local';
  import { Button } from 'carbon-components-svelte'
  import type { PageData } from '../../routes/requests/[id]/approve/[programKey]/$types'
  import { invalidate, invalidateAll } from '$app/navigation'
  import Review from "carbon-icons-svelte/lib/Review.svelte";
  import DelayedSkeleton from '$internal/components/DelayedSkeleton.svelte';
  import WarningIconYellow from './WarningIconYellow.svelte';
  import MissingDefinitionNotification from './MissingDefinitionNotification.svelte';
  import { toasts } from '@txstate-mws/svelte-components';
  import { randomid } from 'txstate-utils'

  type ApplicationRequirement = (typeof appRequest)['applications'][number]['requirements'][number]

  export let sections: { key: string, title: string, requirements: ApplicationRequirement[] }[]
  /** the stage panel that gets the "Send to" button once the application is ready for workflow */
  export let lastStageKey: string | undefined = undefined
  export let promptIndicator: Record<string, any>
  export let promptStatusReasons: Record<string, StatusReason[]> = {}
  export let loading = false
  export let appRequest: PageData['appRequest']
  export let application: PageData['appRequest']['applications'][0]
  export let basicRequestData: BasicRequestData

  type PromptExtraData = Awaited<ReturnType<typeof api.getPromptData>>
  type Prompt = PageData['appRequest']['applications'][0]['requirements'][0]['prompts'][0]
  type PromptWithExtra = Prompt & PromptExtraData & { allowSaveWithoutChanges?: boolean }
  let editingPromptWithData: PromptWithExtra | undefined = undefined
  let promptBeingEdited: Prompt | undefined = undefined
  let editingViaReviewDialog = false
  let showPromptDialog = false
  let fetchingEditPrompt = false

  // every save on this screen writes the same appRequest row, so they all run in sequence through one
  // queue that threads the row's dataVersion from each save into the next
  let saveQueue = new PromptSaveQueue()
  let saveQueueAppRequestId: string | undefined
  $: {
    if (saveQueueAppRequestId !== appRequest.id) {
      saveQueueAppRequestId = appRequest.id
      saveQueue = new PromptSaveQueue()
    }
    saveQueue.adopt(appRequest.dataVersion)
  }

  function editPrompt (prompt: Prompt, allowSaveWithoutChanges: boolean = false, viaReviewDialog: boolean = false) {
    return async () => {
      if (fetchingEditPrompt) return
      promptBeingEdited = prompt
      editingViaReviewDialog = viaReviewDialog
      fetchingEditPrompt = true
      showPromptDialog = true
      try {
        // empty the save queue before fetching, so the version we pin to the modal includes everything
        // this session has typed inline.
        await saveQueue.drain()
        const extra = await api.getPromptData(appRequest.id, prompt.id)
        editingPromptWithData = { ...prompt, ...extra, allowSaveWithoutChanges }
      } finally {
        fetchingEditPrompt = false
      }
    }
  }
  // Diff issue, but needed because a bare document.querySelector('.tcbs-dialog') grabs the first
  // dialog in document order, and the page keeps note form and the notes list permanently mounted.
  // so need to be specific
  const editDialogFormId = randomid()
  function editDialogElement () {
    return document.getElementById(editDialogFormId)?.closest('.tcbs-dialog') ?? undefined
  }
  function hideEditModalPrompt () { // keep the dialog in the DOM so on:saved fires, but remove from view
    if (!showPromptDialog) return
    editDialogElement()?.classList.add('invisible')
  }
  function showEditModalPrompt () {
    editDialogElement()?.classList.remove('invisible')
  }

  function closePromptDialog () {
    fetchingEditPrompt = false
    showPromptDialog = false
    editingPromptWithData = undefined
    promptBeingEdited = undefined
    editingViaReviewDialog = false
  }
  function onPromptSubmit (prompt: any, modal = false) {
    return async (data: any) => {
      if (modal) { loading = true; hideEditModalPrompt() }
      try {
        // the modal is editing the data it fetched when it opened, so it saves against that version;
        // inline forms carry whatever version the queue is holding when their turn comes up
        const pinnedVersion = modal ? prompt.dataVersion : undefined
        const response = await saveQueue.save(async dataVersion => {
          return (!prompt.allowSaveWithoutChanges)
            ? await api.updatePrompt(prompt.id, data, false, dataVersion)
            : await api.updatePrompt(prompt.id, data, false, dataVersion, true) // triggers from review corrections edit selection, allow saving without changes to handle invalidate prompts that require no changes
        }, pinnedVersion)
        if (modal && !response.success) { loading = false; showEditModalPrompt() }
        // prev resp.data was replacing the store's data with a wrongly-shaped object and
        // re-baselines beforeUserChanges to it. Reduce to this prompt's slice like ApplicantPromptPage.onSubmit
        return { ...response, data: response.data?.[prompt.key] }
      } catch (e) {
        if (modal) { loading = false; showEditModalPrompt() }
        throw e
      }
    }
  }

  function onPromptValidate (prompt: any) {
    return async (data: any) => {
      const response = await api.updatePrompt(prompt.id, data, true, prompt.dataVersion)
      return response.messages
    }
  }

  async function refreshReviewData () {
    // Scoped instead of invalidateAll()
    await Promise.all([invalidate('request:approve'), invalidate('request:id')])
  }

    async function appRequestPhaseChange (action: PhaseChangeMutations) {
    const response = await api.appRequestPhaseChange(appRequest.id, action)
    await invalidateAll()
    loading = false
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: 'Action Failed',
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: `Successfully ${translateMutations[action]}.`
      })
    }
    await invalidateAll()
  }

  async function advanceWorkflow () {
    loading = true
    const response = await api.advanceWorkflow(application.id)
    await invalidateAll()
    if (basicRequestData?.actions.completeReview) return await appRequestPhaseChange('completeReview')
    if (basicRequestData?.actions.completeRequest) return await appRequestPhaseChange('completeRequest')
    loading = false
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: 'Could not advance application',
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: 'Application advanced.'
      })
    }
  }

  async function reverseWorkflow () {
    loading = true
    const response = await api.reverseWorkflow(application.id)
    await invalidateAll()
    loading = false
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: 'Could not reverse application workflow',
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: 'Application workflow reversed.'
      })
    }
  }

  // answered/total reviewer questions in a section
  function reviewerQuestionTally (section: { requirements: ApplicationRequirement[] }) {
    const questions = new Map<string, ApplicationRequirement['prompts'][number]>()
    for (const requirement of section.requirements) {
      if (!reviewerRequirementTypes.has(requirement.type)) continue
      for (const prompt of requirement.prompts.filter(isDisplayablePrompt)) {
        if (!uiRegistry.getPrompt(prompt.key)?.automation) questions.set(prompt.id, prompt)
      }
    }
    const answered = [...questions.values()].filter(p => p.answered && !p.invalidated).length
    return { answered, total: questions.size }
  }
  $: reviewerQuestionTallies = Object.fromEntries(sections.map(section => [section.key, reviewerQuestionTally(section)]))

  $: readyForWorkflow = !application.nextWorkflowStage && application.phase === 'READY_FOR_WORKFLOW' ? lastStageKey : undefined
  // otherwise the button sits on the last non-stage panel on the page, wherever the layout put it
  $: latestWorkflow = readyForWorkflow ?? sections.filter(section => section.requirements.every(r => !r.workflowStage?.key)).pop()?.key
  // the one panel "Edit answers" sits on: the stage being reversed onto, or the last review panel when reversing back into review.
  // Requirement statuses don't matter here - a disqualified review must be reversible, and the API decides via actions.reverseWorkflow
  $: reverseTarget = application.previousWorkflowStage
    ? sections.find(section => section.requirements[0]?.workflowStage?.key === application.previousWorkflowStage?.key)?.key
    : sections.filter(section => section.requirements.every(r => !r.workflowStage?.key)).pop()?.key

  /** inline autoSave forms: refresh statuses/indicators only, never touch the live form */
  async function onPromptAutoSaved () {
    await refreshReviewData()
  }

  /** modal edit form: close first, so the dialog is not left hidden for the whole refresh */
  async function onPromptSaved () {
    loading = false
    closePromptDialog()
    await refreshReviewData()
  }

</script>
{#each sections as section (section.key)}
  <Panel title={section.title} expandable expanded>
    <svelte:fragment slot="headerRight">
      {@const tally = reviewerQuestionTallies[section.key]}
      {#if tally?.total}
        <!-- visible pill is hidden from screen readers in favor of the spelled-out text, and the status role announces changes politely on autosave -->
        <span role="status" class="reviewer-question-tally">
          <span aria-hidden="true">
            <TagSet small tags={[{ label: `${tally.answered}/${tally.total} answered`, type: tally.answered === tally.total ? 'green' : 'yellow' }]} />
          </span>
          <span class="bx--visually-hidden">{tally.answered} of {tally.total} questions answered</span>
        </span>
      {/if}
    </svelte:fragment>
    {#if section.requirements.some(hasDisplayablePrompts)}
      <dl class="prompts">
        {#each section.requirements as requirement (requirement.id)}
          {#each requirement.prompts.filter(isDisplayablePrompt) as prompt (prompt.id)}
            {@const def = uiRegistry.getPrompt(prompt.key)}
            {@const isReviewerQuestion = reviewerRequirementTypes.has(requirement.type) && !def?.automation}
            {@const isAutomation = !!def?.automation}
            {@const editMode = isInlineReviewerEditPrompt(def, requirement.type, prompt)}
            {@const opensReviewDialog = isReviewerQuestion && def?.formMode === 'full'}
            {@const small = editMode && def?.formMode !== 'full' ? def?.formMode !== 'large' : def?.displayMode !== 'large'}
            {@const large = editMode && def?.formMode !== 'full' ? def?.formMode === 'large' : def?.displayMode === 'large'}
            {@const dtid = `dt-title-${prompt.id}`}
            {@const currentWorkflow = application.workflowStage ? application.workflowStage?.key === section.requirements[0]?.workflowStage?.key : undefined}
            {@const disabled = ((!editMode && def?.formMode !== 'full') && (currentWorkflow || requirement.status !== enumRequirementStatus.MET))}
            {#snippet editButtons()}
              {#if prompt.actions.update}
                {#if prompt.invalidated && !applicantRequirementTypes.has(requirement.type)}
                  <Button kind="primary" size="field" class="prompt-edit mr-2" icon={Review} iconDescription="Review corrections" id="edit-btn-{prompt.id}" aria-labelledby="edit-btn-{prompt.id} {dtid}" on:click={editPrompt(prompt, true)} />
                {:else if opensReviewDialog}
                  <Button kind="secondary" size="field" icon={SidePanelOpenFilled} class="prompt-dialog-open" id="edit-btn-{prompt.id}" aria-labelledby="edit-btn-{prompt.id} {dtid}" on:click={editPrompt(prompt, false, true)}>{uiRegistry.reviewerDialogButtonText(prompt.key)}</Button>
                {:else}
                  <Button kind="ghost" size="field" icon={Edit} iconDescription="Edit" class="prompt-edit" id="edit-btn-{prompt.id}" aria-labelledby="edit-btn-{prompt.id} {dtid}" on:click={editPrompt(prompt)} />
                {/if}
              {/if}
            {/snippet}
            <dt class:small class:large class:isReviewerQuestion class:disabled={disabled} class:bg-tagyellow-200={isAutomation}>
            {#if promptIndicator[prompt.key]?.indicator && (promptIndicator[prompt.key].indicator !== PromptIndicators.PENDING || (isReviewerQuestion && prompt.actions.update))}
                <div class="indicator-tooltip">
                <Tooltip align="start" direction="bottom">
                    <svelte:fragment slot="icon">
                    {#if promptIndicator[prompt.key]?.indicator === PromptIndicators.AUTOMATION}
                        <MachineLearning size={20} />
                    {:else if promptIndicator[prompt.key]?.indicator === PromptIndicators.WARNING}
                        <WarningIconYellow />
                    {:else if promptIndicator[prompt.key]?.indicator === PromptIndicators.DISQUALIFYING}
                        <WarningFilled size={20} class="disqualifying-icon" style="fill: var(--cds-support-01, #da1e28)" />
                    {:else if promptIndicator[prompt.key]?.indicator === PromptIndicators.PENDING}
                        <svg class="pending-dot" xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                          <circle cx="4" cy="4" r="4" />
                        </svg>
                    {/if}
                    </svelte:fragment>
                    {promptIndicator[prompt.key]?.reason}
                </Tooltip>
                </div>
            {/if}
            <div id={dtid}>
                {prompt.title}
            </div>
            {#if large && !editMode}
              {@render editButtons()}
            {/if}
            </dt>
            <dd class="flow" class:small class:large class:isReviewerQuestion class:disabled={disabled} class:bg-tagyellow-200={isAutomation} role={editMode ? 'group' : undefined} aria-labelledby={dtid}>
              {#if editMode}
                <Form bind:store={saveQueue.stores[prompt.id]} preload={prompt.preloadData} submit={onPromptSubmit(prompt)} validate={onPromptValidate(prompt)} autoSave on:autosaved={onPromptAutoSaved} let:data let:messages>
                    <svelte:component this={def?.formComponent} {data} appRequestData={appRequest.data} prestageData={{latest: prompt.prestageData, current: appRequest.data[prompt.key]?.__prestage}} fetched={prompt.fetchedData} configData={prompt.configurationData} gatheredConfigData={prompt.gatheredConfigData}  invalidated={prompt.invalidated} invalidatedReason={prompt.invalidatedReason} statusReasons={promptStatusReasons[prompt.key] ?? []} />
                    {#each statusReasonsToFeedback(promptStatusReasons[prompt.key], { blamedOnly: true, statuses: uiRegistry.statusReasonNotificationStatuses(prompt.key, 'reviewer') }) as message}
                      <FormInlineNotification {message} />
                    {/each}
                    {#each messages as message (message.message, message.type)}
                      <FormInlineNotification {message} />
                    {/each}
                  </Form>
              {:else}
                <div class="pr-4">
                  <RenderDisplayComponent
                    {def}
                    appRequestId={appRequest.id}
                    appData={appRequest.data}
                    prompt={prompt}
                    prestageData={{latest: prompt.prestageData, current: appRequest.data[prompt.key]?.__prestage}}
                    configData={prompt.configurationData}
                    gatheredConfigData={prompt.gatheredConfigData} showMoot
                    statusReasons={promptStatusReasons[prompt.key] ?? []}
                    showInlineReviewNotification={prompt.actions.update && prompt.invalidated && !applicantRequirementTypes.has(requirement.type)} />
                </div>
                {#if !large}
                  {@render editButtons()}
                {/if}
              {/if}
            </dd>
          {/each}
        {/each}
      </dl>
    {:else if section.requirements[0]?.workflowStage && section.requirements[0]?.workflowStage.key === application.workflowStage?.key}
      No questions need to be answered in this section. You may advance to the next step.
    {:else}
      No questions in this section.
    {/if}
    {#if !section.requirements.every(r => r.type === enumRequirementType.PREQUAL) && (application.actions?.advanceWorkflow || application.actions?.reverseWorkflow)}
      <div class="flex justify-end mt-8">
        {#if application.actions?.advanceWorkflow && (application.workflowStage?.key ? application.workflowStage?.key === section.requirements[0]?.workflowStage?.key : section.key === latestWorkflow)}
          <Button size="small" on:click={advanceWorkflow}>{'Send to ' + (application.nextWorkflowStage?.title ?? (!application.workflowStage?.blocking ? 'Complete' : 'Review Complete'))}</Button>
        {:else if application.actions?.reverseWorkflow && section.key === reverseTarget}
          <Button kind='secondary' size="small" on:click={reverseWorkflow}>Edit answers</Button>
        {/if}
      </div>
    {/if}
  </Panel>
{/each}

{#if showPromptDialog && promptBeingEdited}
{@const formMode = uiRegistry.getPrompt(promptBeingEdited.key)?.formMode === 'full' ? 'large' : undefined}
  <PanelFormDialog
    id={editDialogFormId}
    title={editingPromptWithData?.invalidated ? `Review correction "${editingPromptWithData?.title}"` : editingViaReviewDialog ? uiRegistry.reviewerDialogButtonText(promptBeingEdited.key) : 'Edit Prompt'}
    bind:open={showPromptDialog}
    on:cancel={closePromptDialog}
    submit={onPromptSubmit(editingPromptWithData, true)}
    validate={onPromptValidate(editingPromptWithData)}
    on:saved={onPromptSaved}
    disableSaveUntilChanged={!editingPromptWithData?.allowSaveWithoutChanges} // allow saving without changes if prompt was previously invalidated ...accomodates reviewer saying no changes required on correction check
    centered={!formMode}
    size={formMode}
    preload={editingPromptWithData?.preloadData}
    let:data
  >
    {#if editingPromptWithData}
      {@const def = uiRegistry.getPrompt(editingPromptWithData.key)}
      <div class='font-medium text-center mt-2'>
        <p class="text-xl font-medium ">{editingPromptWithData.title}</p>
      </div>
      {#if def?.formComponent == null}
        <MissingDefinitionNotification kind="prompt" definitionKey={editingPromptWithData.key} />
      {:else}
      <svelte:component
        this={def.formComponent}
        appRequestId={appRequest.id}
        {data}
        appRequestData={editingPromptWithData.data}
        prestageData={{
          latest: editingPromptWithData.prestageData,
          current: appRequest.data[editingPromptWithData.key]?.__prestage
        }}
        fetched={editingPromptWithData.fetchedData}
        configData={editingPromptWithData.configurationData}
        gatheredConfigData={editingPromptWithData.gatheredConfigData}
        invalidated={editingPromptWithData.invalidated}
        invalidatedReason={editingPromptWithData.invalidatedReason}
        statusReasons={promptStatusReasons[editingPromptWithData.key] ?? []}
      />
      {#each statusReasonsToFeedback(promptStatusReasons[editingPromptWithData.key], { blamedOnly: true, statuses: uiRegistry.statusReasonNotificationStatuses(editingPromptWithData.key, 'reviewer') }) as message}
        <FormInlineNotification {message} />
      {/each}
      {/if}
    {:else if fetchingEditPrompt}
      {@const loader = uiRegistry.getPrompt(promptBeingEdited.key)?.loader}
      <div class='font-medium text-center mt-2'>
        <p class="text-xl font-medium ">{promptBeingEdited.title}</p>
      </div>
      {#if loader}
        <DelayedSkeleton {loader} />
      {/if}
    {/if}
  </PanelFormDialog>
{/if}

<style>
  dl.prompts {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    align-items: stretch;
    gap: 0;
    margin: -16px;
  }
  .prompts dt, .prompts dd {
    position: relative;
    border-bottom: 1px solid var(--cds-border-subtle);
    padding: 1rem 15px;
  }
  .prompts dt.small {
    padding-right: 15px;
  }
  .prompts dt.large, .prompts dd.large {
    grid-column: span 2;
  }
  /* When a display component's root is a PromptDisplayGrid — directly, or through the
     <form> of an inline edit (formMode 'large') — hand it our column tracks via subgrid
     so its challenge/response rows align with the real prompt rows. */
  .prompts dd.large:has(> :global(.prompt-display-grid)),
  .prompts dd.large:has(> :global(form > .prompt-display-grid)) {
    display: grid;
    grid-template-columns: subgrid;
    align-content: start;
    padding: 0;
    border-bottom: none;
    --prompt-display-subgrid: subgrid;
    --prompt-display-row-padding: 1rem 15px;
    --prompt-display-challenge-padding-left: 32px;
  }
  .prompts dd.large:has(> :global(.prompt-display-grid)) > :global(*),
  .prompts dd.large:has(> :global(form > .prompt-display-grid)) > :global(*) {
    grid-column: 1 / -1;
  }
  .prompts dd.large > :global(form:has(> .prompt-display-grid)) {
    display: grid;
    grid-template-columns: subgrid;
  }
  .prompts dd.large > :global(form:has(> .prompt-display-grid) > *) {
    grid-column: 1 / -1;
  }
  .prompts dt.isReviewerQuestion, .prompts dd.isReviewerQuestion {
    background-color: var(--background-cool-light);
  }
  .prompts dt.isReviewerQuestion.disabled, .prompts dd.isReviewerQuestion.disabled {
    background-color: #f2f2f2;
    color: #8C8C8C;
  }
  .prompts dt {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-left: 32px;
  }
  .prompts dt :global(.bx--btn.prompt-edit),
  .prompts dd :global(.bx--btn.prompt-edit) {
    position: absolute;
    top: 0.35rem;
    right: 0;
    margin: 0;
  }
  .prompts dt .dt-title {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  /* a large prompt's open-in-dialog button sits at the start of the answer column, so the dt borrows
     the prompt list's column tracks */
  .prompts dt.large:has(> :global(.prompt-dialog-open)) {
    display: grid;
    grid-template-columns: subgrid;
    padding: 0;
  }
  .prompts dt.large:has(> :global(.prompt-dialog-open)) > .dt-title {
    padding: 1rem 15px 1rem 32px;
  }
  .prompts dt.large > :global(.bx--btn.prompt-dialog-open) {
    grid-column: 2;
    justify-self: start;
    align-self: center;
    margin: 0.5rem 15px;
  }
  .prompts dt .indicator-tooltip {
    display: inline-block;
    margin-left: -24px;
  }
  .prompts dt .indicator-tooltip :global(> div) {
    line-height: 0;
  }
  .prompts dt .indicator-tooltip :global(> div .bx--tooltip--shown) {
    line-height: 1.2;
  }
  .prompts dt :global(.warning-icon) {
    fill: var(--cds-inverse-support-03, #f1c21b);
  }
  :global(.disqualifying-icon) {
    fill: var(--cds-support-01, #da1e28);
  }
  .pending-dot {
    width: 8px;
    height: 8px;
    aspect-ratio: 1/1;
    fill: var(--cds-support-01, #da1e28);
  }
  :global(.panel:has(.isReviewerQuestion.disabled) .panel-header) {
    background-color: #8C8C8C !important;
  }
</style>
