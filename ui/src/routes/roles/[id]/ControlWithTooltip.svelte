<script lang="ts">
  import { TooltipDefinition } from 'carbon-components-svelte'
  import { getContext } from 'svelte'

  export let row: { controlGroup: { name: string }, controls: string[] }
  const controlGroupLookup = getContext<() => Record<string, { controls: { name: string, description: string }[] }>>('controlGroupLookup')()
  $: controlGroup = controlGroupLookup[row.controlGroup.name]
</script>

{#each row.controls as control, controlIndex}
  {@const controlInfo = controlGroup.controls.find(c => c.name === control)}
  <TooltipDefinition tooltipText={controlInfo?.description} portalTooltip>
    {controlInfo?.name ?? control}
  </TooltipDefinition>{#if controlIndex < row.controls.length - 1},{' '}{/if}
{/each}
