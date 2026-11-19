<script lang="ts">
  import { InlineNotification } from 'carbon-components-svelte'
  import type { PromptDefinition } from '@reqquest/ui'
  import type { StatusReason } from '@reqquest/ui'

  export let def: PromptDefinition | undefined
  export let appRequestId: string
  export let appData: Record<string, any>
  export let prompt: { key: string, answered: boolean, invalidated: boolean | null, invalidatedReason: string | null }  
  export let prestageData: Record<string, any>
  export let configData: Record<string, any>
  export let gatheredConfigData: Record<string, any>
  export let showInlineReviewNotification = false 
  // requirement status reasons aimed at this prompt, forwarded to the display component
  export let statusReasons: StatusReason[] = []

</script>

<svelte:boundary onerror={e => console.error(e)}>
  {#if !def?.displayComponent}
    <em>No display component registered.</em>
    <pre>{JSON.stringify(appData[prompt.key] ?? {}, null, 2)}</pre>
  {:else}
    <svelte:component this={def.displayComponent} {appRequestId} data={appData[prompt.key]} appRequestData={appData} {prestageData} {configData} {gatheredConfigData} invalidated={prompt.invalidated} invalidatedReason={prompt.invalidatedReason} {statusReasons} />
  {/if}
  {#if prompt.invalidated && showInlineReviewNotification}
    <InlineNotification class="mt-6 lg:mt-4" kind="warning" title="Applicant has made corrections:" subtitle={prompt.invalidatedReason ?? 'Requires review'} lowContrast hideCloseButton />
  {/if}
  {#snippet failed()}
    <div class="error">
      <div>Error Loading Component</div>
      <p>There was an error loading the display component for this prompt.</p>
    </div>
  {/snippet}
</svelte:boundary>

<style>
  .error div { font-weight: bold; }
</style>
