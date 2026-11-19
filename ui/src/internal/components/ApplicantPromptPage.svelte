<script lang="ts">
  /**
   * This page collects prompt data from the applicant. Only one route exists per
   * prompt, even if the prompt is shared between multiple applications. We should
   * be able to figure out which application we are in based on the full state of
   * the app request since the prompt should only be visible in a single spot.
   */

  import { Form, FormInlineNotification, confirmationStore } from '@txstate-mws/carbon-svelte'
  import type { FormStore } from '@txstate-mws/svelte-forms'
  import { Button, InlineNotification } from 'carbon-components-svelte'
  import { getContext } from 'svelte'
  import { get, type Writable } from 'svelte/store'
  import { goto, invalidate } from '$app/navigation'
  import type { ResolvedPathname } from '$app/types'
  import { statusReasonsToFeedback, statusReasonsToFieldFeedback, type StatusReason } from '@reqquest/ui'
  import { uiRegistry } from '$local'
  import { api } from '../api.js'
  import type { PageData } from '../../routes/requests/[id]/apply/[promptId]/$types.js'
  import ButtonLoadingIcon from './ButtonLoadingIcon.svelte'
  import MissingDefinitionNotification from './MissingDefinitionNotification.svelte'


  export let data: Awaited<PageData['applicantPromptPromise']> & { dataVersion: number }
  export let statusReasons: StatusReason[] = []
  $: ({ prompt, appRequest: appRequestForExport, dataVersion } = data)
  $: def = uiRegistry.getPrompt(prompt.key)
  let liveStatusReasons: StatusReason[] | undefined
  $: resetLiveStatusReasons(statusReasons)
  $: currentStatusReasons = liveStatusReasons ?? statusReasons
  $: statusFeedback = statusReasonsToFeedback(currentStatusReasons, { blamedOnly: true, statuses: uiRegistry.statusReasonNotificationStatuses(prompt.key, 'applicant') })
  const nextHref = getContext<Writable<{ nextHref: ResolvedPathname, prevHref: ResolvedPathname | undefined }>>('nextHref')

  let store: FormStore | undefined
  let continueAfterSave = false
  $: hasPreviousPrompt = $nextHref.prevHref != null

  async function handleBack () {
    const previousHref = $nextHref.prevHref
    if (previousHref) {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- already resolved
      await goto(previousHref)
    }
  }

  function resetLiveStatusReasons (..._: any[]) {
    liveStatusReasons = undefined
  }

  function fieldFeedback (reasons: StatusReason[] | undefined) {
    return statusReasonsToFieldFeedback(reasons)
  }

 async function onSubmit (data: any) {
    const { success, messages, data: newData, statusReasons: reasons } =  await api.updatePrompt(prompt.id, data, false, dataVersion, await confirmInvalidatedOverride())
    if (reasons) liveStatusReasons = reasons
    return {
      success,
      messages: [...messages, ...fieldFeedback(reasons)],
      data: newData[prompt.key]
    }
  }

  async function onValidate (data: any) {
    const { messages, statusReasons: reasons } = await api.updatePrompt(prompt.id, data, true, dataVersion)
    if (reasons) liveStatusReasons = reasons
    return [...messages, ...fieldFeedback(reasons)]
  }

  async function onSaved () {
    if (continueAfterSave) {
      // Bug issue that became apparent with loaders. 
      // only refresh nav/answered state, not this prompt page. read the store directly with
      // get() rather than $nextHref/prompt.answered because its stale until reload reactive updates.
      await invalidate('request:apply:nav')
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- already resolved
      await goto(get(nextHref).nextHref)
    } else {
      await invalidate('request:apply')
    }
  }

  async function confirmInvalidatedOverride() {
   return (prompt.invalidated && !$store?.hasUnsavedChanges) 
    ? await confirmationStore.confirm(
        'Corrections are required, but no changes have been made.  Can you confirm that all data is correct, and does not require changes?',
        {
          title: 'Confirm data is correct',
          yesText: 'Yes',
          noText: 'No'
        }
      )
    : false 
  }

  let lastPromptId: string | undefined
  $: if (prompt.id !== lastPromptId) {
    lastPromptId = prompt.id
    store = undefined
    liveStatusReasons = undefined
  }
</script>

{#key prompt.id}
  <div class="prompt-intro flow max-w-screen-md mx-auto pt-10 px-6">
    <!-- svelte-ignore a11y_autofocus -->
    <h2 id="prompt-title" tabindex="-1" autofocus class="font-bold text-2xl leading-normal text-center">{prompt.title}</h2>
    <p class="text-center"> {prompt.description}</p>
  </div>
  {#if def == null}
    <div class="max-w-screen-md mx-auto px-6 pt-6">
      <MissingDefinitionNotification kind="prompt" definitionKey={prompt.key} />
      {#if hasPreviousPrompt}
        <Button kind="ghost" on:click={handleBack}>Back</Button>
      {/if}
    </div>
  {:else}
  <Form class={def.applicantPromptPage?.formClass ?? uiRegistry.config.applicantPromptPage?.formClass} bind:store hideFallbackMessage unsavedWarning submit={onSubmit} validate={onValidate} preloadAsDraft={!prompt.hasSavedData} preload={prompt.preloadData} on:saved={onSaved} let:data>
    <svelte:component this={def.formComponent} {data} appRequestId={appRequestForExport.id} appRequestData={appRequestForExport.data} prestageData={{latest: prompt.prestageData, current: appRequestForExport.data[prompt.key]?.__prestage}} fetched={prompt.fetchedData} configData={prompt.configurationData} gatheredConfigData={prompt.gatheredConfigData}  invalidated={prompt.invalidated} invalidatedReason={prompt.invalidatedReason} statusReasons={currentStatusReasons} />
    {#if statusFeedback.length}
      <div class={def.applicantPromptPage?.statusReasonInlineNotificationClass ?? uiRegistry.config.applicantPromptPage?.statusReasonInlineNotificationClass}>
        {#each statusFeedback as message}
          <FormInlineNotification {message} />
        {/each}
      </div>
    {/if}
    <svelte:fragment slot="submit" let:submitting>
      <div class='form-submit flex gap-12 justify-center mt-16'>
        {#if hasPreviousPrompt}
          <Button kind="ghost" on:click={handleBack}>Back</Button>
        {/if}
        <Button icon={submitting && !continueAfterSave ? ButtonLoadingIcon : null} type="submit" kind="secondary" disabled={submitting} on:click={() => { continueAfterSave = false }}>Save</Button>
        <Button icon={submitting && !continueAfterSave ? ButtonLoadingIcon : null} type="submit" disabled={submitting} on:click={() => { continueAfterSave = true }}>Continue</Button>
      </div>
    </svelte:fragment>    
      <!-- Correction inline prompt notification -->
    {#if prompt.invalidated && !$store?.hasUnsavedChanges}
      <InlineNotification
        class={def.applicantPromptPage?.invalidatedInlineNotificationClass ?? uiRegistry.config.applicantPromptPage?.invalidatedInlineNotificationClass}
        kind="warning-alt"
        title='Corrections needed'
        hideCloseButton={true}
        lowContrast
        subtitle={prompt.invalidatedReason ?? 'Must update form data before continuing'}
      />
    {/if}    
  </Form>  
  {/if}
{/key}

