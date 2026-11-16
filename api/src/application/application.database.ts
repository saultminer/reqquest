import db from 'mysql2-async/db'
import { Application, ApplicationFilter, ApplicationPhase, ApplicationRescindedStatus, ApplicationStatus, AppRequestPhase, AppRequestStatus, AppRequestStatusDB, bulkUpdateById, IneligiblePhases, PeriodWorkflowRow, programRegistry } from '../internal.js'
import { Queryable } from 'mysql2-async'
import { DateTime } from 'luxon'

export interface ApplicationRow {
  id: number
  appRequestId: number
  periodId: number
  programKey: string
  evaluationOrder: number
  userId: number
  computedStatus: ApplicationStatus
  computedStatusReason?: string
  computedPhase: ApplicationPhase
  computedIneligiblePhase?: IneligiblePhases
  computedAwaitingCorrection: 0 | 1
  ineligiblePreSubmit: 0 | 1
  workflowStage: string
  appRequestStatus: AppRequestStatusDB
  appRequestComputedStatus: AppRequestStatus
  appRequestPhase: AppRequestPhase
  rescindedStatus?: ApplicationRescindedStatus
  rescindedReason?: string
  restoredReason?: string
  programLabels?: string | null
}

function processFilters (filter: ApplicationFilter) {
  const where: string[] = []
  const binds: any[] = []
  if (filter.ids?.length) {
    where.push(`a.id IN (${db.in(binds, filter.ids)})`)
  }
  if (filter.appRequestIds?.length) {
    where.push(`a.appRequestId IN (${db.in(binds, filter.appRequestIds)})`)
  }
  return { where, binds }
}

export async function snapshotIneligiblePreSubmit (appRequestId: number, tdb: Queryable = db) {
  await tdb.update('UPDATE applications SET ineligiblePreSubmit = (computedStatus = ?) WHERE appRequestId = ?', [ApplicationStatus.INELIGIBLE, appRequestId])
}

export async function clearIneligiblePreSubmit (appRequestId: number, tdb: Queryable = db) {
  await tdb.update('UPDATE applications SET ineligiblePreSubmit = 0 WHERE appRequestId = ?', [appRequestId])
}

async function getApplicationRows (filter: ApplicationFilter, tdb: Queryable) {
  const { where, binds } = processFilters(filter)
  const whereClause = where.length > 0 ? `WHERE (${where.join(') AND (')})` : ''
  return await tdb.getall<ApplicationRow>(`
    SELECT a.id, a.appRequestId, ar.periodId, a.programKey, a.evaluationOrder, ar.userId, a.computedStatus, a.computedStatusReason, a.computedPhase,
      a.computedIneligiblePhase, a.computedAwaitingCorrection, a.ineligiblePreSubmit, a.workflowStage,
      a.rescindedStatus, a.rescindedReason, a.restoredReason,
      ar.status AS appRequestStatus, ar.phase AS appRequestPhase, ar.computedStatus AS appRequestComputedStatus,
      pc.data AS programLabels
    FROM applications a
    INNER JOIN app_requests ar ON ar.id = a.appRequestId
    LEFT JOIN period_configurations pc ON pc.periodId = ar.periodId AND pc.definitionKey = a.programKey
    ${whereClause}
    ORDER BY evaluationOrder
  `, binds)
}

export async function getApplications (filter: ApplicationFilter, tdb: Queryable = db) {
  const rows = await getApplicationRows(filter, tdb)
  return rows.map(row => new Application(row))
}

/**
 * Reconcile the applications on an appRequest with the active programs. The read is the full model
 * query, so when nothing needs writing its rows become the models and no reload is needed. Models
 * are only built once every row is known to belong to an active program.
 */
