<script lang="ts">
  import { api, AnnouncementBanner } from "$internal"
  import type { FormStore } from '@txstate-mws/svelte-forms'
  import IntroPanel from "$internal/components/IntroPanel.svelte"
  import { FieldCheckbox, FieldDateTime, FieldRadio, FieldTextArea, FieldTextInput, FieldToggle, Form, TagSet } from "@txstate-mws/carbon-svelte"
  import type { PageData } from "../announcement/$types"
  import { Button } from 'carbon-components-svelte'
  import { invalidateAll } from "$app/navigation"
  import { toasts } from "@txstate-mws/svelte-components"
  import TextClearFormat from "carbon-icons-svelte/lib/TextClearFormat.svelte";


  export let data: PageData
  $: ({ anouncement, canManage } = data)

  let store: FormStore | undefined

  async function submit (data: any) {
    const { id, addLink, isActive, ...rest } = data
    const { success, messages, data: newData } = id ? await api.updateAnnouncement(id, rest, false) : await api.createAnnouncement(rest, false)
    if (success) toasts.add({ message: 'This announcement has been saved.', title: 'Success', type: 'success' })
    return {
      success,
      messages,
      data: newData
    }
  }

  async function validate (data: any) {
    const { id, addLink, isActive, ...rest } = data
    const { messages } = id ? await api.updateAnnouncement(id, rest) : await api.createAnnouncement(rest)
    return messages
  }

  async function saved () {
    await invalidateAll()
  }

  async function reset () {
    if (anouncement?.id) await api.deleteAnnouncement(anouncement.id)
    await invalidateAll()
    store?.reset()
    store?.setField('type', 'toggle')
  }

  $: isActive = anouncement?.isActive ?? false

</script>
<IntroPanel
  title="Applicant dashboard message"
  subtitle='This is a time-sensitive message that will automatically display to applicants when enabled or scheduled.'
>
  <div class="flex items-center gap-2">
    <TagSet
      tags={isActive ? [{ label: 'Active', type: 'green' }] : [{ label: 'Inactive', type: 'purple' }]}
      tagType="status"
      tagSize="sm"
    />
    <span class="text-sm">{isActive ? 'This message is currently displaying to applicants.' : 'This message is not currently displaying to applicants.'}</span>
  </div>
</IntroPanel>

<Form
  let:data
  submit={canManage ? submit : undefined}
  validate={canManage ? validate : undefined}
  bind:store
  on:saved={saved}
  hideFallbackMessage
  preload={anouncement ? { ...anouncement, addLink: anouncement?.link || anouncement?.linkText } : undefined}
>
  <FieldRadio
    path='type'
    required
    readonly={!canManage}
    labelText="Display duration"
    defaultValue='toggle'
    class="md:w-[645px]"
    items={[
      { label: 'Toggle on and off', value: 'toggle' },
      { label: 'Date range', value: 'date' }
    ]} />
    {#if data.type === 'toggle'}
      <FieldToggle path='enabled' readonly={!canManage} hideLabel labelText='Enable/Disable' labelA='Message inactive' labelB='Message active' />
    {:else}
      <div class="md:w-[645px] flow datetime-full">
        <FieldDateTime path='start' disabled={!canManage} labelText='Start date' helperText='Leave blank to start displaying as soon as it is saved.' defaultTime='24:00'/>
        <FieldDateTime path='end' disabled={!canManage} labelText='End date' helperText='How long the message displays. Leave blank to display indefinitely.' defaultTime='24:00' />
        <div class="flex justify-end mt-0">
          <Button size='small' kind='ghost' disabled={!canManage} on:click={() => { store?.setField('start', undefined); store?.setField('end', undefined)}} icon={TextClearFormat}>Clear dates</Button>
        </div>
      </div>
    {/if}

    <div class="md:w-[645px] flow">
      <FieldTextArea rows={1} required disabled={!canManage} path='subject' labelText='Message title' maxCount={40} class="md:w-[645px] textarea"/>
      <FieldTextArea required disabled={!canManage} path='body' labelText='Message text' maxCount={125} class="md:w-[645px]"/>
    </div>

    <FieldCheckbox path='addLink' disabled={!canManage} labelText='Add link' on:change={(e: any) => {
      if (!e.target.checked) {
        store?.setField('linkText', undefined)
        store?.setField('link', undefined)
      }
    }} />

    {#if data.addLink}
      <div class="flex flex-col sm:flex-row gap-4 md:w-[645px] addLink">
        <FieldTextArea required disabled={!canManage} class='textarea w-full' maxCount={30} rows={1} path='linkText' labelText='Link text' />
        <FieldTextInput required disabled={!canManage} class='w-full' path='link' labelText='URL' />
      </div>
    {/if}


    {#if data.subject && data.body}
      <div class='w-full'>
        <AnnouncementBanner subject={data.subject} body={data.body} link={data.link} linkText={data.linkText} />
      </div>
    {:else}
      <div class="bg-[var(--cds-ui-01)] p-4 gap-8 md:w-[645px]">
        <p>No message to display</p>
        <p class="text-sm text-[--cds-text-02]">Nothing will be shown to applicants until a message is configured.</p>
      </div>
    {/if}
  
    <div slot='submit' class="flex gap-4">
      {#if canManage}
        <Button type='submit'>Save</Button>
        <Button kind='ghost' on:click={reset} icon={TextClearFormat}>Reset</Button>
      {/if}
    </div>
</Form>

<style>
  /* Stretch FieldDateTime (date input + time input + am/pm select) across the full form width. */
  .datetime-full :global(.picker-row) {
    gap: .5rem;
  }
  .datetime-full :global(.picker-row > *) {
    flex-grow: 1;
    width: 100%;
  }
  .datetime-full :global(.bx--text-input__field-wrapper) {
    width: 100% !important;
  }
  .datetime-full :global(.bx--date-picker-input__wrapper),
  .datetime-full :global(.bx--date-picker--single),
  .datetime-full :global(.bx--date-picker-container),
  .datetime-full :global(.flatpickr-wrapper),
  .datetime-full :global(input.bx--date-picker__input),
  .datetime-full :global(.bx--time-picker .bx--select-input),
  .datetime-full :global(.bx--time-picker),
  .datetime-full :global(.bx--time-picker__input),
  .datetime-full :global(.bx--time-picker__input-field) {
    width: 100%;
  }

  /* FieldRadio paints the checked dot maroon globally; Carbon's read-only dot uses the primary text color. */
  :global(.bx--radio-button-group--readonly .bx--radio-button:checked + .bx--radio-button__label .bx--radio-button__appearance::before) {
    background-color: var(--cds-text-01);
  }

  :global(.bx--text-area.textarea) {
    resize: none;
  }
  .addLink :global(.cs-field) {
    width: 100%;
  }
</style>