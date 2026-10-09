<script lang="ts">
  import { BadgeNumber, FieldTextArea, PanelDialog, PanelFormDialog } from '@txstate-mws/carbon-svelte'
  import { toasts } from '@txstate-mws/svelte-components'
  import { ReviewerQuestions, AppRequestActions, SystemDeterminationNotice } from '$internal/components'
  import { Button, InlineNotification, Select, SelectItem } from 'carbon-components-svelte'
  import Edit from 'carbon-icons-svelte/lib/Edit.svelte'
  import Pen from 'carbon-icons-svelte/lib/Pen.svelte'
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte'
  import View from 'carbon-icons-svelte/lib/View.svelte'
  import { invalidateAll } from '$app/navigation'
  import { api, getApplicationStatusInfo, hasDisplayablePrompts } from '$internal'
  import { CommentCard, enumPromptVisibility, enumRequirementStatus, enumRequirementType, InfoCard, PromptIndicators, type StatusReason } from '$lib'
  import type { PageData } from './$types'
  import { uiRegistry } from '../../../../../local'
  import ApproveLayout from '../ApproveLayout.svelte'


  /**
   * This page is the primary reviewer screen, it will show all the prompt
   * data so far collected and allow the reviewer to navigate to (modal popup?)
   * any available prompts to fill in more data.
   */
  export let data: PageData
  $: ({ basicRequestData, appRequest, programKey, requestId } = data)
  $: application = appRequest.applications.find(a => a.programKey === programKey)!
  // mirrors the API's "no trailing work" rule
  $: nothingToReview = !application.requirements.some(r => r.workflowStage || r.type === enumRequirementType.PREAPPROVAL || r.type === enumRequirementType.APPROVAL || r.type === enumRequirementType.ACCEPTANCE)
  $: notes = appRequest?.notes ?? []
  $: latestNote = notes[0]

  let showNotesDialog = false
  let showAddNoteDialog = false
  let showUpdateNoteDialog = false
  let noteBeingEdited: { id: string, content: string, persistent: boolean } | undefined = undefined

  async function onAddNoteValidate (data: { content: string, persistent?: boolean }) {
    const response = await api.addNote(appRequest.id, data.content, data.persistent, true)
    return response.messages
  }

  async function onAddNoteSubmit (data: { content: string, persistent?: boolean }) {
    const response = await api.addNote(appRequest.id, data.content, data.persistent, false)
    return { ...response, data }
  }

  async function onAddNoteSaved () {
    showAddNoteDialog = false
    await invalidateAll()
  }

  // NOTE: addNote and updateNote should always share validation rules.
  // As long as we do not set persistent flag, then we can reuse addNote
  // to validate.
  async function onUpdateNoteValidate (data: { content: string }) {
    const response = await api.addNote(appRequest.id, data.content, undefined, true)
    return response.messages
  }

  async function onUpdateNoteSubmit (data: { content: string, persistent: boolean }) {
    if (!noteBeingEdited) return { success: false, messages: [], data }
    if (data.persistent !== noteBeingEdited.persistent) {
      const response = await api.togglePersistence(noteBeingEdited.id)
      if (!response.success) return { ...response, data }
    }
    if (data.content !== noteBeingEdited.content) {
      const response = await api.updateNote(noteBeingEdited.id, data.content)
      return { ...response, data }
    }
    return { success: true, messages: [], data }
  }

  async function onUpdateNoteSaved () {
    showUpdateNoteDialog = false
    noteBeingEdited = undefined
    await invalidateAll()
  }

  function editNote (note: { id: string, content: string, persistent?: boolean | null }) {
    noteBeingEdited = {
      id: note.id,
      content: note.content,
      persistent: note.persistent ?? false
    }
    showNotesDialog = false
    showUpdateNoteDialog = true
  }

  async function deleteNote (noteId: string) {
    const success = await api.deleteNote(noteId)
    if (success) {
      toasts.add({ type: 'success', message: 'Note deleted.' })
      await invalidateAll()
    }
  }

  type ApplicationRequirement = (typeof appRequest)['applications'][number]['requirements'][number]
  type Section = { key: string, title: string, requirements: ApplicationRequirement[] }

  // the screen is split into panels by requirement type, in lifecycle order, unless the program's
  // reviewSections (on its UIConfig entry) says otherwise. A custom panel takes the requirements it names, in the order it names
  // them; the default panels keep whatever is left, in requirementKeys order. Panels the layout does not
  // mention trail it in the default order, so a layout may be partial.
  let sections: Section[]
  // the stage panel the "Send to" button lands on once the application is ready for workflow - the last
  // stage in lifecycle order, whatever order the layout displays the panels in
  let lastStageKey: string | undefined
  // it's not enough to show an indicator for the prompt's requirement status; since we only show the prompt
  // once, we need to show the highest indicator for any requirement that uses this prompt. So if two requirements
  // share a prompt and one requirement is disqualifying while the other is just a warning, we need to show the
  // disqualifying indicator.
  let promptIndicator: Record<string, { indicator: typeof PromptIndicators[keyof typeof PromptIndicators], reason: string | undefined } | undefined>
  // every requirement status reason aimed at each prompt key (all statuses, blamed or fallback), for the
  // inline notifications under the reviewer's edit forms and the `statusReasons` prop of every prompt component
  let promptStatusReasons: Record<string, StatusReason[]>
  $: {
    promptIndicator = {}
    promptStatusReasons = {}
    const general: Section = { key: 'general', title: 'General Questions', requirements: [] }
    const program: Section = { key: 'program', title: application.title, requirements: [] }
    const reviewer: Section = { key: 'reviewer', title: 'Reviewer Questions', requirements: [] }
    const acceptance: Section = { key: 'acceptance', title: 'Acceptance', requirements: [] }
    const defaults: Record<string, Section> = { GENERAL: general, PROGRAM: program, REVIEWER: reviewer, ACCEPTANCE: acceptance }
    const blockingStages: Section[] = []
    const nonBlockingStages: Section[] = []
    const stages: Record<string, Section> = {}
    const layout = uiRegistry.getProgram(programKey)?.reviewSections ?? []
    const custom = layout.map((entry, i) => 'requirementKeys' in entry
      ? { key: `custom:${i}`, title: entry.title, requirementKeys: entry.requirementKeys, requirements: [] as ApplicationRequirement[] }
      : undefined)
    const claimedKeys = new Set<string>(custom.flatMap(c => c?.requirementKeys ?? []))
    const claimed = new Map<string, ApplicationRequirement>()
    for (const req of application.requirements) {
      // automation indicator is about the prompt itself not requirement's status, so only applies to the requirements own prompts
      for (const prompt of req.prompts) {
        if (prompt.visibility === enumPromptVisibility.UNREACHABLE) continue
        if (uiRegistry.getPrompt(prompt.key)?.automation && (promptIndicator[prompt.key]?.indicator ?? 0) < PromptIndicators.AUTOMATION) {
          promptIndicator[prompt.key] = { indicator: PromptIndicators.AUTOMATION, reason: 'This answer will be filled in by an automation.' }
        }
      }
      const faulted = req.blame?.length
        ? req.blame
        : req.prompts.filter(p => p.visibility !== enumPromptVisibility.UNREACHABLE).map(p => p.key)
      for (const key of faulted) {
        (promptStatusReasons[key] ??= []).push({ status: req.status, statusReason: req.statusReason, programName: application.title, blamed: !!req.blame?.length })
        if (req.status === enumRequirementStatus.DISQUALIFYING && (promptIndicator[key]?.indicator ?? 0) < PromptIndicators.DISQUALIFYING) {
          promptIndicator[key] = { indicator: PromptIndicators.DISQUALIFYING, reason: req.statusReason ?? undefined }
        } else if (req.status === enumRequirementStatus.WARNING && (promptIndicator[key]?.indicator ?? 0) < PromptIndicators.WARNING) {
          promptIndicator[key] = { indicator: PromptIndicators.WARNING, reason: req.statusReason ?? undefined }
        } else if (req.status === enumRequirementStatus.PENDING && req.statusReason && (promptIndicator[key]?.indicator ?? 0) < PromptIndicators.PENDING) {
          promptIndicator[key] = { indicator: PromptIndicators.PENDING, reason: req.statusReason }
        }
      }
      if (req.workflowStage) {
        if (!stages[req.workflowStage.key]) {
          stages[req.workflowStage.key] = { key: `stage:${req.workflowStage.key}`, title: req.workflowStage.title, requirements: [] }
          ;(req.workflowStage.blocking ? blockingStages : nonBlockingStages).push(stages[req.workflowStage.key])
        }
        stages[req.workflowStage.key].requirements.push(req)
      } else if (claimedKeys.has(req.key)) claimed.set(req.key, req)
      else if (req.type === enumRequirementType.ACCEPTANCE) acceptance.requirements.push(req)
      else if (req.type === enumRequirementType.APPROVAL || req.type === enumRequirementType.PREAPPROVAL) reviewer.requirements.push(req)
      else if (req.type === enumRequirementType.QUALIFICATION || req.type === enumRequirementType.POSTQUAL) program.requirements.push(req)
      else general.requirements.push(req) // PREQUAL
    }
    // a requirement the layout names but the period disabled has no record here, so it is simply skipped
    for (const c of custom) {
      if (c) c.requirements = c.requirementKeys.map(k => claimed.get(k)).filter((r): r is ApplicationRequirement => r != null)
    }
    const ordered: Section[] = []
    for (const [i, entry] of layout.entries()) {
      const section = 'requirementKeys' in entry
        ? custom[i]
        : 'workflowStage' in entry
          ? stages[entry.workflowStage]
          : defaults[entry.section]
      if (section) ordered.push(section)
    }
    for (const section of [general, program, reviewer, acceptance, ...blockingStages, ...nonBlockingStages]) {
      if (!ordered.includes(section)) ordered.push(section)
    }
    // a panel with nothing to show is dropped rather than rendered as an empty header. Stage panels are the
    // exception: they carry the advance/return controls and a deliberate "nothing to answer, you may advance" state
    sections = ordered.filter(s => (!!s.requirements[0]?.workflowStage) || s.requirements.some(hasDisplayablePrompts))
    lastStageKey = [...blockingStages, ...nonBlockingStages].pop()?.key
  }
  $: applicationStatusTags = getApplicationStatusInfo(application.status, appRequest.phase, appRequest.closedAt, application.rescindedStatus).map(info => ({ label: info.label, type: info.color }))
  $: loading = false
  let showLoading = false
  let loadingTimer: NodeJS.Timeout | undefined
  $: {
    if (loading) {
      if (!loadingTimer) {
        loadingTimer = setTimeout(() => {
          showLoading = true
        }, 500)
      }
    } else {
      clearTimeout(loadingTimer)
      loadingTimer = undefined
      showLoading = false
    }
  }
  // open rescind and restore panelformdialog
  let reasonAction: 'rescind' | 'restore' | undefined = undefined
  $: reasonActionInfo = reasonAction === 'restore'
    ? { title: `Restore ${application.navTitle} benefit`, instructions: 'You will need to provide a reason why this benefit should be restored. The benefit will be restored to the state it was in before it was rescinded.', submitText: 'Restore benefit', successMessage: 'Benefit restored.' }
    : { title: `Rescind ${application.navTitle} benefit`, instructions: 'You will need to provide a reason why this benefit should be rescinded. The applicant will no longer be able to use this benefit after rescinding.', submitText: 'Rescind benefit', successMessage: 'Benefit rescinded.' }

  async function onReasonValidate (data: { reason: string }) {
    const response = reasonAction === 'restore'
      ? await api.restore(application.id, data.reason, true)
      : await api.rescind(application.id, data.reason, true)
    return response.messages
  }

  async function onReasonSubmit (data: { reason: string }) {
    const response = reasonAction === 'restore'
      ? await api.restore(application.id, data.reason, false)
      : await api.rescind(application.id, data.reason, false)
    return { ...response, data }
  }

  async function onReasonSaved () {
    const message = reasonActionInfo.successMessage
    onReasonCancel()
    await invalidateAll()
    toasts.add({ type: 'success', message })
  }

  function onReasonCancel () {
    reasonAction = undefined
  }
