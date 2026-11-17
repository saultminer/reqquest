<script lang="ts">
  import { toasts } from '@txstate-mws/svelte-components'
  import { Loading } from "carbon-components-svelte"
  import { Button, Select, SelectItem } from 'carbon-components-svelte'
  import { InfoCard, translateMutations } from '@reqquest/ui'
  import { phaseChangeMutations, type PhaseChangeMutations } from '@reqquest/ui'
  import { invalidateAll } from '$app/navigation'
  import { api, type BasicRequestData } from '$internal/api'
  import type { PageData } from '../../routes/requests/[id]/approve/[programKey]/$types'
  import { uiRegistry } from '$local'
  import DocumentExport from 'carbon-icons-svelte/lib/DocumentExport.svelte'
  import { exportTitle } from '../appreq-utils.js'
  import PrintExport from './PrintExport.svelte'

  
  export let application: PageData['appRequest']['applications'][0]
  export let basicRequestData: BasicRequestData
  export let requestId: string

  $: loading = false



  let printExport: PrintExport

  // prints the reviewer export in place
  async function exportRequest () {
    if (!basicRequestData) return
    try {
      // this screen only knows the one request, so ask whether the applicant has others in the period
      const count = await api.countAppRequestsInPeriod(basicRequestData.applicant.login, basicRequestData.period.id)
      await printExport.print(requestId, {
        reviewerView: true,
        title: exportTitle({ id: requestId, period: basicRequestData.period }, uiRegistry, count > 1, basicRequestData.applicant.fullname),
        subtitle: `Complete ${uiRegistry.getWord('appRequest').toLowerCase()} details for review.`
      })
    } catch (error) {
      toasts.add({ type: 'error', title: `Could not export ${uiRegistry.getWord('appRequest').toLowerCase()}`, message: 'An unknown error occurred.' })
      console.error('Error exporting application:', error)
    }
  }

  let appRequestAction: '' | PhaseChangeMutations | 'reopen' | 'close' = ''
  async function onAppRequestAction () {
    loading = true
    if ((phaseChangeMutations as readonly string[]).includes(appRequestAction)) {
      await appRequestPhaseChange(appRequestAction as PhaseChangeMutations)
    } else if (appRequestAction === 'close') {
      await closeRequest()
    } else if (appRequestAction === 'reopen') {
      await reopenRequest()
    }
    appRequestAction = ''
    loading = false
  }

  async function appRequestPhaseChange (action: PhaseChangeMutations) {
    const response = await api.appRequestPhaseChange(requestId, action)
    await invalidateAll()
    loading = false
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: 'Action Failed',
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: `Successfully ${translateMutations[action]}.`
      })
    }
    await invalidateAll()
  }

  async function closeRequest () {
    const response = await api.closeAppRequest(requestId)
    await invalidateAll()
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: `Could not close ${uiRegistry.getWord('appRequest').toLowerCase()}`,
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: `${uiRegistry.getWord('appRequest')} closed.`
      })
    }
    
  }

  async function reopenRequest () {
    const response = await api.reopenAppRequest(requestId)
    await invalidateAll()
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: `Could not reopen ${uiRegistry.getWord('appRequest').toLowerCase()}`,
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: `${uiRegistry.getWord('appRequest')} reopened.`
      })
    }
  }

  let appAction: '' | 'advanceWorkflow' | 'reverseWorkflow' = ''
  async function onAppAction () {
    if (appAction === 'advanceWorkflow') {
      await advanceWorkflow()
    } else if (appAction === 'reverseWorkflow') {
      await reverseWorkflow()
    }
  }

  async function advanceWorkflow () {
    loading = true
    const response = await api.advanceWorkflow(application.id)     
    await invalidateAll()    
    loading = false   
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: 'Could not advance application',
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: 'Application advanced.'
      })
    }    
  }

  async function reverseWorkflow () {
    loading = true
    const response = await api.reverseWorkflow(application.id)     
    await invalidateAll()    
    loading = false   
    if (!response.success) {
      toasts.add({
        type: 'error',
        title: 'Could not reverse application workflow',
        message: response.messages.map(m => m.message).join('\n') || 'An unknown error occurred.'
      })
    } else {
      toasts.add({
        type: 'success',
        message: 'Application workflow reversed.'
      })
    }
  }
</script>

{#if loading}  
    <Loading />    
{/if}

<PrintExport bind:this={printExport} {uiRegistry} />

<InfoCard title='Reviewer Actions'>
<div slot='header-right'>
  <Button aria-label='export' on:click={exportRequest} kind="secondary" size="small" icon={DocumentExport} class="ml-[32px]" />
</div>
  <div class="flow">
    <!-- <Select bind:selected={appAction} labelText="Next step" size="sm">
      <SelectItem value="" text="Choose one" />
      <SelectItem disabled={!application.actions.advanceWorkflow} value="advanceWorkflow" text="Mark complete" />
      <SelectItem disabled={!application.actions.reverseWorkflow} value="reverseWorkflow" text={'Return to ' + (application.previousWorkflowStage?.title ?? 'Review')} />
    </Select>
    <Button disabled={!appAction} on:click={onAppAction} size="small" class="[ w-full ]">Update program</Button> -->

    {#if basicRequestData}
      <Select bind:selected={appRequestAction} labelText={`${uiRegistry.getWord('appRequest')} action`} size="sm">
        <SelectItem value="" text="Choose one" />
          <SelectItem disabled={!basicRequestData.actions.completeReview} value="completeReview" text="Complete Review" />
          <SelectItem disabled={!basicRequestData.actions.completeRequest} value="completeRequest" text="Complete Request" />
          <SelectItem disabled={!basicRequestData.actions.reopen} value="reopen" text="Reopen Request" />
          <SelectItem disabled={!basicRequestData.actions.close} value="close" text="Close Request" />
          <SelectItem disabled={!basicRequestData.actions.returnToApplicant} value="returnToApplicant" text="Return To Applicant" />
          <SelectItem disabled={!basicRequestData.actions.returnToOffer} value="returnToOffer" text="Return To Offer" />
          <SelectItem disabled={!basicRequestData.actions.returnToReview} value="returnToReview" text="Return To Review" />
          <SelectItem disabled={!basicRequestData.actions.returnToNonBlocking} value="returnToNonBlocking" text="Return To Final Workflow Tasks" />
          <SelectItem disabled={!basicRequestData.actions.submit} value="submitAppRequest" text="Submit On Behalf Of Applicant" />
          <SelectItem disabled={!basicRequestData.actions.acceptOffer} value="acceptOffer" text="Accept Offer On Behalf Of Applicant" />
      </Select>
      <Button disabled={!appRequestAction} on:click={onAppRequestAction} size="small" class="[ w-full ]">Update application</Button>
    {/if}
  </div>
</InfoCard>