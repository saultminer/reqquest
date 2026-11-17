<script lang="ts">
  import { Panel } from '@txstate-mws/carbon-svelte'
  import { Button } from 'carbon-components-svelte'
  import { createEventDispatcher } from 'svelte'

  /** the program's title, e.g. "Post 9/11 GI Bill" */
  export let title: string
  /** the application's phase; only READY_TO_COMPLETE and COMPLETE are distinguished, anything else is "not ready" */
  export let phase: string
  /** the API offers completeApplication */
  export let canComplete = false
  /** the API offers reopenApplication - false for a program that completed on its own */
  export let canReopen = false
  /** how many required answers are still outstanding, shown while the program is not ready */
  export let requiredCount = 0

  const dispatch = createEventDispatcher<{ complete: undefined, reopen: undefined }>()

  $: state = phase === 'COMPLETE' ? 'complete' : phase === 'READY_TO_COMPLETE' ? 'ready' : 'notready'
  $: heading = state === 'complete'
    ? `${title} is complete`
    : state === 'ready'
      ? `${title} review is ready to complete.`
      : `${title} review is not ready to complete.`
  $: detail = state !== 'notready'
    ? 'All required questions have been answered for this program.'
    : requiredCount > 0
      ? `Resolve ${requiredCount} required ${requiredCount === 1 ? 'answer' : 'answers'}.`
      : 'Finish the remaining review steps for this program.'
</script>

<Panel title="Complete program review">
  <p class="completion-intro">Once you've answered all required questions and addressed any dependencies with other programs, you can finalize this program.</p>
  <div class="completion-status {state}" role="status">
    <div class="completion-text">
      <p class="completion-heading">{heading}</p>
      <p class="completion-detail">{detail}</p>
    </div>
    {#if state === 'complete'}
      {#if canReopen}
        <Button kind="secondary" on:click={() => dispatch('reopen')}>Edit review</Button>
      {/if}
    {:else}
      <Button disabled={state !== 'ready' || !canComplete} on:click={() => dispatch('complete')}>Complete review</Button>
    {/if}
  </div>
</Panel>

<style>
  .completion-intro {
    max-width: 60ch;
    margin-bottom: 0.75rem;
  }
  .completion-status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 1rem;
    padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    min-height: 4rem;
    border: 1px solid;
  }
  .completion-status.notready {
    background-color: var(--cds-notification-background-error, #fff1f1);
    border-color: var(--cds-support-error, #ff8389);
  }
  .completion-status.ready {
    background-color: var(--cds-notification-background-info, #edf5ff);
    border-color: var(--cds-support-info, #78a9ff);
  }
  .completion-status.complete {
    background-color: var(--cds-notification-background-success, #defbe6);
    border-color: var(--cds-support-success, #42be65);
  }
  .completion-text {
    flex: 1 1 16rem;
    min-width: 0;
  }
  .completion-heading {
    font-weight: 600;
  }
  .completion-detail {
    font-size: 0.75rem;
    color: var(--cds-text-02, #525252);
  }
</style>
