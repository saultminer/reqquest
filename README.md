# Overview

ReqQuest is a flexible development platform for any time that an organization offers a
program that provides a benefit to applicants who prove themselves eligible. It's
especially helpful in situations with complex requirements and branching logic.

Each time we build a ReqQuest project, developers, business process analysts, and the
program administrators will break down the process they're trying to model into programs
(there could be more than one), requirements (that must be satisfied to prove eligibility),
and the data that must be collected to satisfy the requirements. Requirements are further
broken down into applicant and reviewer requirements, depending on whom we expect to provide
the data.

UX/UI experts will then do a (hopefully quick) pass to create prompts - web forms that
elicit the data from applicants and reviewers. They'll have flexibility to create multiple
prompts as needed and include clever functionality because each prompt is a Svelte component.

Let's talk about requirements in a little more detail for a second. It's natural to
start thinking about requirements in a kind of general way. For instance, "applicant
must have income below $50k/year". That requirement makes sense to read, but in ReqQuest
requirements are more specific, and usually get broken down into pairs.

Think about it this way; two things actually have to happen in order for an applicant to
receive this benefit. First, the applicant has to provide proof of their income, and the
reviewer has to find that proof to be authentic and convincing. So our requirements are
"applicant must provide proof that they make less than $50k/year" and "reviewer must evaluate
proof that applicant makes less than $50k/year". Once the applicant provides proof, their
requirement is met, regardless of whether the proof is convincing. The reviewer then
evaluates the proof and fulfills the _second_ requirement.

# Actors
For the purposes of this document, we will refer to several types of actors that will use this
system.

* Applicant

  Submits an App Request stating eligibility to receive one or more benefits.
* Reviewer

  Reviews submitted applications and eventually gets them to approved status.
* Second Eyes Reviewer

  Fills out prompts in the workflow stage of one or more applications, in order to check
  the work of a reviewer.
* Administrator

  Creates new application windows, manages roles, manages configurations.

The role system allows the creation of many additional types of actors. For example, each program
might have its own set of reviewers, or administrators might be divided into role management admins
and configuration management admins.

# Multiple programs
One of ReqQuest's main distinguishing features is support for multiple programs in the same
"App Request". This means that applicants submit to all programs simultanesously, in a single
submission.

ReqQuest's multi-program support is NOT intended to support multiple programs with
different deadlines and unrelated benefits. It's intended to support situations where
multiple programs are available to support one of the applicant's needs at a particular
time.

For instance, if you have 4 scholarships that are all available to help a student
pay for a semester of school, ReqQuest can help them apply once and get one or more of
the scholarships - as many as they qualify for.

On the other hand, what if you have some processes that support faculty, like a
sabbatical request form and a request for a promotion to tenure? Those may seem related
because they are for faculty, but those programs are related to different faculty needs,
and require independent requests. They do not belong in the same ReqQuest project, but
you could absolutely create two ReqQuest projects and an overview webpage in your
CMS linking to each one.

## Quick Definition: Application
An "application" is the portion of an App Request that relates to a particular
program. For instance, if you have 4 scholarship programs, an applicant will create an App
Request that contains 4 applications - one for each scholarship.

# The App Request process

Each App Request goes through the following phases on its way through the system.

## Apply (performed by the applicant)
1. PREQUAL (optional) - In this phase, applicants do not know what programs are available or
which ones they should apply to. They start answering prompts and at the end of PREQUAL,
ReqQuest will help them understand which programs are relevant to them. A ReqQuest project may
skip this phase entirely if they only have one program or if users will not be confused by
immediately choosing a program to begin working on.

2. QUALIFICATION - The main pre-submission phase is the QUALIFICATION phase. Applicants
fill out prompts that are organized beneath each of the programs. When they are done with this
phase, their request is ready to submit for review. If all applications are ineligible, the
App Request is stuck in this phase until closure or until the applicant changes their answers.

3. POSTQUAL (optional) - In some ReqQuest projects, there will be acknowledgements that the applicant
must agree to before they can submit their request, but they are not particularly related to any
of the programs. For instance, if the applicant must agree to a code of conduct or acknowledge
that they understand the system's privacy policy, those can be added as POSTQUAL requirements. They
will be shown to the applicant outside the context of any individual program, just before they
review their entire request and submit it.

3. READY TO SUBMIT - Once all applications are complete, and at least one application
is still eligible, the App Request becomes eligible to submit.

    The applicant will be shown all the data they have entered and return to prompt
    screens to make any desired changes. Changing answers may cause some applications or
    prompts to appear and/or disappear, but they should never have a prompt appear or disappear
    behind the spot that they are working.

## Review (performed by one or more reviewers)
4. PREAPPROVAL (optional) - In some ReqQuest projects, there will be requirements that can
be automatically evaluated instead of requiring a human reviewer. __If__ the reviewers would
prefer to wait for automated evaluations before they begin their work, the team may add PREAPPROVAL
requirements to the project. Prompts that belong to these requirements will never be edited by humans,
they will only receive data from automation processes.

    For instance, if a student is required to enroll in courses, they may submit their App Request before
    they have enrolled, and a PREAPPROVAL requirement can wait for their enrollment to show up in
    the Student Information System before their App Request is shown to reviewers as needing attention.

