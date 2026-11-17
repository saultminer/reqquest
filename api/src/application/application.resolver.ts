import { Arg, Ctx, FieldResolver, ID, Mutation, Resolver, Root } from 'type-graphql'
import { ApplicationActions, Application, RQContext, ApplicationRequirementService, ApplicationRequirement, ApplicationService, ValidatedAppRequestResponse, PeriodWorkflowStage, ProgramService, AppRequestStatusDB, AppRequestPhase, ApplicationStatus } from '../internal.js'

@Resolver(of => Application)
export class ApplicationResolver {
  @FieldResolver(returns => ID, { description: 'The status of the application. If the current user is not authorized to see the full status, this will return PENDING.' })
  status (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).maySeeFullStatus(application) ? application.status : ApplicationStatus.PENDING
  }

  @FieldResolver(returns => [ApplicationRequirement])
  async requirements (@Ctx() ctx: RQContext, @Root() application: Application) {
    return await ctx.svc(ApplicationRequirementService).findByApplication(application)
  }

  @FieldResolver(returns => PeriodWorkflowStage, { nullable: true, description: 'If the program has workflow, it may be divided into multiple stages of audit, each with their own requirements/prompts. This indicates which stage we are currently evaluating, or null if we are not in the workflow phase. An application with no workflow defined will never be in the workflow phase. Starts at 1.' })
  async workflowStage (@Ctx() ctx: RQContext, @Root() application: Application) {
    if (!application.workflowStageKey) return null
    return await ctx.svc(ProgramService).findWorkflowStage(application.periodId, application.programKey, application.workflowStageKey)
  }

  @FieldResolver(returns => [PeriodWorkflowStage], { description: 'All workflow stages defined for the program/period of this application, in evaluation order.' })
  async workflowStages (@Ctx() ctx: RQContext, @Root() application: Application) {
    return await ctx.svc(ProgramService).findWorkflowStagesByPeriodIdAndProgramKey(application.periodId, application.programKey)
  }

  @FieldResolver(returns => Boolean, { description: 'True when this program has a non-blocking workflow stage that is still editable once the appRequest reaches WORKFLOW_NONBLOCKING, so a reviewer finishes it there with completeApplication. False when the program has no non-blocking stages, or every one of them reaches its nonBlockingSunset by then: such an application is finished by its last review or blocking workflow advance and goes to COMPLETE on its own.' })
  async completesAfterNonBlocking (@Ctx() ctx: RQContext, @Root() application: Application) {
    return await ctx.svc(ApplicationService).completesAfterNonBlocking(application)
  }

  @FieldResolver(returns => PeriodWorkflowStage, { nullable: true, description: 'The next workflow stage for this application that would be active after activating the advanceWorkflow mutation. Null if the application or current user is not allowed to advance.' })
  async nextWorkflowStage (@Ctx() ctx: RQContext, @Root() application: Application) {
    return await ctx.svc(ApplicationService).getNextWorkflowStage(application)
  }

  @FieldResolver(returns => PeriodWorkflowStage, { nullable: true, description: 'The previous workflow stage for this application that would be active after activating the reverseWorkflow mutation. Null if the application or current user is not allowed to reverse.' })
  async previousWorkflowStage (@Ctx() ctx: RQContext, @Root() application: Application) {
    return await ctx.svc(ApplicationService).getPreviousWorkflowStage(application)
  }

  @FieldResolver(returns => ApplicationActions)
  actions (@Root() application: Application) {
    return application
  }

  @Mutation(returns => ValidatedAppRequestResponse, { description: 'Moves the application to the next blocking workflow stage. If phase is READY_FOR_WORKFLOW, moves to the first or next blocking workflow stage. If on the last blocking workflow, moves to REVIEW_COMPLETE. Non-blocking workflow is not sequential and is not advanced: once all of its requirements are resolved the application is READY_TO_COMPLETE and is finished with completeApplication.' })
  async advanceWorkflow (@Ctx() ctx: RQContext, @Arg('applicationId', type => ID) applicationId: string) {
    return await ctx.svc(ApplicationService).advanceWorkflow(applicationId)
  }

  @Mutation(returns => ValidatedAppRequestResponse, { description: 'Marks a program complete during non-blocking workflow. Available when the application is READY_TO_COMPLETE, meaning none of its non-blocking requirements are PENDING. The application moves to COMPLETE, which locks its non-blocking prompts; the appRequest stays in WORKFLOW_NONBLOCKING until completeRequest, which requires every application to be COMPLETE.' })
  async completeApplication (@Ctx() ctx: RQContext, @Arg('applicationId', type => ID) applicationId: string) {
    return await ctx.svc(ApplicationService).completeApplication(applicationId)
  }

  @Mutation(returns => ValidatedAppRequestResponse, { description: 'Reopens a program that was marked complete with completeApplication, while the appRequest is still in WORKFLOW_NONBLOCKING, so its non-blocking prompts can be edited again. Not available for an application that completed on its own because it had no non-blocking workflow left open.' })
  async reopenApplication (@Ctx() ctx: RQContext, @Arg('applicationId', type => ID) applicationId: string) {
    return await ctx.svc(ApplicationService).reopenApplication(applicationId)
  }

  @Mutation(returns => ValidatedAppRequestResponse, { description: 'Moves the application back to the previous blocking workflow stage. Non-blocking workflow stages are excluded from the reverse order, so this only steps back through the blocking workflow during the review (SUBMITTED) phase.  If no blocking then moved to APPROVAL' })
  async reverseWorkflow (@Ctx() ctx: RQContext, @Arg('applicationId', type => ID) applicationId: string) {
    return await ctx.svc(ApplicationService).reverseWorkflow(applicationId)
  }

  @Mutation(returns => ValidatedAppRequestResponse, { description: 'Rescinds the approved and/or accepted application.' })
  async rescind (@Ctx() ctx: RQContext, @Arg('applicationId', type => ID) applicationId: string, @Arg('reason') reason: string, @Arg('validateOnly', { nullable: true }) validateOnly?: boolean) {
    return await ctx.svc(ApplicationService).rescindApplication(applicationId, reason, validateOnly)
  }

  @Mutation(returns => ValidatedAppRequestResponse, { description: 'Restores a previously rescinded application to its previous state.' })
  async restore (@Ctx() ctx: RQContext, @Arg('applicationId', type => ID) applicationId: string, @Arg('reason') reason: string, @Arg('validateOnly', { nullable: true }) validateOnly?: boolean) {
    return await ctx.svc(ApplicationService).restoreApplication(applicationId, reason, validateOnly)
  }
}

@Resolver(of => ApplicationActions)
export class ApplicationActionsResolver {
  @FieldResolver(returns => Boolean)
  viewAsReviewer (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).mayViewAsReviewer(application)
  }

  @FieldResolver(returns => Boolean)
  advanceWorkflow (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).mayAdvanceWorkflow(application)
  }

  @FieldResolver(returns => Boolean)
  reverseWorkflow (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).mayReverseWorkflow(application)
  }

  @FieldResolver(returns => Boolean, { description: 'True when the current user may mark this program complete: the appRequest is in non-blocking workflow and none of the application\'s non-blocking requirements are PENDING.' })
  completeApplication (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).mayCompleteApplication(application)
  }

  @FieldResolver(returns => Boolean, { description: 'True when the current user may reopen this program after it was marked complete, to edit its non-blocking workflow again.' })
  reopenApplication (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).mayReopenApplication(application)
  }

  @FieldResolver(returns => Boolean)
  rescindApplication (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).mayRescindApplication(application)
  }

  @FieldResolver(returns => Boolean)
  restoreApplication (@Ctx() ctx: RQContext, @Root() application: Application) {
    return ctx.svc(ApplicationService).mayRestoreApplication(application)
  }
}