export async function syncApplications (appRequestId: number, activeProgramKeySet: Set<string>, db: Queryable) {
  const activePrograms = programRegistry.list().filter(program => activeProgramKeySet.has(program.key))
  const filter = { appRequestIds: [String(appRequestId)] }
  const existingApplications = await getApplicationRows(filter, db)
  const existingByProgramKey = new Map(existingApplications.map(row => [row.programKey, row]))
  const toInsert: any[][] = []
  const toReorder: { id: number, evaluationOrder: number }[] = []
  for (let i = 0; i < activePrograms.length; i++) {
    const existing = existingByProgramKey.get(activePrograms[i].key)
    if (!existing) toInsert.push([appRequestId, activePrograms[i].key, i])
    else if (existing.evaluationOrder !== i) toReorder.push({ id: existing.id, evaluationOrder: i })
  }
  const programsToDelete = existingApplications.filter(row => !activeProgramKeySet.has(row.programKey))
  if (!toInsert.length && !programsToDelete.length && !toReorder.length) return existingApplications.map(row => new Application(row))
  if (toInsert.length) {
    const binds: any[] = []
    await db.insert(`
      INSERT INTO applications (appRequestId, programKey, evaluationOrder)
      VALUES ${db.in(binds, toInsert)}
    `, binds)
  }
  if (programsToDelete.length) {
    const binds: any[] = []
    await db.delete(`DELETE FROM applications WHERE id IN (${db.in(binds, programsToDelete.map(row => row.id))})`, binds)
  }
  await bulkUpdateById(db, 'applications', ['evaluationOrder'], toReorder)
  return await getApplications(filter, db)
}

/** The computed columns the evaluation writes back, shaped for `bulkUpdateById` and for change detection. */
export function applicationComputedRow (application: Application) {
  return {
    id: application.internalId,
    computedStatus: application.computedStatus,
    computedStatusReason: application.statusReason ?? null,
    computedPhase: application.phase,
    computedIneligiblePhase: application.ineligiblePhase ?? null,
    computedAwaitingCorrection: application.awaitingCorrection ? 1 : 0
  }
}

export async function updateApplicationsComputed (applications: Application[], db: Queryable) {
  await bulkUpdateById(db, 'applications', ['computedStatus', 'computedStatusReason', 'computedPhase', 'computedIneligiblePhase', 'computedAwaitingCorrection'], applications.map(applicationComputedRow))
}

export async function rescindApplication (applicationId: string, reason: string, tdb: Queryable = db) {
  const [application] = await getApplications({ ids: [applicationId] }, tdb)
  if (!application) throw new Error(`Application not found: ${applicationId}`)
  await tdb.update('UPDATE applications SET rescindedStatus = ?, rescindedReason = ? WHERE id = ?', [ApplicationRescindedStatus.RESCINDED, reason, applicationId])
}

export async function restoreApplication (applicationId: string, reason: string, tdb: Queryable = db) {
  const [application] = await getApplications({ ids: [applicationId] }, tdb)
  if (!application) throw new Error(`Application not found: ${applicationId}`)
  await tdb.update('UPDATE applications SET rescindedStatus = ?, restoredReason = ? WHERE id = ?', [ApplicationRescindedStatus.RESTORED, reason, applicationId])
}

export async function advanceWorkflow (applicationId: string, tdb: Queryable = db) {
  const [application] = await getApplications({ ids: [applicationId] }, tdb)
  if (!application) throw new Error(`Application not found: ${applicationId}`)
  if (application.phase !== ApplicationPhase.READY_FOR_WORKFLOW) throw new Error('Application is not ready to advance workflow.')

  const stages = await tdb.getall<PeriodWorkflowRow>(`
    SELECT DISTINCT w.* FROM period_workflow_stages w
    INNER JOIN application_requirements r ON r.workflowStage = w.stageKey
    INNER JOIN applications a ON a.id = r.applicationId AND a.programKey = w.programKey
    WHERE a.id=? AND w.programKey=? AND w.periodId=?
    ORDER BY w.evaluationOrder
  `, [applicationId, application.programKey, application.periodId])
  const blocking = stages.filter(stage => !!stage.blocking)
  const nonblocking = stages.filter(stage => !stage.blocking)
  const current = stages.find(stage => stage.stageKey === application.workflowStageKey)

  let toStage: PeriodWorkflowRow | undefined
  let toPhase: ApplicationPhase = application.phase
  if (!current) {
    toStage = blocking[0]
    if (!toStage) toPhase = ApplicationPhase.REVIEW_COMPLETE
    else toPhase = ApplicationPhase.WORKFLOW_BLOCKING
  } else if (current.blocking) {
    const currIdx = blocking.findIndex(stage => stage.stageKey === current.stageKey)
    if (currIdx > -1) {
      toStage = blocking[currIdx + 1]
      if (!toStage) toPhase = ApplicationPhase.REVIEW_COMPLETE
      else toPhase = ApplicationPhase.WORKFLOW_BLOCKING
    } else toPhase = ApplicationPhase.REVIEW_COMPLETE
  } else {
    const currIdx = nonblocking.findIndex(stage => stage.stageKey === current.stageKey)
    if (currIdx > -1) {
      toStage = nonblocking[currIdx + 1]
      if (!toStage) toPhase = ApplicationPhase.COMPLETE
      else toPhase = ApplicationPhase.WORKFLOW_NONBLOCKING
    } else toPhase = ApplicationPhase.COMPLETE
  }

  await tdb.update('UPDATE applications SET computedPhase = ?, workflowStage = ? WHERE id = ?', [toPhase, toStage?.stageKey, applicationId])
}

