<script lang="ts">
  import { getAppRequestStatusInfo, getApplicationStatusInfo, applicantRequirementTypes, reviewRequirementTypes } from '../status-utils.js'
  import { DEFAULT_APPLICANT_NO_PROGRAMS_MESSAGE, isHiddenFromApplicant, isIneligibleByApplicantRequirement } from '../appreq-utils.js'
  import { Panel, TagSet } from '@txstate-mws/carbon-svelte'
  import { Button, InlineNotification, Tooltip } from 'carbon-components-svelte'
  import Edit from 'carbon-icons-svelte/lib/Edit.svelte'
  import Time from 'carbon-icons-svelte/lib/Time.svelte'
  import { DateTime } from 'luxon'
  import type { AnsweredPrompt, PromptSection, AppRequestForDetails, ApplicationForDetails, Scalars } from '@reqquest/ui'
  import { enumApplicationStatus, enumRequirementType } from '@reqquest/ui'
  import type { UIRegistry } from '@reqquest/ui'
  import RenderDisplayComponent from './RenderDisplayComponent.svelte'
  import ApplicantProgramList from './ApplicantProgramList.svelte'
  import WarningIconYellow from './WarningIconYellow.svelte'
  import { exportTimestamp } from '../util.js'

  // TODO: design alignement could reduce props here
  export let appRequest: AppRequestForDetails
  export let applications: ApplicationForDetails[]
  export let appData: Scalars['JsonData'] = {}
  export let prequalPrompts: AnsweredPrompt[] | undefined = undefined
  export let postqualPrompts: AnsweredPrompt[] | undefined = undefined
  export let loading = false
  export let uiRegistry: UIRegistry
  export let title = `View your ${uiRegistry.getWord('appRequest').toLowerCase()}`
  export let subtitle = 'Select document names to preview them.'
  export let expandable = true
  export let showWarningsInline = false
  export let showCorrectionsInline = false
  export let showAppRequestStatus = true
  export let statusDisplay: 'tags' | 'icons' = 'tags'
  export let showTooltipsAsText = false
  /** Apply print-export styles: hide app chrome and paginate by prompt row rather than by panel. */
  export let printMode = false
  /** Show an "Exported <date> at <time>" line under the title. Defaults on for print-export screens. */
  export let showExportTimestamp = printMode

  // refreshed on beforeprint so a printed/PDF copy carries the time it was actually exported
  let exportedAt = DateTime.now()
  /** Title of the panel listing applications the applicant is ineligible for. */
  export let ineligibleTitle = 'Ineligible benefits'
  /** Shown below the program list when a listed application is ineligible. Nothing shown when unset. */
  export let ineligibleHelpText: string | undefined = undefined
  export let noProgramsMessage: string | undefined = undefined

  const CORRECTABLE_STATUSES = ['STARTED', 'READY_TO_SUBMIT', 'DISQUALIFIED']

  $: canMakeCorrections = CORRECTABLE_STATUSES.includes(appRequest.status)
  $: eligibleApplications = applications.filter(a => a.ineligiblePhase == null)
  $: ineligibleApplications = applications.filter(a => isIneligibleByApplicantRequirement(a) && !isHiddenFromApplicant(a))
  $: noProgramsToList = !eligibleApplications.length && !ineligibleApplications.length && applications.some(isHiddenFromApplicant)

  // Group prompts by sections, with reviewer prompts nested within application sections
  $: sections = (() => {
    const sections: PromptSection[] = []

    // General Questions === PREQUAL prompts
    if (prequalPrompts?.length) {
      sections.push({ title: 'Eligibility screening questions', prompts: prequalPrompts })
    }

    // Application-Specific Questions with nested Reviewer Questions
    for (const application of applications) {
      const applicantPrompts = application.requirements
        .filter(r => applicantRequirementTypes.has(r.type))
        .flatMap(r => r.prompts).filter(p => !p.optOut)
      const reviewerPrompts = application.requirements
        .filter(r => reviewRequirementTypes.has(r.type))
        .flatMap(r => r.prompts)
      const workflowPrompts = application.requirements
        .filter(r => r.type === enumRequirementType.WORKFLOW)
        .flatMap(r => r.prompts)

      if (applicantPrompts.length || reviewerPrompts.length || workflowPrompts.length) {
        const subsections: PromptSection[] = []
        if (reviewerPrompts.length) subsections.push({ title: 'Reviewer Questions', prompts: reviewerPrompts })
        if (workflowPrompts.length) subsections.push({ title: 'Workflow Questions', prompts: workflowPrompts })
        sections.push({
          title: application.title,
          prompts: applicantPrompts,
          subsections,
          applicationStatus: application.status,
          applicationRescindedStatus: application.rescindedStatus
        })
      }
    }

    // Additional Questions === POSTQUAL prompts
    if (postqualPrompts?.length) {
      sections.push({ title: 'Additional Questions', prompts: postqualPrompts })
    }

    return sections
  })()

  function hasWarning (prompt: AnsweredPrompt) {
    return prompt.statusReasons.some(r => r.status === 'WARNING' || r.status === 'DISQUALIFYING')
  }

  function getWarnings (prompt: AnsweredPrompt) {
    return prompt.statusReasons.filter(r => r.status === 'WARNING' || r.status === 'DISQUALIFYING')
  }

  function needsCorrection (prompt: AnsweredPrompt) {
    return prompt.invalidated && prompt.invalidatedReason
  }
