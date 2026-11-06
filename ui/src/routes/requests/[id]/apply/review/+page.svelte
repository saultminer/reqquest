<script lang="ts">
  import { toasts } from '@txstate-mws/svelte-components'
  import { Button, Loading } from 'carbon-components-svelte'
  import Touch_1 from 'carbon-icons-svelte/lib/Touch_1.svelte'
  import { getContext } from 'svelte'
  import type { Writable } from 'svelte/store'
  import { afterNavigate, goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import type { ResolvedPathname } from '$app/types'
  import { api, ApplicationDetailsView } from '$internal'
  import { enumAppRequestStatus } from '@reqquest/ui'
  import type { PageData } from './$types'
  import { uiRegistry } from '$local'
  import { enumIneligiblePhases } from '@reqquest/ui'

  /**
   * This page will allow applicants to review all the information they've
   * entered so far, and to navigate to any prompts that need correction, then
   * allows them to submit the app request.
   */
  export let data: PageData
  $: ({ appRequestForExport, prequalPrompts, postqualPrompts, applicationsForNav } = data)

  const cfg = uiRegistry.config.applicantReview
  const maxWidth = cfg?.maxWidth ?? uiRegistry.config.applicantReviewMaxWidth ?? true

  const nextHref = getContext<Writable<{ nextHref?: ResolvedPathname, prevHref?: ResolvedPathname }>>('nextHref')
  $: previousHref = nextHref ? $nextHref.prevHref : undefined

  $: loading = false

  async function handleBack () {
    if (previousHref) {
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- already resolved
      await goto(previousHref)
    }
  }

  async function onSubmit () {
    loading = true
    const resp = await api.appRequestPhaseChange(appRequestForExport.id, 'submitAppRequest')
    loading = false
    if (resp.success) {
      toasts.add({ type: 'success', title: cfg?.submitSuccessTitle ?? 'Submission Succeeded', message: cfg?.submitSuccessMessage ?? 'Successfully submitted application for review' })
      await goto(resolve('/dashboards/applicant'))
    } else {
      toasts.add({ type: 'error', title: cfg?.submitFailureTitle ?? 'Submission Failed', message: resp.messages.map(m => m.message).join('\n') || (cfg?.submitFailureMessage ?? 'There was an error submitting your application. Please try again later.') })
    }
  }

  afterNavigate(({ from }) => {
    if (from?.url?.pathname) previousHref = from.url.pathname + from.url.search
    const h2 = document.querySelector('h2')
    if (h2) {
      h2.tabIndex = -1
      h2.focus()
    }
  })
</script>
{#if loading}
  <Loading />
{/if}
<div class:max-w-screen-md={maxWidth} class:mx-auto={maxWidth}>
  <ApplicationDetailsView
    appRequest={appRequestForExport}
    applications={applicationsForNav}
    appData={appRequestForExport.data}
    {prequalPrompts}
    {postqualPrompts}
    {uiRegistry}
    title={cfg?.title ?? "Review your application"}
    subtitle={cfg?.subTitle ?? "Confirm the benefits shown are the ones you are requesting and that your responses are correct, or make changes before submitting."}
    ineligibleTitle={cfg?.ineligibleTitle}
    ineligibleHelpText={cfg?.ineligibleHelpText}
    noProgramsMessage={cfg?.noProgramsMessage}
    expandable={false}
    showWarningsInline={true}
    showAppRequestStatus={false}
    statusDisplay="icons"
  >
    <svelte:fragment slot="footer">
      <footer class="[ mt-6 ] flow">
        {#if uiRegistry.config.supportUrl}
          <p class="text-center">{cfg?.supportText ?? 'If you think this was a mistake please review your answers or reach out through the support page.'}</p>
        {/if}
        <div class="footer-actions">
          {#if previousHref}
              <Button kind="ghost" on:click={handleBack}>{cfg?.backButtonText ?? 'Back'}</Button>
          {/if}
          {#if uiRegistry.config.supportUrl}
              <Button kind="ghost" href={uiRegistry.config.supportUrl}>{cfg?.supportButtonText ?? 'Support'}</Button>
          {/if}
          {#if appRequestForExport.status === enumAppRequestStatus.READY_TO_SUBMIT}
            <Button icon={Touch_1} on:click={onSubmit}>{cfg?.submitButtonText ?? 'Submit application'}</Button>
          {/if}
        </div>
      </footer>
    </svelte:fragment>
  </ApplicationDetailsView>
</div>
<style>
  .footer-actions {
    display: flex;
    gap: 3rem;
    justify-content: center;
    margin-top: 2rem;
  }
</style>
