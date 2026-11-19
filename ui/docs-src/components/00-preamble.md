## Rules that apply to every file

The component preference ladder, in order. Go down a rung only when the rung above genuinely has
nothing:

1. **`@reqquest/ui`** - the ReqQuest layer. `QuestionnairePrompt`, `PromptDisplayGrid`/`PromptDisplayRow`,
   `InfoCard`, `CommentCard`, `FieldCardRadio`, `FieldCardCheckbox`.
2. **`@txstate-mws/carbon-svelte`** - the house component library. `ColumnList` over Carbon's
   `DataTable` in almost every situation.
3. **`carbon-components-svelte`** - raw Carbon, when nothing above fits.
4. **Raw HTML/CSS** - last resort, and reuse Carbon's CSS classes and `--cds-*` custom properties
   rather than inventing colors.

Everything else:

- **Svelte 5, but no runes.** `export let`, `$:`, `<slot>`, `$$slots`, `<svelte:fragment>`,
  `on:click`. The whole codebase is Svelte 4 syntax on the Svelte 5 compiler; do not mix in `$state`
  or `$props`.
- **SPA, no SSR.** SvelteKit with `adapter-static`. Nothing runs on a server; there is no
  `+page.server.ts`.
- **Icons** come from `carbon-icons-svelte`, deep-imported one per line -
  `import Launch from 'carbon-icons-svelte/lib/Launch.svelte'`. Never the package barrel; it pulls
  thousands of components into the bundle.
- **Dates** use luxon.
- **Member order** in a `.svelte` file: `<script>`, then markup, then `<style>`.
- **ESLint** is `eslint-config-love` plus `@stylistic`: 2-space indent, single quotes, no trailing
  comma, space before a function's paren, `arrow-parens: as-needed`.
- **Tailwind** is available and widely used in existing prompt components, but the framework's
  standing preference is to avoid it - it may be deprecated. Do not add new utility soup, and do not
  strip it out of files that already have it. One hard constraint if you do use it: the
  `@tailwindcss/container-queries` plugin is **not installed**, so `@[48rem]:` utilities compile to
  nothing and fail silently. Write a real `@container` rule against an element with
  `[container-type:inline-size]` instead.
- **Colors** come from Carbon custom properties (`--cds-text-02`, `--cds-border-subtle`,
  `--cds-support-03`, `--cds-link-primary`), never hex literals, so theming holds.
- **Toasts** come from `toasts.add()` in `@txstate-mws/svelte-components`.

## What "building UI" means in a ReqQuest project

A downstream ReqQuest project owns exactly one directory: **`ui/src/local`**. Routes, the `UIShell`,
the reviewer and applicant screens, and the GraphQL client all come from the framework - either from
`node_modules/@reqquest/ui` (what your editor and `svelte-check` see) or, in the production image,
from the GitHub source tarball the `ui/Dockerfile` untars at the tag pinned in
`package.json` → `reqquest.ui_base_tag`, which then does `rm -rf src/local` and copies yours in.

So a new screen is almost never a route. It is a **prompt**: one API-side definition supplying the
key, and one or two Svelte components on the UI side supplying the pixels.

### The prompt pair

Each prompt is a pair of colocated components, grouped in a folder per phase or program
(`prequal/`, `hazlewood/`, `reviewer/`):

```
ui/src/local/prequal/BenefitSituation.svelte         formComponent  - collects the answer
ui/src/local/prequal/BenefitSituationDisplay.svelte  displayComponent - renders it read-only
```

`displayComponent` is required; `formComponent` is optional, and leaving it out declares the prompt
as automation-filled. Both are registered together under the prompt's key.

### The props the framework hands your component

Both members of the pair are mounted with `<svelte:component>`, so they are untyped
(`Component<any>`) - declare with `export let` and only the ones you use.