</script>

<svelte:window on:beforeprint={() => { exportedAt = DateTime.now() }} />

{#if appRequest}
  <div class="[ my-6 ] application-details flow" class:print-mode={printMode}>
    <!-- Application Status Panel -->
    <header class="[ mb-12 ] app-view-intro text-center">
      <h2 class="[ text-2xl mb-3 font-bold ]">{title}</h2>
      {#if subtitle}
        <p class="app-view-subtitle mb-3">{subtitle}</p>
      {/if}
      {#if showExportTimestamp}
        <p class="export-timestamp [ flex items-center justify-center gap-2 mb-3 ]">
          <Time aria-hidden="true" /> Exported {exportTimestamp(exportedAt)}
        </p>
      {/if}
    </header>
    <section class="prompt-section">
      <div class="status-content">
        {#if showAppRequestStatus}
          <dl class="status-list-item [ flex items-center justify-between px-2 py-3 border-b ]">
            <dt class="status-list-label font-medium">{uiRegistry.getWord('appRequest')} Status</dt>
            <dd class="px-2">
              <TagSet tags={getAppRequestStatusInfo(appRequest.status, appRequest.phase, appRequest.closedAt).tags} />
            </dd>
          </dl>
        {/if}

        <!-- Application Status List -->
        {#if eligibleApplications.length > 0}
          <ApplicantProgramList applications={eligibleApplications} {appRequest} viewMode={statusDisplay === 'tags'} {showTooltipsAsText} />
        {/if}
        {#if ineligibleHelpText && eligibleApplications.some(a => a.status === enumApplicationStatus.INELIGIBLE)}
          <p class="program-helptext">{ineligibleHelpText}</p>
        {/if}
        <!-- Ineligible Status List -->
         {#if ineligibleApplications.length > 0}
            <Panel title={ineligibleTitle} expandable={true} expanded={(eligibleApplications.length === 0)}>
              <ApplicantProgramList applications={ineligibleApplications} {appRequest} viewMode={statusDisplay === 'tags'} {showTooltipsAsText} />
            </Panel>
         {/if}
        {#if noProgramsToList}
          <p class="text-center">{noProgramsMessage ?? uiRegistry.config.applicantNoProgramsMessage ?? DEFAULT_APPLICANT_NO_PROGRAMS_MESSAGE}</p>
        {/if}
      </div>
    </section>

    <!-- Prompt Sections -->
    {#if loading}
      <Panel title="Loading...">
        <p>Loading prompt data...</p>
      </Panel>
    {:else if sections.length > 0}
      {#each sections as section (section.title)}
        {@const applicationStatusInfo = section.applicationStatus ? getApplicationStatusInfo(section.applicationStatus, appRequest.phase, appRequest.closedAt, section.applicationRescindedStatus) : undefined}
        <Panel title={section.title} {expandable} expanded>
          {#if section.prompts.length}
            <dl class="prompt-list">
              {#each section.prompts as prompt (prompt.id)}
                {@const def = uiRegistry.getPrompt(prompt.key)}
                <dt class="prompt-term [ font-medium ]">
                  {#if showWarningsInline && hasWarning(prompt)}
                    <Tooltip align="start">
                      <div class="icon" slot="icon">
                        <WarningIconYellow size={16} />
                      </div>
                      {#each getWarnings(prompt) as r, i (i)}
                        <p>
                          {r.status === 'WARNING' ? 'Warning' : 'Disqualifying'}{#if section.title !== r.programName}&nbsp;for {r.programName}{/if}<br>
                          {r.statusReason}
                        </p>
                      {/each}
                    </Tooltip>
                  {/if}
                  {#if showCorrectionsInline && canMakeCorrections && needsCorrection(prompt)}
                    <Tooltip align="start">
                      <div class="icon" slot="icon">
                        <WarningIconYellow size={16} />
                      </div>
                      <p>Corrections needed<br>{prompt.invalidatedReason}</p>
                    </Tooltip>
                  {/if}
                  {prompt.title}
                </dt>
                <dd class="prompt-answer flow" class:large={def?.displayMode === 'large'}>
                  <RenderDisplayComponent {def} appRequestId={appRequest.id} appData={appData} prompt={prompt} prestageData={{latest: prompt.prestageData, current: appRequest.data[prompt.key]?.__prestage}} configData={prompt.configurationData} gatheredConfigData={prompt.gatheredConfigData} statusReasons={prompt.statusReasons} />
                  {#if showCorrectionsInline && canMakeCorrections && needsCorrection(prompt)}
                    <div class="correction-notice">
                      <Button kind="ghost" size="small" icon={Edit} iconDescription="Edit this answer" href={`/requests/${appRequest.id}/apply/${prompt.id}`} class="edit-button" />
                      <InlineNotification kind="warning-alt" title="Corrections needed" subtitle={prompt.invalidatedReason ?? ''} hideCloseButton lowContrast />
                    </div>
                  {/if}
                </dd>
              {/each}
            </dl>
          {/if}

          <!-- Nested subsections (e.g., Reviewer Questions) -->
          {#if section.subsections}
            {#each section.subsections as subsection (subsection.title)}
              <Panel title={subsection.title} {expandable} expanded>
                <dl class="prompt-list">
                  {#each subsection.prompts as prompt (prompt.id)}
                    {@const def = uiRegistry.getPrompt(prompt.key)}
                    <dt class="prompt-term [ font-medium ]">
                      {#if showWarningsInline && hasWarning(prompt)}
                        <Tooltip align="start">
                          <div class="icon" slot="icon">
                            <WarningIconYellow size={16} />
                          </div>
                          {#each getWarnings(prompt) as r, i (i)}
                            <p>
                              {r.status === 'WARNING' ? 'Warning' : 'Disqualifying'}{#if section.title !== r.programName}&nbsp;for {r.programName}{/if}<br>
                              {r.statusReason}
                            </p>
                          {/each}
                        </Tooltip>
                      {/if}
                      {#if showCorrectionsInline && canMakeCorrections && needsCorrection(prompt)}
                        <Tooltip align="start">
                          <div class="icon" slot="icon">
                            <WarningIconYellow size={16} />
                          </div>
                          <p>Corrections needed<br>{prompt.invalidatedReason}</p>
                        </Tooltip>
                      {/if}
                      {prompt.title}
                    </dt>
                    <dd class="prompt-answer flow" class:large={def?.displayMode === 'large'}>
                      <RenderDisplayComponent {def} appRequestId={appRequest.id} appData={appData} prompt={prompt} prestageData={{latest: prompt.prestageData, current: appRequest.data[prompt.key]?.__prestage}} configData={prompt.configurationData} gatheredConfigData={prompt.gatheredConfigData} statusReasons={prompt.statusReasons} />
                      {#if showCorrectionsInline && canMakeCorrections && needsCorrection(prompt)}
                        <Button kind="ghost" size="small" icon={Edit} iconDescription="Edit this answer" href={`/requests/${appRequest.id}/apply/${prompt.id}`} class="edit-button" />
                      {/if}
                    </dd>
                    {#if showCorrectionsInline && canMakeCorrections && needsCorrection(prompt)}
                      <div class="correction-notice">
                        <InlineNotification kind="warning-alt" title="Corrections needed" subtitle={prompt.invalidatedReason ?? ''} hideCloseButton lowContrast />
                      </div>
                    {/if}
                  {/each}
                </dl>
              </Panel>
            {/each}
          {/if}
        </Panel>
      {/each}
    {:else}
      <Panel title="Prompts and Answers">
        <p>No prompts available for this {uiRegistry.getWord('appRequest').toLowerCase()}.</p>
      </Panel>
    {/if}

    {#if printMode}
      <div class="print-actions">
        <Button on:click={() => window.print()}>Print</Button>
      </div>
    {/if}

    <slot name="footer" />
  </div>
{:else}
  <p>No {uiRegistry.getWord('appRequest').toLowerCase()} selected</p>
{/if}

<style>
  .program-helptext {
    text-align: center;
    font-size: 0.9rem;
  }

  .app-view-subtitle {
    color: var(--cds-text-02);
    font-size: 0.9rem;
    /* margin-top: -0.5rem; */
    margin-bottom: 1rem;
  }

  .status-list-item {
    border-bottom: 1px solid var(--cds-border-subtle);
  }

  .prompt-answer :global(dl:not(.prompt-display-grid)) {
    padding-block-start:1em;
    display:grid;
    grid-template-columns: 1fr 1fr;
    row-gap:0.5rem;
  }

  .status-content dl {
    padding-block-start:1em;
    display:grid;
    grid-template-columns: 1fr 1fr;
    row-gap:0.5rem;
  }

  .status-content :global(.programs-container) {
    grid-template-columns: 1fr 1fr;
  }

  .status-list-item {
    border-color: var(--cds-border-subtle);
  }

  .status-list-label {
    color: var(--cds-text-01);
  }

  .prompt-list {
    display: grid;
    grid-template-columns: var(--prompt-list-columns, 1fr 1fr);
    align-items: stretch;
    row-gap: 0.5rem;
    background-color: #F2F2F2;
    padding-top: 0.5rem;
  }
  .prompt-list dt, .prompt-list dd {
    padding-top: 0.25rem;
  }

  .prompt-term {
    display: flex;
    gap:1em;
    color: var(--cds-text-01);
    border-bottom: 1px solid var(--cds-border-subtle);
    padding: 0.5rem 10px;
  }
  .prompt-term:has(+ .prompt-answer.large) {
    border-bottom: none;
  }

  .prompt-answer {
    color: var(--cds-text-02);
    border-bottom: 1px solid var(--cds-border-subtle);
    padding: 0.5rem 10px;
  }
  .prompt-answer.large {
    grid-column: span 2;
  }
  /* When a display component's root is a PromptDisplayGrid, hand it our column tracks
     via subgrid so its challenge/response rows align with the real prompt rows. */
  .prompt-answer.large:has(> :global(.prompt-display-grid)) {
    display: grid;
    grid-template-columns: subgrid;
    align-content: start;
    padding: 0;
    border-bottom: none;
    --prompt-display-subgrid: subgrid;
    --prompt-display-columns: var(--prompt-list-columns, 1fr 1fr);
    --prompt-display-row-padding: 0.5rem 10px;
    --prompt-display-challenge-padding-left: 10px;
    --prompt-display-row-gap: 0.5rem;
  }
  .prompt-answer.large:has(> :global(.prompt-display-grid)) > :global(*) {
    grid-column: 1 / -1;
  }
  .prompt-answer.large :global(.prompt-display-challenge) {
    font-weight: 500;
    color: var(--cds-text-01);
  }

  .correction-notice {
    grid-column: span 2;
    margin-bottom: 0.5rem;
  }

  .correction-notice :global(.bx--inline-notification) {
    max-width: 100%;
  }

  .prompt-answer :global(.edit-button) {
    float: right;
    margin-top: -0.5rem;
    --cds-icon-01: var(--cds-link-01);
  }

  .print-mode {
    /* keep the last row clear of the floating print button */
    padding-bottom: 4rem;
  }

  .print-actions {
    position: fixed;
    right: 2rem;
    bottom: 2rem;
    z-index: 10;
  }

  @media print {
    .print-mode {
      padding-bottom: 0;
    }

    .print-actions {
      display: none;
    }

    :global(body:has(.application-details.print-mode) .bx--header),
    :global(body:has(.application-details.print-mode) .breadcrumbs) {
      display: none !important;
    }

    /* Never mark the whole view or a whole panel break-inside: avoid — when either is
       taller than the space left on a page, the browser pushes it to the next page and
       leaves the first page nearly blank. Keep only small units together instead. */
    .print-mode :global(.panel) {
      margin-bottom: 1rem !important;
    }

    .print-mode :global(.panel-header) {
      break-after: avoid;
    }

    .print-mode .prompt-term,
    .print-mode .prompt-answer:not(.large) {
      break-inside: avoid;
    }
  }
</style>
