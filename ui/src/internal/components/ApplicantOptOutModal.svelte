<script lang="ts">
  import { Form, PanelFormDialog } from '@txstate-mws/carbon-svelte'
  import type { FormStore } from '@txstate-mws/svelte-forms'
  import { afterNavigate, invalidate, invalidateAll } from '$app/navigation'
  import { uiRegistry } from '$local'
  import { api, type PromptForEditing } from '../api.js'
  import { Loading } from "carbon-components-svelte";
  import MissingDefinitionNotification from './MissingDefinitionNotification.svelte'
  import { statusReasonsToFieldFeedback, type AppRequestForDetails, type OptOutApplication, type StatusReason } from '@reqquest/ui'

  export let open = false
  export let optIn = false
  export let prompt: PromptForEditing
  export let appRequest: AppRequestForDetails
  export let optOutSelected: OptOutApplication | undefined

  $: def = uiRegistry.getPrompt(prompt.key)
  let loading = false
  // from the latest validate/submit response; stands in for the saved reasons while the user edits
  let liveStatusReasons: StatusReason[] | undefined

  // statusReasonNotifications only governs the notification below a form
  function fieldFeedback (reasons: StatusReason[] | undefined) {
    return statusReasonsToFieldFeedback(reasons)
  }


  let store: FormStore | undefined

  async function submit (data: any) {
    loading = true
    try {      
      const { success, messages, data: newData, statusReasons: reasons } = await api.updatePrompt(prompt.id, data, false)
      if (!success) loading = false
      if (reasons) liveStatusReasons = reasons
      return { success, messages: [...messages, ...fieldFeedback(reasons)], data: newData?.[prompt.key] }
    } catch (e) {
      loading = false
      throw e
    }
  }

  async function saved () {
    open = false
    loading = false
    invalidateAll()
  }

  async function onValidate (data: any) {
    const { messages, statusReasons: reasons } = await api.updatePrompt(prompt.id, data, true)
    if (reasons) liveStatusReasons = reasons
    return [...messages, ...fieldFeedback(reasons)]
  }

  let lastPromptId: string | undefined
  $: if (prompt.id !== lastPromptId) {
    lastPromptId = prompt.id
    store = undefined
    liveStatusReasons = undefined
  }
</script>

{#if loading}
  <Loading />
{/if}

<PanelFormDialog
  let:data
  bind:store
  centered
  open={open}
  on:cancel={() => { open = false }}
  validate={onValidate}
  on:saved={saved}
  disableSaveUntilChanged={true}
  {submit}
  title={`${optIn ? 'Opt in to' : 'Opt out of'} ${optOutSelected?.title}?`}
  submitText={optIn ? 'Opt in' : 'Opt out'}
  cancelText="Cancel"
  preload={prompt.preloadData}
  preloadAsDraft={!prompt.hasSavedData} 
  >
    {#if def?.formComponent == null}
      <MissingDefinitionNotification kind="prompt" definitionKey={prompt.key} />
    {:else}
    <svelte:component this={def.formComponent} {data} appRequestId={appRequest.id} appRequestData={appRequest.data} prestageData={{latest: prompt.prestageData, current: appRequest.data[prompt.key]?.__prestage}} fetched={prompt.fetchedData} configData={prompt.configurationData} gatheredConfigData={prompt.gatheredConfigData} invalidated={prompt.invalidated} invalidatedReason={prompt.invalidatedReason} statusReasons={liveStatusReasons ?? optOutSelected?.prompt.statusReasons ?? []} />
    {/if}
</PanelFormDialog>