5. APPROVAL - This is the main review phase. Reviewers are able to begin answering their
prompts (and depending on permissions, editing/correcting the applicant's prompts). This phase continues
until the applications are all approved or denied.

6. BLOCKING WORKFLOW (optional, per program) - Each application can independently be configured with additional
requirements that must be satisfied _before_ the result is released to the applicant. For instance, you might
want a process such that a second reviewer has to evaluate the work of the first reviewer.

  Blocking workflow requirements MUST be met regardless of whether the application was accepted or rejected
  during the APPROVAL stage. Think about it: if you want your first reviewer's work evaluated, you probably
  want someone evaluating their rejections, not just their approvals.

  Each application will move through their own workflow stages. For example, scholarship A might require formal
  signoff while scholarship B does not, and scholarship C is competitive and has to get updated after the committee
  decides on the top recipients.

  A workflow stage contains requirements and prompts just like the rest of the review process, so it can be as
  simple as one prompt ("yes this all looks good") or many prompts (one signoff for each major decision made by
  the first reviewer).

  Once all prompts are answered and the workflow is non-pending, any reviewer may push the application forward to the next phase.

7. REVIEW_COMPLETE - Once the reviewer (and blocking workflow reviewers) have answered all appropriate prompts,
each application will automatically be designated as ELIGIBLE or INELIGIBLE instead of PENDING. At this point the
application can be marked (by a reviewer) as REVIEW_COMPLETE. Once all applications have been marked
REVIEW_COMPLETE, the App Request as a whole will be marked as REVIEW_COMPLETE. A reviewer is now able
to publish the results to the applicant.

  A program with nothing to do after submission - no PREAPPROVAL, APPROVAL, ACCEPTANCE or workflow requirements
  enabled for the period - skips all of this: its application moves straight to COMPLETE when the request is submitted,
  eligible or not, and sits out any acceptance or non-blocking workflow phase the request later enters. When that is
  true of every program in the request, submission completes the whole request with no reviewer involved.

  A program with trailing work but no reviewer questions (no PREAPPROVAL or APPROVAL requirements enabled) has no
  immediate review either: at submission its application is advanced on its own into its first blocking workflow
  stage, or to REVIEW_COMPLETE when there is none, eligible or not - exactly as if a reviewer had advanced it. When
  every application is then REVIEW_COMPLETE (or COMPLETE), the review is completed automatically as well and the
  request moves into acceptance, non-blocking workflow or completion with no reviewer involved.

## Acceptance (optional, performed by the applicant)

8. ACCEPTANCE (optional) - In some projects, there may be an acceptance step where the approval
is actually an offer of benefits, and the applicant must accept the offer. In these cases,
there will be at least one Requirement with type ACCEPTANCE. ReqQuest will recognize this and set the app
request status to ACCEPTANCE instead of APPROVED after the results are published to the applicant. From
there, the applicant will have more prompts to answer (e.g. "yes, I accept" or perhaps "yes I accept $500
out of the $1000 offered").

## Released to applicant

9. APPROVED / NOT_APPROVED or ACCEPTED / REJECTED - If there was an acceptance phase, then once it is completed
the app request will be marked as either ACCEPTED or REJECTED. It is ACCEPTED if at least one application's offer
was accepted by the applicant.

  If there was no acceptance phase, the app request will be marked as either APPROVED or NOT_APPROVED right after
  the reviewer moves the app request forward from REVIEW_COMPLETE. It is APPROVED if at least one application
  was found to be ELIGIBLE.

  This status is mostly for display purposes, the actual approvals / acceptances at the application level are
  more important.

## Followup Tasks (optional, performed by one or more reviewers)

10. NON-BLOCKING WORKFLOW (optional) - In some systems, we have a need for followup workflow after a request has been
fully reviewed and the applicant has received the benefit. For instance, have a second set of eyes come into each
app request and prepare a report for an auditor, or look for training opportunities based on how the request was
handled. This stage works just like the review process - it has its own requirements and prompts. The only difference
is that a failed requirement does not block the applicant from receiving the benefit. The only potential consequence
of failure would be showing up on some kind of custom report.

## Closure

All App Requests are automatically closed after their period's Archive date. They can also be manually closed by
reviewers with the appropriate permission. Once marked as closed, an App Request can no longer be updated without
being re-opened (re-open is unavailable after the associated period's archive date). All collected data and
determinations of eligibility are frozen in time. Changing the code for a requirement will not impact closed
App Requests; however, an App Request that is re-opened must satisfy the current logic. We will not preserve and
apply historical code, but we DO preserve and apply historical configurations (like an income threshold on an
income-related requirement).

    Note: CLOSED is an independent status for the App Request. It does not change the status that the
    App Request had pre-closure. For instance, an App Request that was in the APPROVAL phase, still
    being reviewed, at the time of closure will keep its APPROVAL status forever. It will just also
    be marked as closed. If we overwrote the status with CLOSED, we would have a hard time figuring out
    whether the App Request was APPROVED or ACCEPTED before closure.

# Role Management
ReqQuest has a rich role management system that allows administrators to create flexible
roles for a variety of situations. We dive into the details in the Detailed Definitions section,
but to give you a brief idea, it is be possible to permission each prompt in the system individually,
so you can make roles like "final approver", where most reviewers do not have permission to the
"final approval" prompt, but the "final approver" role does.

Additionally, it is possible for developers to assign special "tags" to App Requests that can
then be used to further restrict access. So for example, you could create a prompt that asks the applicant
what state they live in. A developer could then set up the system to tag the App Request with
their answer, and you could create a role that only has final approval rights for applicants who
live in Texas.

# Detailed Definitions

## App Requests
App Requests represent the entirety of an applicant's submission during a time window.
If the system includes multiple Programs, the App Request acts as a container for all of them,
and automatically generates Applications to each.

## Programs and Applications
Programs represent benefits that the applicant may be eligible to receive. Each program
has its own set of Requirements, though requirements may be shared among multiple programs.

Within the context of a single App Request, each program has an Application. For
example, if the Program represents an "In-State Tuition Grant" program, the Application
represents the information Jennifer gave us to prove she's eligible for the grant, and the
status of her request.

### Hiding programs the applicant was screened out of
With many programs, an applicant may be screened out of most of them by applicant requirements (PREQUAL,
QUALIFICATION, POSTQUAL) before they ever submit, and reviewers then wade through programs nobody needs
to look at. Set `showIneligiblePreSubmit: false` on a program definition to hide it in that case. It
defaults to true.

An application is hidden while it is ineligible because of an applicant requirement *and* that
ineligibility arose before submission: either the request has not been submitted yet, or the application
was already ineligible at the moment it was submitted (recorded in `applications.ineligiblePreSubmit`).
The distinction matters because `ineligiblePhase` names the type of the failing requirement, not when it
failed. A reviewer who changes an applicant answer after submission and disqualifies the program does
not hide it, so they can still see and undo the change. An application that becomes eligible again is
shown again immediately.

- Reviewers and other non-owners never receive a hidden application from the API.
- The applicant still receives it, flagged `hiddenIneligiblePreSubmit`, and the UI leaves it out of their
  program lists. Its prompts stay in the applicant's navigation so they can change the answer that
  disqualified them. A program they opted out of stays listed, since that is the only place to opt back in.
- When nothing is left to list, the applicant sees `UIConfig.applicantNoProgramsMessage` (or a default).
- Hiding is presentation only: evaluation and the app request's status are unaffected.

### Application Status
Application status represents the current state of the eligibility of the application. This status
changes back and forth from PENDING several times throughout the process. For instance, when the applicant
is about to submit, their application _so far_ is ELIGIBLE, so the status is ELIGIBLE, but once they submit,
the application is being reviewed and goes back to PENDING until the reviewers finish their work.

* PENDING

  The application is usually in this status while it is being entered or reviewed.
* ELIGIBLE

  The application is currently eligible for the benefit offered by the program, but there could
  be further review or blocking workflow stages.
* INELIGIBLE

  The application is currently ineligible for the benefit offered by the program. Blocking
  workflow stages should still be completed.
* ACCEPTED

  An offer was made to the applicant, and they accepted or partially accepted it.
* REJECTED

  An offer was made to the applicant, but they rejected it.

### Application Phase
Application phase is where the application is in the process, regardless of whether it is
currently eligible or ineligible for the benefit. Even rejected applications proceed through all
the phases, since we need to perform blocking and non-blocking workflow on all applications, not
just the ones that are awarded a benefit. Non-blocking does not mean optional: the request cannot
reach COMPLETE until every non-blocking requirement on every application - including those denied
during review, blocking workflow, or acceptance - has resolved to something other than PENDING. The
one exception is an application screened out before submission (a PREQUAL or QUALIFICATION
requirement failed); no reviewer ever touched it, so it skips non-blocking workflow entirely. If a
stage genuinely does not apply to a denied application, have its requirement return NOT_APPLICABLE
rather than leaving it PENDING, or the request will never complete.

* PREQUAL

  The app request has not finished pre-qualification yet. Since pre-qualification determines which applications
  are relevant, this application is not yet relevant and should not appear in the applicant UI. This status is only
  possible if there is at least one PREQUAL requirement.
* QUALIFICATION

  The application has been pre-qualified and is awaiting further input from the applicant.
* READY_TO_SUBMIT

  All pre-submission requirements have been evaluated as passing (MET, WARNING, or NOT_APPLICABLE). The application
  is ready to be submitted. Applications that do not qualify for the benefit remain in whichever phase they were
  disqualified in.
* PREAPPROVAL

  The application has been submitted and at least one PREAPPROVAL requirement exists and is PENDING.
* APPROVAL

  The application has been submitted, has passed preapproval, and is awaiting approval.
* READY_FOR_WORKFLOW

  All review requirements have been resolved as non-PENDING, the application is ready to be moved into
  the first non-blocking workflow stage. If there is no non-blocking workflow, this phase is skipped
  and we proceed to REVIEW_COMPLETE.

  This phase is also used for applications that are in a workflow stage and all its requirements are
  passing. The application is ready to move to the next non-blocking workflow. If there are no later non-blocking
  workflow stages, this phase is skipped and we proceed to REVIEW_COMPLETE.
* WORKFLOW_BLOCKING

  The application is currently in a blocking workflow stage with one or more PENDING requirements. We are waiting
  on the workflow stage reviewer to come and answer prompts.
* REVIEW_COMPLETE

  The application has been reviewed and all requirements are non-PENDING. This application is ready to be released
  to the applicant. It will wait in this phase for all other applications to reach REVIEW_COMPLETE, then the whole
  app request may be released to the applicant by a reviewer.
* ACCEPTANCE

  The application has been released to the applicant and there is at least one ACCEPTANCE requirement that is PENDING. We are waiting for the applicant to come and answer acceptance prompts.
* READY_TO_ACCEPT
  All ACCEPTANCE requirements have been satisfied and are non-PENDING. The applicant may now finalize the
  application by submitting their acceptance.
* WORKFLOW_NONBLOCKING
  Now that the application results have been revealed to the applicant, and the applicant accepted the benefit,
  the application proceeds through any non-blocking workflow stages. In the current workflow stage, there are
  PENDING requirements that must be resolved before the application can move forward to the next workflow stage.

  The READY_FOR_WORKFLOW status will re-appear at the end of each non-blocking workflow stage, when the application
  is ready to move to the next one. When the last non-blocking workflow stage is complete, the application will
  move to the COMPLETE phase.
* COMPLETE

  There is nothing left to do on this application. Other applications may still be working through their own
  non-blocking workflow stages. An application whose program has nothing to do after submission reaches this phase
  as soon as the request is submitted.

## Requirements
Requirements are business rules that govern whether an applicant will be eligible for
a program.

While it's easy to think of requirements as logical, like "the applicant must
have income below $50k/year", they should be thought of as more procedural, like "the
applicant must provide proof that they make less than $50k/year" or even "the applicant
must affirm that they make less than $50k/year". Now we know what kind of information
to collect.

Furthermore, we probably want a similar requirement on the review side like "reviewer
must affirm that proof of income is valid and indicates less than $50k/year". One logical
requirement becomes two procedural requirements.

To collect the necessary information, each Requirement depends on a list of Prompts. After
each prompt is answered, the requirement will analyze the information gathered and come up
with a status (see ApplicationRequirement Statuses below) and a statusReason (a brief sentence
or two describing why the requirement was marked the way that it was, especially when it
is marked as disqualifying). It may also return `blame`, a list of the prompt keys whose
answers are responsible for that status, which lets the reviewer interface mark those specific
questions instead of every question the requirement looked at. The developer is responsible for
writing javascript code that implements a Requirement's logic.

As long as the requirement is still pending, ReqQuest will continue collecting the next prompt
in its list, one by one, until all prompts have been answered or the requirement is not pending.
This way you can collect only as much information as you need to make a decision. For instance,
the requirement might be that they must be over 18 years old or have parental consent. The first
prompt could ask their age. If they answer over 18, the requirement is met and we're done. If they
answer under 18, the next prompt could ask for proof of parental consent.

Requirements are also allowed to share Prompts. The Prompt will appear in navigation under
the first applicable Requirement that depends on it. For example, you might not do it
this way, but you _could_ create an "applicant is under 6 feet tall" requirement and a second
"applicant is over 5 feet tall" requirement, and both requirements could share a "how tall
are you" prompt.

### Requirement Types
Each requirement belongs to a certain phase of the application process. These phases were
discussed in detail above, but the general idea is that some requirements are intended
for the applicant to resolve, and some are for the reviewer(s).
* PREQUAL
* QUALIFICATION
* POSTQUAL
* PREAPPROVAL
* APPROVAL
* ACCEPTANCE
* WORKFLOW

### ApplicationRequirements
Within the context of an individual program's application, we have an ApplicationRequirement. The
ApplicationRequirement represents the current status of a requirement within a particular
applicant's application. So if "applicant is over 6 feet tall" is a Requirement, then when James
applies, his ApplicationRequirement object is set to MET when he answers that he's 6'2".

The status is updated on each ApplicationRequirement each time we collect new Prompt data. The status
should be PENDING until we are confident about one of the other statuses. This means our status is
stable as we move forward in the application. Once our requirement is returning a non-pending status,
future prompt data can't change its answer. Which is good, since having it change around behind us
would be really confusing for the users.

The possible statuses are:
* _PENDING_ - The requirement logic MUST return this status until it is fully confident that no further
information could change the result. It's particularly tempting to return WARNING too early, just remember
that will make the system stop asking questions, questions that might clear up the warning.
* _MET_ - The requirement is fully satisfied, there is no reason to ask further questions.
* _DISQUALIFYING_ - The answers collected so far fully disqualify the applicant from receiving the benefit,
there is no reason to ask further questions and the application will not be processed by reviewers. It may
not even be possible to submit the application for review at all, unless another program is still eligible.
* _WARNING_ - This status gives us a little bit of wiggle room in our process. It's meant to
communicate to the user that they _probably_ do not qualify, but they can continue to enter
information, and another requirement will allow a reviewer to make the final decision on their
eligibility. The applicant will be shown a custom message describing the problem. The system sees
a WARNING status as passing, so it will not block submission.
* _NOT_APPLICABLE_ - This requirement does not apply to the applicant. They will be allowed to
proceed as if the requirement has been met.

### Requirement Order
_This is an advanced topic, feel free to skip it until you're more comfortable with ReqQuest._

Requirements are added to the system in a specific order, but this order is mostly for display purposes. The
first prompt from each requirement will be shown to the user, regardless of the status of any previous
requirements.

The subsequent prompts a requirement depends on will not be shown until the first prompt is answered _and
the requirement is still pending_. This way, if the first prompt is enough to qualify or disqualify the
applicant, we can avoid showing them forms for irrelevant information.

Some requirements will have `promptKeysAnyOrder`. All prompts listed this way will be treated as the
first prompt and all will be displayed. The requirement will not receive data from any of these prompts
until all of them have been answered. This prevents a situation where the user leaves one prompt blank,
moves forward into another requirement or program, and runs into a requirement that depends on a prompt
they left blank. They'd have to backtrack to finish their application; it would be really confusing.

In the most rare situations, requirements will depend on data from prompts that are not relevant in the
current context. For this, requirements are able to depend on prompts with `promptKeysNoDisplay`. Here are
some examples of why you'd want to do this:

* An ACCEPTANCE phase requirement might depend on a prompt from the application phase in order to verify
the applicant's response to their offer.
* A requirement could be that the applicant did NOT get to the end of another
program's application. We'd definitely not want to show another application's prompt, we just want to wait
until they get to that point in the other application.

Notice that both examples want the requirement to *wait*. That's the default: until a `promptKeysNoDisplay`
prompt has been answered, the requirement stays PENDING and none of its own prompts are shown, since making
a determination on missing data would be premature.

Occasionally you need the opposite - a dependency on data that may never arrive. The usual case is an
override: an applicant is disqualified by a requirement, and a reviewer may (or may not) open the
unsubmitted request and unlock them. Waiting is not an option there, because the applicant would be stuck
behind a prompt only a reviewer can answer. List the prompt as `{ key: 'some_prompt', gate: false }` and it
will no longer hold the requirement back - `resolve` receives `undefined` for it and runs again if the data
shows up later.

Requirements that do this are knowingly breaking the rule that a status is stable once it goes non-PENDING,
so `resolve` must tolerate the data being absent, and a late answer should only ever move the applicant
forward. Flipping a requirement to DISQUALIFYING after the applicant has already moved past it pulls the
rug out from under them.

### Shared Requirements and Program Context
_This is an advanced topic too._

A requirement may appear in any number of programs. `resolve` only ever sees the requirement's own prompt
data and the period's configuration, and both are the same whichever program is asking, so a shared
requirement is evaluated once per request and every program that lists it reuses the answer. Sharing is
free, and it is the normal way to build a system with many programs that ask the same questions.

Occasionally a shared requirement needs to know which program it is deciding for - the same answer might
disqualify in one program and merely warn in another. For that, `resolve` receives a fourth argument, a
`program` selector. Name the properties you need and you receive just those:

```ts
resolve: (data, config, configLookup, program) => {
  if (data.weekend_availability_prompt?.weekendAvailable) return { status: RequirementStatus.MET }
  const { key, title } = program({ key: true, title: true })
  if (key === 'operations') return { status: RequirementStatus.DISQUALIFYING, reason: `${title} requires weekend on-call availability` }
  return { status: RequirementStatus.WARNING, reason: `${title} prefers weekend availability` }
}
```

Available properties are `key`, `title` and `navTitle` (as they read in the request's period, label
overrides applied), `requirementIndex` (the requirement's position in the program's order) and
`priorStatuses` (the statuses of the requirements evaluated ahead of this one in the same application,
by key). `priorStatuses` is how a requirement reacts to an earlier requirement's outcome; it does not get
that requirement's answers.

Reading program context is what turns a once-per-request evaluation into a per-program one, so the
selector is deliberately the only way to get at it. The result is then reused only among programs where
every property the requirement read has the same value: read `key` and it runs once per program, read only
`requirementIndex` and it runs once per distinct position. The cost is paid per call path, not per
requirement. In the example above a "yes" never touches the selector, so for applicants who answer yes
the requirement still runs once for the whole request. Ask only on the paths that need it, and ask only
for what that path needs.

### Reviewer Screen Layout
The reviewer sees every requirement of an application on one screen, grouped into panels by requirement
type: "General Questions" (PREQUAL), a panel titled with the program name (QUALIFICATION and POSTQUAL),
"Reviewer Questions" (PREAPPROVAL and APPROVAL), "Acceptance", then one panel per blocking workflow stage
and one per non-blocking stage. Within a panel, requirements keep their `requirementKeys` order. Empty
panels are not shown.

Nothing about that layout is inferred from where a reviewer requirement sits in `requirementKeys` - a
reviewer requirement listed right after the applicant requirement it assesses still lands in "Reviewer
Questions". When an assessment should render directly beneath the answer it assesses, or the panels should
come in a different order, say so with `reviewSections` on the program's entry in the UI's `UIConfig.programs`
(`ProgramDefinition` from `@reqquest/ui`). The layout is pure presentation, so it is configured next to the
program's icon and never leaves the browser - the API's program definition knows nothing about it.

```ts
programs: {
  essay_program: {
    reviewSections: [
      { section: 'GENERAL' },
      { title: 'Assessments', requirementKeys: ['essay_req', 'assess_essay_req'] },
      { workflowStage: 'gpa_override' },
      { section: 'REVIEWER' }
    ]
  }
}
```

The list is the display order. A custom panel (`title` + `requirementKeys`) shows exactly the requirements
it names, applicant and reviewer alike, in that order. A workflow stage is placed as a unit by its key, since
its panel carries the stage's advance/return controls. A default panel is placed by name and holds whatever
requirements no custom panel claimed. Panels you do not mention trail the list in the default order. Listed
panels come first, so a layout that names only a custom panel shows it above "General Questions"; list
`{ section: 'GENERAL' }` and `{ section: 'PROGRAM' }` ahead of it to keep the applicant's panels on top, as the
demos do. A misspelled requirement key or section name is a build error once the project generates its key
declaration (see `keys.ts` in `@reqquest/ui`); a requirement, stage or default section placed twice is logged
with `console.error` when the UI registry is built. A key the program does not have is skipped at render time,
the same as a requirement the period disabled, and a workflow-stage requirement named in a custom panel stays
in its stage panel.

## Prompts and PromptAnswers
Prompts represent the collection of data from our users (both applicants and reviewers). Each
prompt defines a single screen with fields to fill in (though it could use a tabbed UI to feel
like multiple screens). It could be as simple as a yes-or-no question, or as complicated as
uploading a document and answering a series of questions about its content.

Individual prompts can also handle some shallow branching logic, like you answer
a yes-or-no question and based on the answer the Prompt asks you a followup question. Branching
logic can also be handled with additional Requirements. It will be up to the developers and
designers to decide what's most appropriate.

Within the context of an individual application, we will store what we call a `PromptAnswer` for
each Prompt. This represents the information collected rather than the form that collects it. Each
PromptAnswer is marked automatically as "answered" or not based on data entered in the form.

The Requirement is not given the information from the Prompt until it has been marked as
fully answered. We don't want requirements making decisions based on incomplete or invalid
data. It is the responsibility of the project developer to write javascript code determining whether the
prompt has been sufficiently answered or is still incomplete.

Note: generally the user is allowed to save incomplete data and come back later. The project
developer has discretion to disallow saving certain data, like a large invalid upload, since
that could have consequences.

## Roles
Roles represent a set of access privileges that can be assigned to a group of users. Each
Role is linked to one or more groups (e.g. loaded from ActiveDirectory). Membership in the groups
is managed outside ReqQuest, but which groups go with which Roles is managed within ReqQuest. If
the Role lists multiple groups, the group memberships are merged and everyone has the Role.

Each Role has a list of Grants and Exceptions.

## Grants
Each Grant bestows one or more controls from a single Control Group.

### Controls and Control Groups
A control is a specific permission that allows the user to perform a specific action
in a specific circumstance. For instance, "create a new app request for myself" is one control,
while "create a new app request for others" is an entirely separate control. See below for a full
list of controls.

Some permissions are granted implicitly, like "view your own app requests", "submit your own app requests",
and "view applicant-phase prompt data from your own app requests". You won't find controls for these because
disallowing them would make no sense.

Control Groups are a way to group related controls together to make the process of creating grants
more convenient. Controls can only live in the same group if they work on the same type of data and have
the same set of available restrictions (see below for more on restrictions).

Groups should be further split so that it would make sense to grant all the controls at the same time. For
instance, "create a new app request for myself" and "create a new app request for others" are in different groups
because one is for applicants and the other is for staff members. "create an app request for yourself" isn't a
a common permission for staff members, so for clarity, it shouldn't get mixed in. You can still make a role
that has both permissions, but you would create two separate grants.

### Restrictions / Tags
Each time you grant a control, you can restrict your grant to a specific set of Tags. These tags
vary from control group to control group, because different permissions have different ways that you
might want to restrict them.

For instance, if you grant permission to answer prompts, you might want to restrict your grant to
prompts that are part of a specific program, or restrict it to a specific prompt (like a "final approval"
prompt).

ReqQuest provides downstream project developers with the ability to define their own tags, by adding
code to one of the prompts that they create. For instance, if you have a faculty leave request
application, you might want to restrict some permissions to a specific department or college. The
developer can write code that produces a list of all the departments and colleges, and then
assigns tags to App Requests based on the department and college that the applicant selects in a
"Confirm Your Info" prompt.

These tags can then be used by role administrators to restrict grants, for instance, creating a
role that is a reviewer for all App Requests that have been tagged as College of Engineering.

Administrators __cannot__ create new ways of tagging - that would take a developer and a software
update.

## Exceptions
Grants add permissions to a role, possibly with restrictions. But what if you want to
grant a permission for everything __except__ a specific set of tags? For instance, you
might want to create a role that allows a user to review all App Requests NOT tagged as
"College of Engineering". This is where exceptions come in.

First you create a grant that allows the user to review all App Requests, with no restrictions.
Then you create an exception, and select the same control group and controls as your grant.
To finish, you select a set of tags to define the exception. In our example, you would select
the "College of Engineering" tag.

Once you save your exception, the role __cannot__ grant the permission to review App Requests
tagged with "College of Engineering", no matter how many grants you add. So the combined
effect of your grant and your exception is that the user can review all App Requests except
those tagged with "College of Engineering".

A major advantage to this approach is that as new colleges are added to the system, the role
automatically gets access to them, without needing to update the role. If you had
created a grant that whitelisted access to an exhaustive list of colleges but not engineering,
you would have to update the role every time a new college was added.

### Exceptions and users with multiple roles
Keep in mind, exceptions only apply to the __role__. Once the role has resolved all of
its grants and exceptions, the role itself can only _add_ permissions to the user.

For instance, consider a system with two reviewer roles: one that grants "update" on all Prompts
_except_ reviewing driver's licenses, and another granting the review of driver's licenses. A
user could be placed in the first role to review everything except driver's licenses, and then added
to the second role to add the ability to review driver's licenses. Now they are able to review
everything, including driver's licenses.

Note: If a user has both applicant and reviewer roles, the actions available to them will
be based on which screen they are on. For instance, there is an applicant dashboard and a
reviewer dashboard - separate screens. In addition, there are a set of screens for submitting
as an applicant and a separate set of screens for reviewing an application.

### List of Control Groups / Controls

#### AppRequestOwn (Applicant - Applicant Phase, *no restrictions/tags*)
- create — Create an appRequest for oneself.
- cancel — Cancel one's own appRequest while in the applicant phase.
- uncancel — Re-open one's own appRequest that was cancelled in the applicant phase.

#### AppRequestOwnReview (Applicant - Reviewer Phase, *tags: AppRequest tags*)
- withdraw — Withdraw one's own appRequest while in the reviewer phase.
- unwithdraw — Re-open one's own withdrawn appRequest (one that was cancelled while in the reviewer phase).

#### AppRequest (Reviewer - Review Phase, *tags: AppRequest tags*)
- submit — Submit an appRequest when all requirements pass, even if you are not the applicant.
- close — Close an appRequest to further edits. Each application and requirement will keep their current status. This will happen automatically when the period's archive date is reached, but can also be done manually by a reviewer.
- reopen — Reopen an appRequest that has been closed (must be in a valid period).
- reopen_any — Reopen any appRequest that has been closed, even in an old period or when it was withdrawn by the applicant.
- return — Return an appRequest in the reviewer phase to the applicant phase.
- review — See an appRequest in the reviewer list interface.
- review_own — Allow reviewers to act as reviewers on their own requests. Any permission they have, from any role, related to reviewing will now also apply to their own appRequests. Use with caution.
- offer — Make an offer to the applicant (move the request from the review phase to the acceptance phase). Only applies in projects/periods where there is at least one enabled ACCEPTANCE requirement.

#### AppRequestPreReview (Reviewer - Applicant Phase, *no restrictions/tags*)
- create — Create an appRequest on someone else's behalf.
- uncancel — Re-open any appRequest that was cancelled in the applicant phase.

#### Application (Reviewer - View Applications, *tags: program, AppRequest tags*)
- view — View application as a reviewer in an AppRequest (requires AppRequest.review to see the reviewer interface).

#### ApplicationRequirement (Reviewer - Requirement Statuses, *tags: requirement, AppRequest tags*)
- view — View requirement status in an AppRequest (requires AppRequest.review to see the reviewer interface).

#### PromptAnswer (Reviewer - View and Update Prompt Data, *tags: prompt, AppRequest tags*)
- view — View prompt data as a reviewer in an AppRequest.
- update — Update any individual appRequest's prompt data during the review phase.
- update_anytime — Update this prompt as a reviewer even if the appRequest is not yet submitted or awaiting acceptance or pre-approval automations.

#### Prompt (Admin - Configure Prompts, *tags: prompt*)
- view — View the configuration management interface and see prompt configuration data.
- configure — Configure the way that a prompt works for all appRequests in a period.

#### Requirement (Admin - Configure Requirements, *tags: requirement, program*)
- view — View requirement configuration data.
- configure — Configure the way that a requirement works for all appRequests.
- disable — Disable/Enable a requirement for all appRequests in a period.

#### Program (Admin - Configure Programs, *tags: program*)
- view — See the current configuration for this program.
- configure — Configure the way that a program works for all appRequests in a given period.
- disable — Disable/Enable a program for all appRequests in a given period.

#### Period (Admin - Manage Periods, *no restrictions/tags*)
- view — View the period management interface and see all the periods.
- view_configuration — View the configuration management interface for a period.
- create — Create new periods.
- update — Update existing periods.
- delete — Delete existing periods.

#### Role (Admin - Manage Roles, *no restrictions/tags*)
- view — View the role management interface and see all the roles, grants, exceptions, groups, and users associated with each.
- create — Create new roles.
- update — Update existing roles.
- delete — Delete existing roles.

# Activities

This section summarizes the main activities users can perform in ReqQuest. Activities are grouped by user type for clarity.

**Applicant Activities**
- Create a new App Request
- Update and answer prompts
- Review and finalize entered data before submission
- Cancel or uncancel an App Request before submission
- Submit an App Request for review
- View prior and current App Requests and their statuses on a dashboard
- Review submitted App Requests and see all entered data
- Withdraw or unwithdraw a submitted App Request during the reviewer phase
- Accept or decline an offer (if applicable) by filling out acceptance prompts

**Reviewer Activities**
- View the list of App Requests with filters
- View dashboards highlighting App Requests needing attention
- Review and update prompt data during the review phase
- Return an App Request to the applicant phase
- Close or reopen App Requests
- Make an offer to the applicant (if applicable)
- View and update application and requirement statuses
- Send App Request back to applicant for edits

**Administrator Activities**
- Create, update, or delete Periods
- Create, update, or delete Roles
- Create, update, or delete Grants and Exceptions within Roles
- Update Prompt configurations for upcoming periods
- Update Requirement configurations for upcoming periods
- Enable or disable Requirements or Programs in a period

If your project has additional phases or custom activities, be sure to add them here to keep this list up to date.

# Scheduled email

Every built-in email so far is a reaction to a mutation: a hook in `appConfig.hooks` or one of the
platform's own callbacks queues a row in `mail_outbox`, and a scheduler inside the API process
drains that outbox roughly every 90 seconds. Time-based email - "the period closes in a week and
you haven't submitted" - runs on that same scheduler.

Everything runs **inside the API process**, not in a separate cron container. The scheduler claims
each job with an atomic update on the `tasks` table, so with several API replicas exactly one of
them runs a given job per interval. A job is a plain `(ctx) => Promise<void>`, so if one ever grows
heavy enough to want its own container, the downstream project can import the same function from a
second entrypoint built from the same image.

## Built-in: period-closing reminder

Configured from `emailConfig` in your `RQServer.start` call - no code required:

```ts
emailConfig: {
  appName: 'Reqquest',
  signature: 'Mobile Web Systems',
  from: 'Reqquest <reqquest@txstate.edu>',
  periodClosing: {
    daysBefore: 14,     // first reminder once closeDate is within 14 days
    reminderDays: 3     // then every 3 days while the request is still STARTED
  }
}
```

- `periodClosing.daysBefore` enables the job. Omit it and nothing is scheduled.
- `periodClosing.reminderDays` sets the follow-up cadence. Omit it (or 0) for a single reminder.
- Recipients are owners of app requests in the period that are `STARTED` (not submitted) and not
  closed. The set is recomputed on every run, so submitting the request or the period closing ends
  the reminders on its own.
- The `period_closing_reminder` template seeds **enabled**, like every built-in email. There is no
  admin screen for templates yet: to turn one off, set `mail_templates.enabled = 0` for its
  `templateKey` (the `toggleMailTemplate` database function does exactly that). Variables available:
  `periodName`, `closeDate`, `daysUntilClose`,
  plus everything in `emailConfig`.

The job runs hourly. It is idempotent because each queued email carries a dedup key
(`period_closing_<period>_<user>_<occurrence>`) and `mail_outbox.dedupKey` is unique: the occurrence
index advances once per `reminderDays`, so the hourly re-runs in between insert nothing.

## Custom: `hooks.scheduled`

For time-based logic the built-in job does not cover, register jobs beside the other hooks. The
rc demo carries a real one: when a new period opens, everyone who submitted a request in the
previous period is told, unless they already have a request in the new one. It is three small
files, and together they are the recipe for any downstream scheduled email:

- [demos/src/rc/hooks/periodOpenedNotification.ts](demos/src/rc/hooks/periodOpenedNotification.ts) -
  the `ScheduledHook`: `minutesBetween` plus a `run (ctx)` that reads with `getPeriods` /
  `getAppRequests`, decides who qualifies, and calls `MailService.sendmulti` with a `dedupKey`.
- [demos/src/rc/mail/periodOpened.template.ts](demos/src/rc/mail/periodOpened.template.ts) - the
  project's own mail template, the same plain-object shape as the platform's built-in ones.
- [demos/src/rc/testdata.ts](demos/src/rc/testdata.ts) - a migration that inserts that template
  with `createMailTemplate`. Keep it **outside** any `installTestData` guard: the template is part
  of the application, not test data, and `createMailTemplate` is a no-op on an existing row so an
  edited template survives redeploys.

Registration is one line in `appConfig`:

```ts
hooks: {
  scheduled: {
    period_opened_notification: periodOpenedNotification   // key becomes task name hook_period_opened_notification
  }
}
```

Rules that follow from how the scheduler works:

- The key becomes the task name (`hook_<key>`), and one replica runs it per interval.
- The scheduler sleeps 90 seconds between passes, so `minutesBetween: 1` really means about 1.5
  minutes, and `duringHour` / `duringDayOfWeek` / `duringDayOfMonth` use the container's `TZ`.
- `ctx` is a system context with no user and no roles. Read through the `*.database` functions and
  non-authorizing services such as `MailService`; anything authorized will be denied.
- Always pass a `dedupKey` for anything a recurring job sends. The job will run again, and the
  unique index is what keeps it from emailing the same person twice for the same event.
- `periodClosingReminder` in `api/src/util/periodClosingReminder.ts` (built in) and rc's
  `periodOpenedNotification` (downstream) are the two reference implementations of all of the above.

# Downstream setup: keeping the UI in step with the API

Your programs, requirements, and prompts are defined in TypeScript on the API side, and each prompt
is rendered by a Svelte component you register with `UIRegistry` on the UI side. Nothing links those
two halves automatically — the API can define `proof_of_residence_prompt` while your UI has no
component for it, and by default you find out when an applicant reaches that screen.

An analyzer ships with `@reqquest/api` to close that gap: it reads your definitions and emits key
declarations that make both halves compile-time checked. See
[docs/downstream-setup.md](docs/downstream-setup.md) for the full procedure — generating the two
declarations, registering your prompts, and gating both in your build.