</script>

{#if nothingToReview}
  <SystemDeterminationNotice programTitle={application.title} />
{/if}
<ApproveLayout {basicRequestData}>
  <svelte:fragment slot="sidebar">
    <InfoCard title={application.title} tags={applicationStatusTags} tagsInBody />
    <AppRequestActions {application} {basicRequestData} {requestId} />
    <!-- <InfoCard title={application.title} tags={applicationStatusTags} tagsInBody> -->
      <!--
      <dl class="card">
        <dt>Status</dt>
        <dd><TagSet tags={applicationStatusTags} /></dd>
      </dl>
      -->
    <!-- </InfoCard> -->
    <InfoCard
      title="Application Notes"
      actions={[
        ...(appRequest.actions.createNote ? [{ label: 'Add Note', icon: Pen, onClick: () => { showAddNoteDialog = true } }] : []),
        ...(notes.length > 0 ? [{ label: 'See All Notes', icon: View, onClick: () => { showNotesDialog = true } }] : [])
      ]}
    >
      <BadgeNumber slot="header-right" value={notes.length} style="--badge-bg: var(--cds-ui-04)" />
      <div class="active-note">
        {#if latestNote}
          <CommentCard
            authorName={latestNote.author.fullname}
            authorLogin={latestNote.author.login}
            content={latestNote.content}
            createdAt={latestNote.createdAt}
            noborder
          />
        {:else}
          <InlineNotification kind="info" lowContrast hideCloseButton title="No application notes." subtitle="Add a note to see it here."></InlineNotification>
        {/if}
      </div>
    </InfoCard>

    {#if application.actions.rescindApplication || application.actions.restoreApplication}
      <InfoCard title="Rescind / Restore Benefit">
        <div class="flow">
          {#if application.actions.rescindApplication}
            <Button size="small" class="[ w-full ]" kind="danger" on:click={() => { reasonAction = 'rescind' }}>Rescind benefit</Button>
          {/if}
          {#if application.actions.restoreApplication}
            <Button size="small" class="[ w-full ]" kind="danger-ghost" on:click={() => { reasonAction = 'restore' }}>Restore benefit</Button>
          {/if}
        </div>
      </InfoCard>
    {/if}
  </svelte:fragment>
  <ReviewerQuestions {sections} {lastStageKey} {appRequest} {application} {promptIndicator} {promptStatusReasons} {basicRequestData} bind:loading/>
</ApproveLayout>


{#if reasonAction}
  <PanelFormDialog
    title={reasonActionInfo.title}
    open
    on:cancel={onReasonCancel}
    on:saved={onReasonSaved}
    validate={onReasonValidate}
    submit={onReasonSubmit}
    submitText={reasonActionInfo.submitText}
    centered
  >
    <div>{reasonActionInfo.instructions}</div>
    <FieldTextArea path="reason" labelText={`Reason to ${reasonAction} this benefit.`} required notNull rows={4} />
    <div class="bx--form__helper-text">This reason will be recorded in the request activity and included in the email sent to the applicant.</div>
  </PanelFormDialog>
{/if}

{#if showUpdateNoteDialog && noteBeingEdited}
  <PanelFormDialog
    title="Update Note"
    bind:open={showUpdateNoteDialog}
    on:cancel={() => { showUpdateNoteDialog = false; noteBeingEdited = undefined }}
    on:saved={onUpdateNoteSaved}
    validate={onUpdateNoteValidate}
    submit={onUpdateNoteSubmit}
    submitText="Save"
    disableSaveUntilChanged={true}
    centered
    preload={{
      content: noteBeingEdited.content,
      persistent: noteBeingEdited.persistent
    }}
  >
    <FieldTextArea path="content" labelText="Note" required notNull rows={6} />
    <!--
    {#if appRequest.actions.createPersistentNote}
      <FieldCheckbox path="persistent" labelText="Persistent (show on the applicant's profile)" />
    {/if}
    -->
  </PanelFormDialog>
{/if}

<PanelFormDialog
  title="New application note"
  bind:open={showAddNoteDialog}
  on:cancel={() => { showAddNoteDialog = false }}
  on:saved={onAddNoteSaved}
  validate={onAddNoteValidate}
  submit={onAddNoteSubmit}
  submitText="Save note"
  centered
>
  <div>Write a note for this application.</div>
  <FieldTextArea path="content" labelText="Note" required notNull rows={6} placeholder="Enter your note here." />
  <div class="bx--form__helper-text">This note will only be visible to other reviewers who access this application.</div>
  <!-- {#if appRequest.actions.createPersistentNote}
    <FieldCheckbox path="persistent" labelText="Persistent (show on the applicant's profile)" />
  {/if}
  -->
</PanelFormDialog>

<PanelDialog
  title="Application Notes"
  bind:open={showNotesDialog}
  on:cancel={() => { showNotesDialog = false }}
  cancelText="Close"
  on:submit={() => { showNotesDialog = false; showAddNoteDialog = true }}
  submitText="Add a note"
  centered
  size="large"
>
  <div class="notes-list flow">
    {#each notes as note (note.id)}
      <CommentCard
        content={note.content}
        authorName={note.author.fullname}
        authorLogin={note.author.login}
        createdAt={note.createdAt}
        actions={[
          { label: 'Edit', icon: Edit, onClick: () => editNote(note) },
          { label: 'Delete', icon: TrashCan, onClick: () => deleteNote(note.id) }
        ]}
      />
    {:else}
      <p>No application notes. Add note to see it here.</p>
    {/each}
  </div>
</PanelDialog>

<style>
  .active-note {
    padding: 4px 8px;
  }

  :global(.content):has(.notes-list) {
    max-height: calc(90vh - 1.5rem - 64px);
    background-color: var(--cds-ui-01);
  }

  .app-actions {
    width: fit-content;
  }
  .app-actions :global(.bx--select) {
    width: auto;
  }
</style>