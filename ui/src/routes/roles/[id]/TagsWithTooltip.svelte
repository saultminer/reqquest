<script lang="ts">
  import { TooltipDefinition } from 'carbon-components-svelte'
  import { groupby } from 'txstate-utils'

  export let row: { tags: { categoryLabel: string, label: string, description?: string | null }[] }

  // past this many tags the restrictions read better as a list per category than inline
  const THRESHOLD = 5
  $: categories = Object.entries(groupby(row.tags, 'categoryLabel'))
</script>

{#if row.tags.length > THRESHOLD}
  {#each categories as [categoryLabel, tags], i (categoryLabel)}
    {#if i > 0}<br />{/if}
    <div>
      <strong>{categoryLabel}</strong>
      <ul>
        {#each tags as tag, tagIndex (tagIndex)}
          <li>
            {#if tag.description}
              <TooltipDefinition tooltipText={tag.description} portalTooltip>{tag.label}</TooltipDefinition>
            {:else}
              {tag.label}
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/each}
{:else}
  {#each categories as [categoryLabel, tags], i (categoryLabel)}
    {#if i > 0}<br />{/if}
    <strong>{categoryLabel}</strong>:
    {#each tags as tag, tagIndex (tagIndex)}
      {#if tag.description}
        <TooltipDefinition tooltipText={tag.description} portalTooltip>{tag.label}</TooltipDefinition>
      {:else}
        {tag.label}
      {/if}{#if tagIndex < tags.length - 1},{' '}{/if}
    {/each}
  {/each}
{/if}