/**
 * Mark a program complete during non-blocking workflow. The application must be READY_TO_COMPLETE - every
 * non-blocking requirement resolved. A COMPLETE application's non-blocking prompts are locked.
 */
export async function completeApplication (applicationId: string, tdb: Queryable = db) {
  const [application] = await getApplications({ ids: [applicationId] }, tdb)
  if (!application) throw new Error(`Application not found: ${applicationId}`)
  if (application.appRequestPhase !== AppRequestPhase.WORKFLOW_NONBLOCKING || application.phase !== ApplicationPhase.READY_TO_COMPLETE) throw new Error('Application is not ready to be marked complete.')
  await tdb.update('UPDATE applications SET computedPhase = ?, workflowStage = ? WHERE id = ?', [ApplicationPhase.COMPLETE, null, applicationId])
}

/**
 * Undo completeApplication while the request is still in non-blocking workflow. The caller evaluates
 * afterwards, which settles the application on READY_TO_COMPLETE or WORKFLOW_NONBLOCKING.
 */
export async function reopenApplication (applicationId: string, tdb: Queryable = db) {
  const [application] = await getApplications({ ids: [applicationId] }, tdb)
  if (!application) throw new Error(`Application not found: ${applicationId}`)
  if (application.appRequestPhase !== AppRequestPhase.WORKFLOW_NONBLOCKING || application.phase !== ApplicationPhase.COMPLETE) throw new Error('Application cannot be reopened.')
  await tdb.update('UPDATE applications SET computedPhase = ?, workflowStage = ? WHERE id = ?', [ApplicationPhase.WORKFLOW_NONBLOCKING, null, applicationId])
}

export async function reverseWorkflow (applicationId: string, tdb: Queryable = db) {
  const [application] = await getApplications({ ids: [applicationId] }, tdb)
  if (!application) throw new Error(`Application not found: ${applicationId}`)
  // reversing between non-blocking stages must never occur in any AppRequestPhase since they are no longer sequential, exclude from the reverse order.
  if (programRegistry.getWorkflowStageByKey(application.workflowStageKey)?.nonBlocking) throw new Error('Non-blocking workflow stages cannot be reversed.')

  const stages = await tdb.getall<PeriodWorkflowRow>(`
    SELECT DISTINCT w.* FROM period_workflow_stages w
    INNER JOIN application_requirements r ON r.workflowStage = w.stageKey
    INNER JOIN applications a ON a.id = r.applicationId AND a.programKey = w.programKey
    WHERE a.id=? AND w.programKey=? AND w.periodId=?
    ORDER BY w.evaluationOrder
  `, [applicationId, application.programKey, application.periodId])
  // Non-blocking workflow stages are excluded from the reverse (return) order — reversal only steps back
  // through the blocking workflow. The stage definition (registry) is authoritative for nonBlocking
  const blocking = stages.filter(stage => !!stage.blocking && !programRegistry.getWorkflowStageByKey(stage.stageKey)?.nonBlocking)
  // Needed to take into consideration blocking workflow stages and not just move back to APPROVAL
  const currIdx = application.phase === ApplicationPhase.REVIEW_COMPLETE
    ? blocking.length
    : blocking.findIndex(stage => stage.stageKey === application.workflowStageKey)
  const toStage: PeriodWorkflowRow | undefined = currIdx > 0 ? blocking[currIdx - 1] : undefined
  const toPhase = toStage ? ApplicationPhase.WORKFLOW_BLOCKING : ApplicationPhase.APPROVAL
  await tdb.update('UPDATE applications SET computedPhase = ?, workflowStage = ? WHERE id = ?', [toPhase, toStage?.stageKey, applicationId])
}
