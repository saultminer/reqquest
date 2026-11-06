<script lang="ts">
  import { ColumnList, FieldCheckboxList, FieldHidden, FieldMultiselect, FieldSelect, Panel, PanelFormDialog, Toasts } from '@txstate-mws/carbon-svelte'
  import { toasts } from '@txstate-mws/svelte-components'
  import { Modal, TooltipDefinition } from 'carbon-components-svelte'
  import Add from 'carbon-icons-svelte/lib/Add.svelte'
  import Edit from 'carbon-icons-svelte/lib/Edit.svelte'
  import TrashCan from 'carbon-icons-svelte/lib/TrashCan.svelte'
  import { setContext } from 'svelte'
  import { pick, ucfirst } from 'txstate-utils'
  import { invalidate } from '$app/navigation'
  import { api, IntroPanel } from '$internal'
  import type { AccessRoleGrantCreate, AccessRoleGrantUpdate, AccessTagInput } from '@reqquest/ui'
  import type { PageData } from './$types'
  import ControlWithTooltip from './ControlWithTooltip.svelte'
  import TagsWithTooltip from './TagsWithTooltip.svelte'

  export let data: PageData
  $: ({ role, controlGroups, controlGroupLookup } = data)

  $: grants = role.grants.filter(g => g.allow)
  $: exceptions = role.grants.filter(g => !g.allow)

  setContext('controlGroupLookup', () => controlGroupLookup)

  // the multiselect only renders option text, so a tag's description (e.g. a program's other titles)
  // goes on a second line of the label, styled as helper text below - and the filter matches it too
  function tagItems (tags: { value: string, label: string, description?: string | null }[]) {
    return tags.map(t => ({ value: t.value, label: t.description ? `${t.label}\n${t.description}` : t.label }))
  }
  type AccessRoleGrantCreateForm = Omit<AccessRoleGrantCreate, 'tags'> & { tags: Record<string, string[]> }
  type AccessRoleGrantUpdateForm = Omit<AccessRoleGrantUpdate, 'tags'> & { tags: Record<string, string[]> }
  function transformFromAPI (data: PageData['role']['grants'][number]): AccessRoleGrantUpdateForm {
    return {
      ...pick(data, 'controls', 'allow'),
      controlGroup: data.controlGroup.name,
      tags: data.tags.reduce((acc: Record<string, string[]>, curr) => ({ ...acc, [curr.category]: [...(acc[curr.category] ?? []), curr.tag] }), {})
    }
  }
  function transformToAPI<T extends { tags?: Record<string, string[]> }> (data: T): Omit<T, 'tags'> & { tags: AccessTagInput[] } {
    return {
      ...data,
      tags: Object.entries(data.tags ?? {}).flatMap(([category, tags]) => tags.map(tag => ({ category, tag })))
    }
  }

  let showGrantEdit = false
  let grantToEdit: PageData['role']['grants'][number] | undefined
  let grantToEditInput: AccessRoleGrantUpdateForm | undefined
  function onGrantEdit (row: PageData['role']['grants'][number]) {
    return () => {
      showGrantEdit = true
      grantToEdit = row
      grantToEditInput = transformFromAPI(row)
    }
  }
  function onGrantDelete (row: PageData['role']['grants'][number]) {
    return () => {
      grantToDelete = row
    }
  }
  function onCloseEdit () {
    showGrantCreate = false
    showGrantEdit = false
    grantToEdit = undefined
    grantToEditInput = undefined
  }
  async function onSaveGrant (event: CustomEvent<AccessRoleGrantCreateForm | AccessRoleGrantUpdateForm>) {
    const controlGroupName = event.detail.controlGroup
    if (!controlGroupName) {
      console.error('No control group in form submission')
      return
    }
    const grantName = controlGroupLookup[controlGroupName].title
    if (!grantName) {
      console.error('Control group not found in lookup')
      return
    }
    const isEdit = !!grantToEdit
    const type = isEdit ? (grantToEdit!.allow ? 'grant' : 'exception') : (grantCreateAllow ? 'grant' : 'exception')
    const action = isEdit ? 'edited' : 'added'
    toasts.add({
      type: 'success',
      title: `${ucfirst(type)} ${action}`,
      message: `The ${type} ${grantName} was successfully ${action}.`
    })
    await invalidate('api:getRoleDetails')
    onCloseEdit()
  }
  async function onEditSubmit (data: AccessRoleGrantUpdateForm) {
    const response = await api.updateGrant(grantToEdit!.id, transformToAPI(data), false)
    return { ...response, data }
  }
  async function onEditValidate (data: AccessRoleGrantUpdateForm) {
    const response = await api.updateGrant(grantToEdit!.id, transformToAPI(data), true)
    return response.messages
  }

  let showGrantCreate = false
  let grantCreateAllow = true
  async function onCreateSubmit (data: AccessRoleGrantCreateForm) {
    const response = await api.createGrant(role.id, transformToAPI(data), false)
    return { ...response, data }
  }
  async function onCreateValidate (data: AccessRoleGrantCreateForm) {
    const response = await api.createGrant(role.id, transformToAPI(data), true)
    return response.messages
  }

  let grantToDelete: PageData['role']['grants'][number] | undefined
  function closeDeleteConfirmation () {
    grantToDelete = undefined
  }
  async function executeDelete () {
    try {
      if (!grantToDelete) {
        console.error('No grant selected for deletion')
        return
      }
      const type = grantToDelete.allow ? 'grant' : 'exception'
      const grantName = controlGroupLookup[grantToDelete.controlGroup.name].title
      if (!grantName) {
        console.error('Control group not found in lookup')
        return
      }
      await api.deleteGrant(grantToDelete.id)
      toasts.add({
        type: 'success',
        title: `${ucfirst(type)} deleted`,
        message: `The ${type} ${grantName} was successfully deleted.`
      })
      await invalidate('api:getRoleDetails')
    } finally {
      closeDeleteConfirmation()
    }
  }
