<script lang="ts">
  import { Button } from 'carbon-components-svelte'
  import { Panel } from '@txstate-mws/carbon-svelte'
  import { getContext } from 'svelte'
  import type { Writable } from 'svelte/store'
  import { afterNavigate } from '$app/navigation'
  import type { PageData } from './$types'
  import ProgressNavContainer from '../ProgressNavContainer.svelte'
  import { ApplicantProgramList, DEFAULT_APPLICANT_NO_PROGRAMS_MESSAGE, isHiddenFromApplicant, isIneligibleByApplicantRequirement } from '$internal'
  import { uiRegistry } from '$local'
  import { enumApplicationStatus } from '@reqquest/ui'

  export let data: PageData

  const cfg = uiRegistry.config.applicantPrograms
  const maxWidth = cfg?.maxWidth ?? true

  $: ({ applicationsForNav, appRequestForExport } = data)
  $: eligibleApplicationsForNav = applicationsForNav.filter(a => a.ineligiblePhase == null)
  $: ineligibleApplicationsForNav = applicationsForNav.filter(a => isIneligibleByApplicantRequirement(a) && !isHiddenFromApplicant(a))
  $: noProgramsToList = !eligibleApplicationsForNav.length && !ineligibleApplicationsForNav.length && applicationsForNav.some(isHiddenFromApplicant)

  let prevHref: string | undefined
  let nextHref: string | undefined
  const getNextHref = getContext<Writable<{ nextHref: string | undefined, prevHref: string | undefined }>>('nextHref')
  $: ({ prevHref, nextHref } = $getNextHref)

  afterNavigate(() => {
    const h2 = document.querySelector('h2')
    if (h2) {
      h2.tabIndex = -1
      h2.focus()
    }
  })
</script>

<ProgressNavContainer {maxWidth} title={cfg?.title ?? 'Your potential benefits'} subtitle={noProgramsToList ? (cfg?.noProgramsMessage ?? uiRegistry.config.applicantNoProgramsMessage ?? DEFAULT_APPLICANT_NO_PROGRAMS_MESSAGE) : (cfg?.subTitle ?? 'Based on your responses so far, you may be eligible for the benefits listed below.  If you believe you qualify for additional benefits, you may need to review your answers, complete additional questions, or provide supporting documentation before eligibility can be confirmed.')}>
  <div class:max-w-screen-md={maxWidth} class:mx-auto={maxWidth}>
    {#if eligibleApplicationsForNav.length > 0} 
      <ApplicantProgramList applications={eligibleApplicationsForNav} appRequest={appRequestForExport} />
    {/if}
    {#if eligibleApplicationsForNav.some(a => a.status === enumApplicationStatus.INELIGIBLE)}
      <div class="program-helptext">
        {cfg?.ineligibleHelpText ?? 'If you believe you should be eligible, read the tooltips above and review your answers. If you believe there is an error, please contact us.'}
      </div>
    {/if}
  </div>
  {#if ineligibleApplicationsForNav.length > 0}  
    <div class:max-w-screen-md={maxWidth} class:mx-auto={maxWidth}>
      <Panel title={cfg?.ineligibleTitle ?? 'Ineligible benefits'} expandable={true} expanded={true}>
        <ApplicantProgramList applications={ineligibleApplicationsForNav} appRequest={appRequestForExport} />
      </Panel>
    </div>
  {/if}
  {#if uiRegistry.config.supportUrl}
    <p class="text-center mt-6">{cfg?.supportText ?? 'If you think this was a mistake please review your answers or reach out through the support page.'}</p>
  {/if}
  <div class='form-submit flex gap-12 justify-center mt-16'>
    {#if prevHref}
      <Button kind="ghost" href={prevHref}>{cfg?.backButtonText ?? 'Back'}</Button>
    {/if}
    {#if uiRegistry.config.supportUrl}
      <Button kind="ghost" href={uiRegistry.config.supportUrl}>{cfg?.supportButtonText ?? 'Support'}</Button>
    {/if}
    <Button type="submit" href={nextHref}>
      {#if nextHref?.endsWith('/review')}
        {cfg?.reviewButtonText ?? `Review ${uiRegistry.getWord('appRequest')}`}
      {:else}
        {cfg?.continueButtonText ?? 'Continue'}
      {/if}
    </Button>
  </div>

</ProgressNavContainer>

<style>
  .program-helptext {
    text-align: center;
    font-size: 0.9rem;
  }
</style>
