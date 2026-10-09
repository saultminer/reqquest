<script lang="ts">
  import { FieldTextInput, PanelFormDialog } from '@txstate-mws/carbon-svelte'
  import { InlineNotification, Modal, NotificationActionButton, Tab, TabContent, Tabs } from 'carbon-components-svelte'
  import { keyby } from 'txstate-utils'
  import { invalidate } from '$app/navigation'
  import { page } from '$app/stores'
  import { api, MissingDefinitionNotification, PeriodPanel } from '$internal'
  import type { PageData } from './$types'
  import { uiRegistry } from '../../../../local'

  export let data: PageData
  $: ({ programs, period } = data)

  $: programsByKey = keyby(programs, 'key')
  $: programTitles = Object.fromEntries(programs.map(p => [p.key, p.title])) as Record<string, string>
  $: sharedProgramRequirements = programs.reduce<Record<string, string[] | undefined>>((acc, curr) => {
    curr.requirements.forEach(r => {
      acc[r.key] ??= []
      acc[r.key]!.push(curr.key)
    })
    return acc
  }, {})

  // Modal State
  let sharedModal: { open: boolean, requirementKey: string | null } = { open: false, requirementKey: null }

  type Program = PageData['programs'][number]
  type Requirement = PageData['programs'][number]['requirements'][number]
  type Prompt = PageData['programs'][number]['requirements'][number]['prompts'][number]

  let editingConfiguration = false
  let editingConfigurationType: 'prompt' | 'requirement' | 'program' | undefined = undefined
  let editingConfigurationDef: Requirement | Prompt | Program | undefined
  let editingConfigurationFetched: any

  function closeConfigurationDialog () {
    editingConfiguration = false
    editingConfigurationType = undefined
    editingConfigurationDef = undefined
    editingConfigurationFetched = undefined
  }

  function onClick (type: 'prompt' | 'requirement' | 'program', def: Requirement | Prompt | Program) {
    return async () => {
      editingConfigurationFetched = type === 'program' ? {} : await api.getConfigurationFetched(period.id, def.key)
      editingConfiguration = true
      editingConfigurationType = type
      editingConfigurationDef = def
    }
  }

  async function onSubmit (data: any) {
    const { success, messages } = await api.updateConfiguration($page.params.id!, editingConfigurationDef!.key, data, false)
    return {
      success,
      messages,
      data
    }
  }

  async function onValidate (data: any) {
    const { messages } = await api.updateConfiguration($page.params.id!, editingConfigurationDef!.key, data, true)
    return messages
  }

  async function onSaved () {
    await invalidate('api:getPeriodConfigurations')
    closeConfigurationDialog()
  }

  const openModal = (key: string) => () => {
    sharedModal = { open: true, requirementKey: key }
  }

  async function confirmReview () {
    await api.markPeriodReviewed(period.id, false)
    await invalidate('api:getPeriodConfigurations')
  }

  $:enabledPrograms = programs.filter(p => p.enabled)
  $:disabledPrograms = programs.filter(p => !p.enabled)

</script>

<!-- Configuring Period: {period.name}{#if period.code} ({period.code}){/if} -->

{#if !period.reviewed}
  <InlineNotification kind='warning' lowContrast title={`${period.name} period configurations:`} subtitle={`Please confirm when ${period.name} configuration updates are complete`} >
    <svelte:fragment slot="actions">
      <NotificationActionButton on:click={confirmReview}>Confirm Review</NotificationActionButton>
    </svelte:fragment>
  </InlineNotification>
{/if}

<Tabs autoWidth>
  <Tab label={`Enabled Programs (${enabledPrograms.length})`} />
  <Tab label={`Disabled Programs (${disabledPrograms.length})`} />
  <svelte:fragment slot='content'>
    <TabContent>
      {#each enabledPrograms as program (program.key)}
        <PeriodPanel {program} {sharedProgramRequirements} {programTitles} {openModal} {onClick} {uiRegistry} />
      {/each}
    </TabContent>
    <TabContent>
      {#each disabledPrograms as program (program.key)}
        <PeriodPanel {program} {sharedProgramRequirements} {programTitles} {openModal} {onClick} {uiRegistry} />
      {/each}
    </TabContent>
  </svelte:fragment>
</Tabs>

{#if editingConfiguration && editingConfigurationDef != null}
  {#if editingConfigurationType === 'program'}
    <PanelFormDialog open submit={onSubmit} validate={onValidate} title="Rename Program" on:cancel={closeConfigurationDialog} on:saved={onSaved} preload={editingConfigurationDef.configuration.data}>
      <p class="mb-4">These names apply to this period only. Leave a field blank to use the program's default name.</p>
      <FieldTextInput path="title" labelText="Title" placeholder={editingConfigurationDef.title} maxlength={255} />
      <FieldTextInput path="navTitle" labelText="Navigation title" helperText="Shorter name shown in navigation. Defaults to the title above when blank." placeholder={'navTitle' in editingConfigurationDef ? editingConfigurationDef.navTitle : undefined} maxlength={255} />
    </PanelFormDialog>
  {:else if editingConfigurationType === 'prompt'}
    {@const def = uiRegistry.getPrompt(editingConfigurationDef.key)}
    <PanelFormDialog open submit={onSubmit} validate={onValidate} title="Edit Configuration" on:cancel={closeConfigurationDialog} on:saved={onSaved} preload={editingConfigurationDef.configuration.data} fetched={editingConfigurationFetched} let:data>
      {#if def?.configureComponent == null}
        <MissingDefinitionNotification kind="prompt" definitionKey={editingConfigurationDef.key} />
      {:else}
        <svelte:component this={def.configureComponent} {data} fetched={editingConfigurationFetched} />
      {/if}
    </PanelFormDialog>
  {:else}
    {@const def = uiRegistry.getRequirement(editingConfigurationDef.key)}
    <PanelFormDialog open submit={onSubmit} validate={onValidate} title="Edit Configuration" on:cancel={closeConfigurationDialog} on:saved={onSaved} preload={editingConfigurationDef.configuration.data} fetched={editingConfigurationFetched} let:data>
      {#if def?.configureComponent == null}
        <MissingDefinitionNotification kind="requirement" definitionKey={editingConfigurationDef.key} />
      {:else}
        <svelte:component this={def.configureComponent} {data} fetched={editingConfigurationFetched}/>
      {/if}
    </PanelFormDialog>
  {/if}
{/if}

<Modal
  passiveModal
  bind:open={sharedModal.open}
  modalHeading="Shared Requirements"
  >
    {@const sharedPrograms = sharedProgramRequirements[sharedModal.requirementKey!]?.map(key => programsByKey[key]) ?? []}
    {#each sharedPrograms as p (p.key)}
      <p>{p.title}</p>
      <hr/>
    {/each}
</Modal>
