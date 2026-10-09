<script lang="ts">
  import { ActionSet, Panel, TagSet } from '@txstate-mws/carbon-svelte'
  import { Tab, TabContent, Tabs, Tag } from 'carbon-components-svelte'
  import { SettingsEdit } from 'carbon-icons-svelte'
  import { groupby, pluralize } from 'txstate-utils'
  import { invalidate } from '$app/navigation'
  import { page } from '$app/stores'
  import { api } from '../api.js'
  import type { UIRegistry } from '../../lib/registry.js'

  export let program: any
  export let sharedProgramRequirements: any
  /** program title by key, to name the program a shared requirement is listed under */
  export let programTitles: Record<string, string> = {}
  export let openModal: any
  export let onClick: any
  export let uiRegistry: UIRegistry

  const disablePeriodProgram = (requirementKey: string) => async () => {
    const res = await api.disablePeriodProgramRequirements($page.params.id!, requirementKey, true)
    await invalidate('api:getPeriodConfigurations')
  }

  const enablePeriodProgram = (requirementKey: string) => async () => {
    const res = await api.disablePeriodProgramRequirements($page.params.id!, requirementKey, false)
    await invalidate('api:getPeriodConfigurations')
  }

  type PeriodRequirement = { key: string, title: string, type: string, enabled: boolean, configuration: { actions: { update: boolean } }, prompts: { key: string, title: string, configuration: { actions: { update: boolean } } }[] }
  $: enabledRequirements = Object.entries(groupby(program.requirements.filter((r: PeriodRequirement) => r.enabled) as PeriodRequirement[], 'type'))
  $: disabledRequirements = program.requirements.filter((r: PeriodRequirement) => !r.enabled) as PeriodRequirement[]

  // configuration is stored once per period, not once per program, so a requirement shared with an earlier
  // program is shown in full there and abbreviated here - a page with many programs would otherwise repeat
  // the same prompts and settings under every one of them
  const sharedWith = (requirementKey: string): string[] => sharedProgramRequirements[requirementKey] ?? []
  const configuredUnder = (requirementKey: string): string | undefined => {
    const owners = sharedWith(requirementKey)
    return owners.length > 1 && owners[0] !== program.key ? owners[0] : undefined
  }
</script>
  <Panel title={program.title} expandable expanded noPrimaryAction actions={[{ label: 'Rename program', onClick: onClick('program', program), disabled: !program.configuration.actions.update }]}>
    {#each enabledRequirements as requrementEntries, i (i)}
    {@const type = requrementEntries[0]}
    {@const requirements = requrementEntries[1]}
    <Panel title='' expandable expanded>
      <div style="display: content" slot="headerLeft">
        <TagSet tags={[{ label: `Applicant: ${type}`, type: 'purple' }]} />
      </div>
      <div style="display: content" slot="headerRight">
        <TagSet tags={[{ label: `${requirements.length} ${pluralize('requirement', requirements.length)}`, type: 'yellow' }]} />
      </div>
      <Tabs autoWidth>
        <Tab label={`Enabled Requirements (${enabledRequirements.length})`} />
        <Tab label={`Disabled Requirements (${disabledRequirements.length})`} />
        <svelte:fragment slot='content'>
          <TabContent>
            {#each requirements as requirement (requirement.key)}
              {@const reqDef = uiRegistry.getRequirement(requirement.key)}
              {@const owner = configuredUnder(requirement.key)}
              {#if owner}
              <Panel title={requirement.title} noPrimaryAction actions={[{ label: 'Disable Requirement', onClick: disablePeriodProgram(requirement.key) }]}>
                <div style="display: content" slot="headerLeft">
                  <TagSet tags={[{ label: 'Requirement', type: 'yellow' }]} />
                </div>
                <div style="display: content" slot="headerRight">
                  <TagSet tags={[{ label: `Shared with ${sharedWith(requirement.key).length - 1} other ${pluralize('program', sharedWith(requirement.key).length - 1)}`, onClick: openModal(requirement.key) }]} />
                </div>
                <p class="shared-note">Configured once for the period. Its prompts and settings are listed under {programTitles[owner] ?? owner}; changes made there apply here too.</p>
              </Panel>
              {:else}
              <Panel title={requirement.title} expandable noPrimaryAction actions={[{ label: 'Configure requirement', onClick: onClick('requirement', requirement), disabled: reqDef?.configureComponent == null || !requirement.configuration.actions.update }, { label: 'Disable Requirement', onClick: disablePeriodProgram(requirement.key) }]}>
                <div style="display: content" slot="headerLeft">
                  <TagSet tags={[{ label: 'Requirement', type: 'yellow' }]} />
                </div>
                <!-- <Button on:click={onClick('requirement', requirement)} type="primary" size="small" icon={SettingsEdit} iconDescription="Edit Configuration" disabled={reqDef.configureComponent == null || !requirement.configuration.actions.update} />  -->
              <div style="display: content" slot="headerRight">
                {@const tags = sharedProgramRequirements[requirement.key]?.length > 1 ? [{ label: 'Shared', onClick: openModal(requirement.key) }] : []}
                <TagSet tags={tags} />
              </div>

              <ul class="prompts">
                  {#each requirement.prompts as prompt (prompt.key)}
                  {@const promptDef = uiRegistry.getPrompt(prompt.key)}
                  <li class="prompt justify-between">
                    <span>
                      <Tag type='green'>Prompt</Tag>{prompt.title}
                    </span>
                    <ActionSet
                      actions={[
                        // { label: 'View', icon: View },
                        { label: 'settings', icon: SettingsEdit, disabled: promptDef?.configureComponent == null || !prompt.configuration.actions.update, onClick: onClick('prompt', prompt) }
                      ]}
                    />
                  </li>
                  {/each}
                </ul>
              </Panel>
              {/if}
            {/each}
          </TabContent>
          <TabContent>
            {#each disabledRequirements as requirement (requirement.key)}
              <Panel title={requirement.title} actions={[{ label: 'Enable Requirement', onClick: enablePeriodProgram(requirement.key) }]}>
                Requirement: {requirement.title}
                <ul class="prompts">
                  {#each requirement.prompts as prompt (prompt.key)}
                    <li class="prompt">
                      Prompt: {prompt.title}
                    </li>
                  {/each}
                </ul>
              </Panel>
            {/each}
          </TabContent>
        </svelte:fragment>
      </Tabs>
    </Panel>
    {/each}
  </Panel>

<style>
  .shared-note {
    margin: 0;
    color: var(--cds-text-secondary, #525252);
  }
</style>
