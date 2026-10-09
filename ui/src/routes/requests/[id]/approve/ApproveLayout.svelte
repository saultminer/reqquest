<script lang="ts">
  import { api, getApplicationStatusInfo } from '$internal'
  import type { LayoutData } from '../$types.js'
  import { uiRegistry } from '../../../../local/index.js'
  import { enumApplicationStatus, enumRequirementStatus, InfoCard } from '$lib'
  import { Loading, Modal } from 'carbon-components-svelte'
  import { Information } from 'carbon-icons-svelte'
  import StatusMessageList from '$internal/components/StatusMessageList.svelte'
  import { getContext } from 'svelte'
  import { page } from '$app/stores'
  import { UISHELL_STICKY_CONTEXT, type UIShellStickyStore } from '@txstate-mws/carbon-svelte'

  export let basicRequestData: LayoutData['basicRequestData']
  let open = false

  const stickyShellHeader = getContext<UIShellStickyStore>(UISHELL_STICKY_CONTEXT)

  // the review page only loads the displayed program, so the dialog fetches every program's outcome when it opens
  type IneligibilityInfo = Awaited<ReturnType<typeof api.getIneligibilityInfo>>
  let ineligibilityInfo: IneligibilityInfo | undefined
  let loadingInfo = false
  async function openIneligibilityInfo () {
    open = true
    loadingInfo = true
    try {
      ineligibilityInfo = await api.getIneligibilityInfo($page.params.id!)
    } finally {
      loadingInfo = false
    }
  }

  $: optedOutPrograms = ineligibilityInfo?.applications
    .filter(curr => curr.requirements.flatMap(r => r.prompts).find(r => r.optOut))
    .reduce((acc, c) => {
      const optOutRequirement = c.requirements.find(r => r.prompts.some(p => p.optOut))
      return {
        ...acc,
        [c.id]: optOutRequirement?.status === enumRequirementStatus.DISQUALIFYING
      }
    }, {} as Record<string, boolean>) ?? {}
  $: ineligiblePrograms = ineligibilityInfo?.applications.filter(app => app.status === enumApplicationStatus.INELIGIBLE) ?? []

</script>

<div class="review-container">
  <div class="review-sidebar flow" style="--sticky-top: {$stickyShellHeader.height}px">
    <InfoCard
      noPrimaryAction
      title={basicRequestData.applicant.fullname}
      actions={[
        { label: 'Ineligibility Information', icon: Information, onClick: openIneligibilityInfo }
      ]}>
      <dl class="identifier">
        <dt>{uiRegistry.getWord('login')}</dt>
        <dd>{basicRequestData.applicant.login}</dd>
        {#each basicRequestData.applicant.otherIdentifiers as identifier (identifier.id)}
          <dt>{identifier.label}:</dt>
          <dd>{identifier.id}</dd>
        {/each}
      </dl>
      {#if uiRegistry.config.slots?.reviewerSidebarCard}
        <svelte:component this={uiRegistry.config.slots.reviewerSidebarCard} appRequest={basicRequestData} applicant={basicRequestData.applicant} {api} />
      {/if}
    </InfoCard>

    <slot name="sidebar" />
    {#if uiRegistry.config.slots?.reviewerSidebar}
      <svelte:component this={uiRegistry.config.slots.reviewerSidebar} appRequest={basicRequestData} applicant={basicRequestData.applicant} {api} />
    {/if}
  </div>
  <div class="review-content">
    <slot />
  </div>
</div>

<Modal passiveModal bind:open modalHeading="Ineligible programs">
  <div class='flex flex-col gap-4 text-base'>
    {#if loadingInfo}
      <Loading withOverlay={false} small />
    {:else if ineligiblePrograms.length && ineligibilityInfo}
      {#each ineligiblePrograms as application}
        {@const warningReqs = application.requirements.filter(r => r.status === 'WARNING' && r.statusReason)}
        {@const message = `${getApplicationStatusInfo(application.status, ineligibilityInfo.phase, ineligibilityInfo.closedAt, application.rescindedStatus)[0].label}${application.statusReason ?? optedOutPrograms[application.id] ? ':' : ''} ${optedOutPrograms[application.id] ? 'Opted out' : application.statusReason}`}
        <span class='py-2'>{application.title}</span>
        <StatusMessageList
          icon
          items={[{ id: '', message }]}
          variant="error"
          accordionTitle="Multiple warnings" />
        <StatusMessageList
          icon
          items={warningReqs.map(r => ({ id: r.id, message: r.statusReason! }))}
          variant="warning"
          accordionTitle="Multiple warnings" />
      {/each}
    {:else}
      <p class="text-center">No ineligible programs</p>
    {/if}
  </div>
</Modal>


<style>
  .review-container {
    display: flex;
    flex-direction: row-reverse;
    gap: 15px;
    padding: 15px;
    align-items: flex-start;
  }

  .review-sidebar {
    container-type: inline-size;
    width: min(20rem, 33%);
    position: sticky;
    top: calc(var(--sticky-top, 0px) + 15px);
    /* Cards taller than the viewport scroll within rather than being cut off. */
    max-height: calc(100dvh - var(--sticky-top, 0px) - 30px);
    overflow-y: auto;
  }

  .review-content {
    flex-grow: 1;
    container-type: inline-size;
  }

  @media (max-width: 800px) {
    .review-container {
      flex-direction: column-reverse;
      align-items: stretch;
    }

    .review-sidebar {
      width: 100%;
      position: static;
      max-height: none;
      overflow-y: visible;
    }
  }

  .identifier {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
    container-type: inline-size;
  }
  .identifier dt {
    font-weight: bold;
  }
  .identifier dd, .identifier dt {
    margin: 0;
    padding: 0;
  }
  @container (width < 18rem) {
    .identifier {
      grid-template-columns: 1fr;
    }
  }

  .ineligible-warning {
    padding: .625rem 0;
  }
</style>