| prop | form | display | what it is |
|---|---|---|---|
| `data` | yes | yes | the prompt's own answer object. In a form it is the live svelte-forms state; in a display it is the saved answer. |
| `appRequestData` | yes | yes | every prompt's data on this app request, keyed by prompt key. |
| `prestageData` | yes | yes | `{ latest, current }` - data staged by an automation before the prompt was shown. |
| `fetched` | yes | - | whatever the API definition's `fetch` returned; where dynamic option lists arrive. |
| `configData` | yes | yes | this prompt's own period configuration. |
| `gatheredConfigData` | yes | yes | configuration gathered from related definitions. |
| `invalidated` / `invalidatedReason` | yes | yes | set when a reviewer sent the prompt back for correction. |
| `appRequestId` | **sometimes** | yes | present on the applicant page, the opt-out modal, the display path, and the `formMode: 'full'` modal - but **not** on the reviewer's inline edit form. Guard it, or register `formMode: 'full'` if you truly need it. |
| `statusReasons` | yes | yes | `{ status, statusReason, programName, blamed, fieldReasons? }[]` - every requirement status and reason aimed at this prompt, across programs. `blamed` is true when the requirement's `resolve` named this prompt in `blame` (it may be a requirement other than this prompt's own, e.g. a reviewer requirement blaming an applicant answer); false when it named no prompt and the entry is the fallback attached to all of that requirement's prompts. The framework already renders the **blamed** entries below every edit form as inline notifications (see `statusReasonNotifications` below), so a form component normally needs nothing. Display components receive the same list and render nothing by default; call `statusReasonsToFeedback(statusReasons, { blamedOnly, statuses })` from `@reqquest/ui` to get `Feedback` objects for `FormInlineNotification`, passing `uiRegistry.statusReasonNotificationStatuses(key, 'applicant' | 'reviewer')` as `statuses` to follow the project's `statusReasonNotifications` configuration. `fieldReasons` is `{ fields, message?, status? }[]`: helper messages the requirement aimed at individual form fields (`fields` are dotted paths into this prompt's data), each falling back to the entry's `statusReason` and `status` when it gives none. Edit forms already show these underneath the matching inputs, as the user types and again after saving, so a form component needs nothing; in a form the list reflects the answer currently being edited, not only the saved one. A display component can call `statusReasonsToFieldFeedback(statusReasons)` to get one `Feedback` per field with its `path` set. Applicants get an empty list for reviewer-phase requirements the API redacts. |

`prestageData` has a trap worth knowing before you hit it. Read the **prop**, not the mutation:

```svelte
$: prestage = prestageData.latest ?? prestageData.current
$: if (data) data.__prestage = prestage   // still set it, so it gets submitted
```

Deriving your view from `data.__prestage` instead looks equivalent and is not: a property mutation
(rather than a reassignment) loses Svelte's cross-block invalidation on an SPA transition, and the
component renders empty until a hard refresh.

## Registering a prompt

Registration lives in `ui/src/local/index.ts`. Two things there are load-bearing and easy to get
wrong.

**Annotate the config literal, then construct the registry.** `UIRegistry`'s constructor takes a
widened `AnyUIConfig`, so `new UIRegistry({ ... })` inline type-checks *nothing*:

```ts
const config: UIConfig = {        // exhaustiveness is enforced HERE, by the annotation
  /* ... */
}
export const uiRegistry = new UIRegistry(config)
```

**Use the keyed-object form, never an array.** `prompts` is a total mapped type over the generated
`PromptKey` union, so a prompt the API defines and the UI forgot is a *build error*. An array can
only reject keys that do not exist; it can never require the ones that do, and it resolves duplicates
last-wins in silence. `requirements` and `programs` are partial by design - they carry only optional
decoration (an icon, a configure component) and every consumer optional-chains them - but they still
reject unknown keys.

Keys must be **literal**, one per line. A computed key cannot satisfy `PromptKey`, so a loop over a
program list defeats the whole mechanism even though it compiles.

```ts
import { UIRegistry, type UIConfig, type PromptDefinition, type PromptKey } from '@reqquest/ui'
import { GeneralTextSkeleton } from '@txstate-mws/carbon-svelte'
import BenefitSituation from './prequal/BenefitSituation.svelte'
import BenefitSituationDisplay from './prequal/BenefitSituationDisplay.svelte'

// Prompt skeletons are opt-in per prompt since reqquest 1.8.0. Without a `loader` the applicant
// apply route and the reviewer edit dialog render an empty area while the prompt's data is in
// flight. Every prompt here waits on a round-trip, so default them all; the delay keeps the
// skeleton from flashing on a fast or cached load.
const DEFAULT_PROMPT_LOADER = { skeletonComponent: GeneralTextSkeleton, delay: 200 }
type PromptRegistrations = Record<PromptKey, Omit<PromptDefinition, 'key'>>
function withDefaultLoader (prompts: PromptRegistrations): PromptRegistrations {
  for (const prompt of Object.values(prompts)) prompt.loader ??= DEFAULT_PROMPT_LOADER
  return prompts
}

const config: UIConfig = {
  appName: 'Veteran Affairs Certification Request',
  terminology: { appRequest: 'Request', login: 'Net ID', period: 'Term' },
  programs: { chapter_33: {}, hazlewood_veteran: {} },
  requirements: { eligibility_questions_prequal_req: {} },
  prompts: withDefaultLoader({
    benefit_situation_prompt: {
      formComponent: BenefitSituation,
      displayComponent: BenefitSituationDisplay
    },
    reviewer_course_info_cert_prompt: {
      formComponent: CourseInfo,
      displayComponent: CourseInfoDisplay,
      formMode: 'full'
    }
  })
}
export const uiRegistry = new UIRegistry(config)
```

### `PromptDefinition`

- **`displayComponent`** `Component` **(required)** - read-only rendering. Keep it compact; it appears
  in a long list of prompts.
- **`formComponent`** `Component` - the data-collection screen. Omit only for an automation-filled
  prompt; the applicant view cannot handle a prompt with no form, so applicant-facing prompts always
  need one.
- **`formMode`** `'small' | 'large' | 'full'` (default `'small'`) - the area the form is rendered in.
  `'small'` is about 8 lines at 320px; `'large'` about 32 lines at 800px; `'full'` is a full-screen
  modal, which also **disables autosave in the reviewer UI** and is what supplies `appRequestId` to
  the reviewer form. All three must stay responsive down to 320px.
- **`reviewerDialogButtonText`** `string` (default `'Review'`) - a reviewer question registered with
  `formMode: 'full'` gets a labeled button on the reviewer screen that opens its form in the
  full-height side dialog. This is that button's text and the dialog's title; name what the reviewer
  will look at, e.g. `'Review course information'`. Automation prompts and applicant prompts keep the
  edit pencil. The global fallback of the same setting lives on `UIConfig`.
- **`displayMode`** `'small' | 'large'` (default `'small'`) - there is deliberately no `'full'`,
  because the whole prompt list has to print on one page. Use `'large'` together with
  `PromptDisplayGrid` when one prompt collects several question/answer pairs.
- **`automation`** `boolean` - marks the prompt as automation-filled, visually distinct. Defaults to
  true when there is no `formComponent`, and makes `formMode` behave like `'full'`. If you set it
  *and* supply a form, consider a hidden field marking the data as human-written so automations stop
  overwriting it.
- **`configureComponent`** / **`configureDisplayComponent`** `Component` - per-period configuration
  form and its read-only twin, always rendered in a full-screen modal. They receive `data` and
  `fetched` only.
- **`icon`** `Component` - navigation icon.
- **`loader`** `{ skeletonComponent, delay? } | boolean` (default `false`) - see the snippet above.
- **`applicantPromptPage`** `{ formClass?, invalidatedInlineNotificationClass?, statusReasonInlineNotificationClass? }` -
  per-prompt override of the CSS applied to the framework `Form` that wraps applicant prompts, the
  corrections notice, and the wrapper around the status reason notices. The global version of the
  same setting lives on `UIConfig`.
- **`statusReasonNotifications`** `boolean | { <STATUS>?: boolean | { applicant?, reviewer? } }` -
  which requirement status reasons that `blame` this prompt the framework renders as inline
  notifications below its form component, and to whom. The audience is the UI surface, not the
  viewer's role: `applicant` is the applicant prompt page, the accept page and the opt-out modal;
  `reviewer` is the reviewer's inline and modal forms. Notices are styled like svelte-forms
  validation messages, keyed by status (DISQUALIFYING error, WARNING warning, PENDING info, MET
  success), describe the last *saved* answer and refresh after each save. A boolean switches every
  status for both audiences; an object names statuses, each as a boolean (both audiences) or
  `{ applicant?, reviewer? }` for one side. Resolution is layered **per status and per audience**:
  the built-in default (everything **except PENDING**, both audiences), then
  `UIConfig.statusReasonNotifications`, then this prompt's value - each layer changes only what it
  names. So `UIConfig: { PENDING: { reviewer: true } }` shows PENDING instructions to reviewers only,
  and a prompt with `{ DISQUALIFYING: { applicant: false } }` hides that one notice from the applicant
  while reviewers and every other status follow the global choice. `false` at either level renders
  nothing (for that prompt, or everywhere) - use the `statusReasons` prop in your own form component
  instead. `statusReasonsToFeedback(statusReasons, { blamedOnly, statuses })` from `@reqquest/ui`
  applies the same filters; pass `uiRegistry.statusReasonNotificationStatuses(key, audience)` as
  `statuses` if a display component should follow the project's configuration.

  This setting applies **only** to that below-form notification. The **per-field** messages a
  requirement attaches through `blame` (`{ prompt, fields, message, status }` on the API side) are
  not subject to it and always show, PENDING included: a requirement that wrote a message for a
  field means it to be seen. Those are delivered with the form's validation messages, so svelte-forms
  shows them under the matching `Field*` inputs with no work in the component, and they update on
  every validation pass - before the answer is saved - as well as after a save. A field message is
  styled by its own `status` when the requirement gave it one, otherwise by the requirement's
  status; that status is presentation only and never changes the requirement's outcome. An
  error-styled field message does not block saving. A `fields` path that matches no input in the
  form is not shown inline.

### Keys, and how they stay honest

`PromptKey`, `RequirementKey` and `ProgramKey` come from a generated declaration that augments
`@reqquest/ui`:

```ts
// ui/src/local/keys.generated.d.ts - GENERATED, commit it
export {}
declare module '@reqquest/ui' {
  interface ReqQuestKeys {
    prompts: 'benefit_situation_prompt' | 'veteran_ssn_prompt'
    requirements: 'eligibility_questions_prequal_req'
    programs: 'chapter_33'
  }
}
```

Three ways this silently does nothing, all of which look fine in an editor:

- **The `export {}` is load-bearing.** Without a top-level import or export the file is a global
  script and `declare module` *replaces* `@reqquest/ui` instead of augmenting it - every import from
  the package then fails with "has no exported member".
- **It must fall inside your tsconfig `include`**, or it augments nothing and every key type quietly
  degrades to `string`.
- **It goes stale.** Regenerate from the API project after adding, removing, renaming or re-keying a
  definition, and gate it in CI:

  ```
  node node_modules/@reqquest/api/dist/analysis/cli.js <api-project> \
    --emit-keys ../ui/src/local/keys.generated.d.ts --module '@reqquest/ui'
  node node_modules/@reqquest/api/dist/analysis/cli.js <api-project> \
    --check-keys ../ui/src/local/keys.generated.d.ts --module '@reqquest/ui'
  ```

  The generator builds a real TypeScript program over the API's `.ts` sources, so it is an
  API-repo tool. A UI repo that only consumes a published `@reqquest/api` can receive a declaration
  but cannot produce one. See `docs/downstream-setup.md` in the reqquest repo for the full procedure.

Nothing in the framework runs your type check for you. Add one line to your build - `svelte-check`
narrowed to `src/local/index.ts` is enough, and is what the framework itself does in
`ui/check-registry.js`. Without it, the only remaining net is runtime: `UIRegistry.warnIfMissing`
logs an ungated `console.error` naming the key, and `MissingDefinitionNotification` renders in place
of the missing component. That is degradation, not detection.

## Recipes

Each of these is a complete file. Adapt, do not extend into something clever.

### 1. Minimal applicant prompt

No intro text, one question. The framework already wraps you in a `Form`, so there is no `Form`,
no submit button, and no `validate`/`submit` here - the API definition owns validation.

```svelte
<script lang="ts">
  import { FieldRadioTile } from '@txstate-mws/carbon-svelte'
  export let fetched
  $: options = fetched.options ?? []
</script>

<div class="max-w-[550px] mx-auto mt-6">
  <FieldRadioTile
    required
    path="situation"
    items={options}
    orientation="horizontal"
    centerHorizontal
    descriptionVisibility="persistent"
  />
</div>
```

### 2. Applicant prompt with intro content and a conditional branch

`QuestionnairePrompt` supplies the `intro` slot, the external-links row, and the 800px centered
column. Note it has **no** `title` or `description` prop - the screen title comes from the API
definition. Put explanatory copy in the `intro` slot.

```svelte
<script lang="ts">
  import { QuestionnairePrompt } from '@reqquest/ui'
  import { ColumnList, FieldRadioTile, type ColumnDefinition } from '@txstate-mws/carbon-svelte'
  import { InlineNotification } from 'carbon-components-svelte'
  export let data
  export let prestageData

  $: prestage = prestageData.latest ?? prestageData.current
  $: if (data) data.__prestage = prestage
  $: courses = (prestage?.nodes?.client?.data?.courses ?? []) as Course[]

  // AJV can hand a FieldRadioTile boolean back as the string 'true'/'false'. Coerce before testing.
  $: scheduleWrong = data.scheduleCorrect === false || data.scheduleCorrect === 'false'

  // ColumnList rows must carry an `id` - ColumnDefinition<T> constrains T to { id: string | number }
  // and uses it to key the rows. A row type without one will not type-check.
  interface Course { id: string, subject: string, courseNumber: string, title: string }
  const columns: ColumnDefinition<Course>[] = [
    { id: 'subject', label: 'Subject', get: 'subject' },
    { id: 'courseNumber', label: 'Course', get: 'courseNumber' },
    { id: 'title', label: 'Title', get: 'title' }
  ]
  const yesNo = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]
</script>

<QuestionnairePrompt externalLinks={[{ url: 'https://registrar.example.edu', label: 'Registrar' }]}>
  <div slot="intro">
    <p>Confirm the schedule below matches what you are enrolled in this term.</p>
    <ColumnList {columns} rows={courses} title="Final schedule" />
    <FieldRadioTile
      boolean
      required
      path="scheduleCorrect"
      items={yesNo}
      orientation="horizontal"
      centerHorizontal
      descriptionVisibility="persistent"
    />
  </div>
  <div class:hidden={!scheduleWrong}>
    <InlineNotification
      kind="warning"
      title="Schedule not final."
      subtitle="Finish registration before continuing."
      lowContrast
      hideCloseButton
    />
  </div>
</QuestionnairePrompt>
```

### 3. Display component, aligned with the prompt list

When a prompt collects several question/answer pairs that should each read as its own row on the
review screens, make `PromptDisplayGrid` the **root element** of the display component and register
the prompt with `displayMode: 'large'`. The surrounding screens hand it their column tracks via CSS
subgrid, so its rows are indistinguishable from real prompt rows and wrap at the same breakpoints.
Root element matters - wrap it in a `<div>` and the subgrid handoff silently stops working.

```svelte
<script lang="ts">
  import { PromptDisplayGrid, PromptDisplayRow } from '@reqquest/ui'
  export let data
  const word = (v: unknown) => v == null ? '' : v ? 'Yes' : 'No'
</script>

<PromptDisplayGrid>
  <PromptDisplayRow challenge="Can provide SSN documentation?">{word(data.canProvide)}</PromptDisplayRow>
  <PromptDisplayRow challenge="Document type" indentLevel={1}>{data.docType ?? ''}</PromptDisplayRow>
  <PromptDisplayRow full>
    <em>Uploaded {data.files?.length ?? 0} document(s).</em>
  </PromptDisplayRow>
</PromptDisplayGrid>
```

For a single-value prompt, `displayMode: 'small'` and a plain paragraph is fine and correct - do not
reach for the grid to display one answer.

### 4. Reviewer prompt in a full-screen modal

`formMode: 'full'` gives you the whole screen and supplies `appRequestId`. Lay out reference material
and questions yourself.

```svelte
<script lang="ts">
  import { FieldRadio, FieldTextArea } from '@txstate-mws/carbon-svelte'
  import DocumentPreview from '../DocumentPreview.svelte'
  export let data
  export let appRequestId: string

  const yesNo = [{ value: true, label: 'Yes' }, { value: false, label: 'No' }]
  $: valid = data.documentValid === true || data.documentValid === 'true'
</script>

<div class="reviewer-layout">
  <section class="document">
    <!-- Reference material for the reviewer. `appRequestId` is what a document preview or an extra
         API call keys on, and it is the reason this prompt is registered `formMode: 'full'`. -->
    <DocumentPreview {appRequestId} promptKey="reviewer_document_prompt" fileProp="files" />
  </section>
  <section class="questions">
    <FieldRadio
      boolean
      required
      path="documentValid"
      legendText="Is the uploaded document valid?"
      items={yesNo}
      orientation="horizontal"
    />
    <!-- Hidden with CSS, not {#if}: the field must stay mounted so `conditional` can clear its
         value when the branch goes away. An {#if} unmounts it and the stale answer is submitted. -->
    <div class:hidden={valid}>
      <FieldTextArea
        path="rejectionReason"
        conditional={!valid}
        labelText="Why is it not valid?"
      />
    </div>
  </section>
</div>

<style>
  /* The container-queries Tailwind plugin is not installed, so `@[48rem]:` would be dead. */
  .reviewer-layout { container-type: inline-size; display: flex; flex-direction: column; gap: 1.5rem; }
  @container (min-width: 48rem) {
    .reviewer-layout { flex-direction: row; }
    .document, .questions { flex: 1; }
  }
</style>
```

### 5. Configuration component

Registered as `configureComponent` on a prompt or requirement. It receives `data` and `fetched`
only, and is always rendered in a full-screen modal.

```svelte
<script lang="ts">
  import { FieldNumber, FieldSelect } from '@txstate-mws/carbon-svelte'
  export let fetched
  $: terms = fetched?.terms ?? []
</script>

<FieldNumber path="minimumCreditHours" labelText="Minimum credit hours" />
<FieldSelect path="term" labelText="Term" items={terms} />
```

## Field idioms

Three patterns that are not obvious from the prop tables and cause real bugs when missed.

**Coerce booleans.** AJV can return a `FieldRadio`/`FieldRadioTile` boolean as the string `'true'` or
`'false'`. `{#if data.flag}` is then true for `'false'`. Always narrow:

```svelte
$: yes = data.flag === true || data.flag === 'true'
$: no  = data.flag === false || data.flag === 'false'
```

**`conditional` clears stale data.** A field with `conditional={false}` is dropped from the submitted
data. Set it from the same expression that decides whether the branch is relevant, so an answer the
applicant gave and then navigated away from does not survive.

**Hide with CSS, never `{#if}`.** A field inside a removed `{#if}` block is unmounted, and an
unmounted field cannot clear its own value - the stale answer is submitted. Toggle `class:hidden`
(or a `visible` prop on a wrapper) so the field stays mounted and `conditional` does its job.