</script>

<IntroPanel title="{role.name} permissions" subtitle={role.description ?? ''}>
<div class="groups [ text-sm ] flow" style="--flow-space:0.5rem;">
    <h3 class="font-medium ">Groups</h3>
    <ul>
      {#each role.groups as group (group.groupName)}
        <li>{group.groupName}</li>
      {/each}
    </ul>
  </div>
</IntroPanel>
<div class="columnlist-wrap flow" style="--flow-space:3em;">
  <div class="role-list">
    <ColumnList
    title="Grants for Role: {role.name}"
    listActions={[
      {
        label: 'Add Grant',
        icon: Add,
        onClick: () => {
          showGrantCreate = true
          grantCreateAllow = true
        }
      }
    ]}
    columns={[
      { id: 'controlGroup', label: 'Grants', render: grant => grant.controlGroup.title },
      { id: 'controls', label: 'Controls', component: ControlWithTooltip },
      { id: 'tags', label: 'Restrictions', component: TagsWithTooltip }
    ]}
    rows={grants}
    actions={row => [
      {
        label: 'Edit',
        icon: Edit,
        onClick: onGrantEdit(row),
        disabled: !row.actions.update
      },
      {
        label: 'Delete',
        icon: TrashCan,
        onClick: onGrantDelete(row),
        disabled: !row.actions.delete
      }
    ]}
    />
  </div>

  <div class="role-list">
    <ColumnList
    title="Exceptions for Role: {role.name}"
    columns={[
      { id: 'controlGroup', label: 'Exceptions', render: grant => grant.controlGroup.title },
      { id: 'controls', label: 'Controls', render: grant => grant.controls.join(', ') },
      { id: 'tags', label: 'Restrictions', component: TagsWithTooltip }
    ]}
    noItemsKind='info'
    noItemsTitle=''
    noItemsSubtitle='No exceptions on this role.'
    rows={exceptions}
    listActions={[
      {
        label: 'Add Exception',
        icon: Add,
        onClick: () => {
          showGrantCreate = true
          grantCreateAllow = false
        }
      }
    ]}
    actions={row => [
      {
        label: 'Edit',
        icon: Edit,
        onClick: onGrantEdit(row),
        disabled: !row.actions.update
      },
      {
        label: 'Delete',
        icon: TrashCan,
        onClick: onGrantDelete(row),
        disabled: !row.actions.delete
      }
    ]}
    />
  </div>
</div>
{#if showGrantEdit && grantToEdit}
  {@const controlGroup = controlGroupLookup[grantToEdit.controlGroup.name]}
  <PanelFormDialog open title="Edit {grantToEdit.allow ? 'Grant' : 'Exception'}" submit={onEditSubmit} validate={onEditValidate} on:cancel={onCloseEdit} on:saved={onSaveGrant} preload={grantToEditInput} let:data>
    <FieldHidden path="allow" value={grantToEdit.allow} />
    <FieldHidden path="controlGroup" value={grantToEdit.controlGroup.name} />
    <FieldCheckboxList
      path="controls"
      legendText="Controls"
      items={controlGroup.controls.map(c => ({ value: c.name }))}
    >
      <svelte:fragment slot="labelText" let:item>
        {@const control = controlGroup.controls.find(c => c.name === item.value)}
        {#if control}
          <TooltipDefinition tooltipText={control.description} direction="bottom" align="start" portalTooltip>
            {control.name}
          </TooltipDefinition>
        {:else}
          {item.value}
        {/if}
      </svelte:fragment>
    </FieldCheckboxList>
    {#each controlGroup.tags as category (category.category)}
      <div class="tag-multiselect">
        <FieldMultiselect
          path="tags.{category.category}"
          titleText={category.label}
          helperText={category.description}
          label="Restrict to {category.label}"
          items={tagItems(category.tags)}
        />
      </div>
    {/each}
  </PanelFormDialog>
{:else if showGrantCreate}
  <PanelFormDialog open title="New {grantCreateAllow ? 'Grant' : 'Exception'}" submit={onCreateSubmit} validate={onCreateValidate} on:cancel={onCloseEdit} on:saved={onSaveGrant} let:data>
    <FieldHidden path="allow" value={grantCreateAllow} />
    {@const controlGroup = data.controlGroup ? controlGroupLookup[data.controlGroup] : undefined}
    <FieldSelect
      path="controlGroup"
      labelText="Control Group"
      items={controlGroups.map(st => ({ value: st.name, label: st.title }))}
      helperText={controlGroup?.description}
    />
    {#if controlGroup}
      <FieldCheckboxList
        path="controls"
        legendText="Controls"
        items={controlGroup.controls.map(c => ({ value: c.name }))}
      >
        <svelte:fragment slot="labelText" let:item>
          {@const control = controlGroup.controls.find(c => c.name === item.value)}
          {#if control}
            <TooltipDefinition tooltipText={control.description} direction="bottom" align="start" portalTooltip>
              {control.name}
            </TooltipDefinition>
          {:else}
            {item.value}
          {/if}
        </svelte:fragment>
      </FieldCheckboxList>

      {#each controlGroup.tags as category (category.category)}
        <div class="tag-multiselect">
          <FieldMultiselect
            path="tags.{category.category}"
            titleText={category.label}
            helperText={category.description}
            label="Restrict to {category.label}"
            items={tagItems(category.tags)}
            filterable
          />
        </div>
      {/each}
    {/if}
  </PanelFormDialog>
{:else if grantToDelete}
  <Modal
    open
    modalHeading="Delete {grantToDelete.allow ? 'Grant' : 'Exception'}"
    primaryButtonText="Delete"
    secondaryButtonText="Cancel"
    danger
    size="sm"
    on:click:button--primary={executeDelete}
    on:click:button--secondary={closeDeleteConfirmation}
    on:submit={executeDelete}
    on:close={closeDeleteConfirmation}
  >
    <p>Are you sure you want to delete this {grantToDelete.allow ? 'grant' : 'exception'}?<br><em>{controlGroupLookup[grantToDelete.controlGroup.name].title}</em></p>
    <p>This action cannot be undone.</p>
  </Modal>
{/if}

<style>
  .role-list :global(.column-list-head) {
    background: var(--cds-ui-03);
  }
  /* options carrying a description are two lines - the title, then the description as helper text.
     carbon-svelte's multiselect already lets unvirtualized options grow, but sets white-space: normal on
     the label with a five-class selector, so these need a sixth to keep the line break */
  .tag-multiselect :global(.bx--list-box .bx--list-box__menu-item .bx--list-box__menu-item__option .bx--checkbox-label-text) {
    white-space: pre-line;
    font-size: 0.75rem;
    line-height: 1rem;
    color: var(--cds-text-secondary);
  }
  .tag-multiselect :global(.bx--list-box .bx--list-box__menu-item .bx--list-box__menu-item__option .bx--checkbox-label-text::first-line) {
    font-size: 0.875rem;
    line-height: 1.125rem;
    color: var(--cds-text-primary);
  }
</style>
