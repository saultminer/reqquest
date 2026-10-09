import db from 'mysql2-async/db'
import type { Queryable } from 'mysql2-async'
import { Configuration, ConfigurationFilters, ensureAppRequestRecords, getAppRequests, normalizeProgramName, Period, parseProgramLabels, PeriodFilters, PeriodUpdate, programRegistry, promptRegistry, requirementRegistry, RequirementType } from '../internal.js'
import { Cache, keyby, stringify } from 'txstate-utils'

export interface PeriodRow {
  id: number
  code?: string
  name: string
  openDate: Date
  closeDate: Date | null
  archiveDate: Date | null
  reviewed: 0 | 1
}

export interface PeriodConfigurationRow {
  periodId: number
  /* might be a requirement, prompt, or program key */
  definitionKey: string
  createdAt: Date
  updatedAt: Date
}

export interface PeriodProgramRow {
  periodId: number
  programKey: string
  disabled: 0 | 1
  /** `period_configurations.data` for the program key, joined in so labels need no extra query */
  programLabels?: string | null
}

export interface PeriodProgramRequirementRow {
  periodId: number
  programKey: string
  requirementKey: string
  workflowStageKey?: string
  disabled: 0 | 1
}

export interface PeriodWorkflowRow {
  periodId: number
  stageKey: string
  programKey: string
  title: string
  blocking: 0 | 1
  evaluationOrder: number
}

function processFilters (filters?: PeriodFilters) {
  const where: string[] = []
  const binds: any[] = []
  if (filters?.ids?.length) {
    where.push(`p.id IN (${db.in(binds, filters.ids)})`)
  }
  if (filters?.names?.length) {
    where.push(`p.name IN (${db.in(binds, filters.names)})`)
  }
  if (filters?.codes?.length) {
    where.push(`p.code IN (${db.in(binds, filters.codes)})`)
  }
  if (filters?.opensAfter) {
    where.push('p.openDate > ?')
    binds.push(filters.opensAfter.toJSDate())
  }
  if (filters?.opensBefore) {
    where.push('p.openDate < ?')
    binds.push(filters.opensBefore.toJSDate())
  }
  if (filters?.closesAfter) {
    where.push('p.closeDate > ? OR p.closeDate IS NULL')
    binds.push(filters.closesAfter.toJSDate())
  }
  if (filters?.closesBefore) {
    where.push('p.closeDate < ?')
    binds.push(filters.closesBefore.toJSDate())
  }
  if (filters?.archiveAfter) {
    where.push('p.archiveDate > ? OR p.archiveDate IS NULL')
    binds.push(filters.archiveAfter.toJSDate())
  }
  if (filters?.archiveBefore) {
    where.push('p.archiveDate < ?')
    binds.push(filters.archiveBefore.toJSDate())
  }
  if (filters?.openNow != null) {
    if (filters.openNow) {
      where.push('p.openDate < NOW() AND (NOW() < p.closeDate OR p.closeDate IS NULL)')
    } else {
      where.push('NOW() < p.openDate OR p.closeDate < NOW()')
    }
  }
  return { where, binds }
}

export async function getPeriods (filters?: PeriodFilters) {
  const { where, binds } = processFilters(filters)
  const rows = await db.getall<PeriodRow>(`
    SELECT p.*
    FROM periods p
    ${where.length ? `WHERE (${where.join(') AND (')})` : ''}
    ORDER BY p.openDate DESC
  `, binds)
  return rows.map(row => new Period(row))
}

export async function getPeriodsEmpty (periodIds: string[]) {
  const binds: any[] = []
  const emptyPeriodIds = new Set(await db.getvals<number>(`
    SELECT DISTINCT p.id FROM periods p LEFT JOIN app_requests ar ON ar.periodId = p.id
    WHERE ar.id IS NULL AND p.id IN (${db.in(binds, periodIds)})
  `, binds))
  return periodIds.map(id => ({ id, empty: emptyPeriodIds.has(Number(id)) }))
}

export async function getAcceptancePeriodIds (tdb: Queryable = db) {
  const requirementKeys = requirementRegistry.list().filter(r => r.type === RequirementType.ACCEPTANCE).map(r => r.key)
  if (!requirementKeys.length) return new Set<string>()
  const binds: any[] = []
  const rows = await tdb.getvals<number>(`
    SELECT DISTINCT p.id
    FROM periods p
    INNER JOIN period_programs pp ON pp.periodId = p.id
    INNER JOIN period_program_requirements ppr ON ppr.periodId = p.id AND pp.programKey = ppr.programKey
    WHERE pp.disabled = 0 AND ppr.disabled = 0 AND ppr.requirementKey IN (${db.in(binds, requirementKeys)})
  `, binds)
  return new Set(rows.map(String))
}

export async function getNonBlockingWorkflowPeriodIds () {
  const periodIds = await db.getvals<number>(`
    SELECT DISTINCT p.id
    FROM periods p
    INNER JOIN period_programs pp ON pp.periodId = p.id
    INNER JOIN period_program_requirements ppr ON ppr.periodId = p.id AND pp.programKey = ppr.programKey
    INNER JOIN period_workflow_stages pws ON pws.periodId = p.id AND pws.programKey = pp.programKey AND ppr.workflowStageKey = pws.stageKey
    WHERE pp.disabled = 0 AND ppr.disabled = 0 AND ppr.workflowStageKey IS NOT NULL AND pws.blocking = 0
  `)
  return new Set(periodIds.map(String))
}

export async function copyConfigurations (fromPeriodId: number | string | undefined, toPeriodId: number | string, db: Queryable) {
  if (!fromPeriodId) return
  const hasAppRequests = await db.getval<number>('SELECT COUNT(*) FROM app_requests WHERE periodId = ?', [toPeriodId])
  if (hasAppRequests) throw new Error('Cannot alter the configurations of a period that has app requests.')
  await Promise.all([
    db.delete('DELETE FROM period_configurations WHERE periodId = ?', [toPeriodId]),
    db.delete('DELETE FROM period_programs WHERE periodId = ?', [toPeriodId]),
    db.delete('DELETE FROM period_program_requirements WHERE periodId = ?', [toPeriodId]),
    db.delete('DELETE FROM period_workflow_stages WHERE periodId = ?', [toPeriodId])
  ])
  // program keys carry the period's label overrides, so a copied period keeps the program names
  const reachableConfigKeys = [...promptRegistry.reachable.map(p => p.key), ...requirementRegistry.reachable.map(r => r.key), ...programRegistry.reachable.map(p => p.key)]
  const configBinds: any[] = [toPeriodId, fromPeriodId]
  await db.insert(`
    INSERT INTO period_configurations (periodId, definitionKey, data)
    SELECT ?, definitionKey, data
    FROM period_configurations
    WHERE periodId = ? AND definitionKey IN (${db.in(configBinds, reachableConfigKeys)})
  `, configBinds)

  const reachableProgramKeys = programRegistry.reachable.map(p => p.key)
  const disabledProgramKeys = new Set(await db.getvals<string>('SELECT programKey FROM period_programs WHERE periodId = ? AND disabled = 1', [fromPeriodId]))
  if (reachableProgramKeys.length) {
    const binds: any[] = []
    await db.insert(`
      INSERT INTO period_programs (periodId, programKey, disabled)
      VALUES ${db.in(binds, reachableProgramKeys.map(key => [toPeriodId, key, disabledProgramKeys.has(key) ? 1 : 0]))}
    `, binds)
  }

  const reachableWorkflowStages = programRegistry.reachable.flatMap(p => p.workflowStages?.map(stage => stage.key))
  if (reachableWorkflowStages.length) {
    const binds: any[] = [fromPeriodId]
    const stagesToCopy = await db.getall<PeriodWorkflowRow>(`
      SELECT * FROM period_workflow_stages WHERE periodId = ? AND stageKey IN (${db.in(binds, reachableWorkflowStages)})
      ORDER BY evaluationOrder
    `, binds)
    const stagesToCopyByKey = keyby(stagesToCopy, s => `${s.stageKey}-${s.programKey}`)
    const stagesExisting = new Set(stagesToCopy.map(s => `${s.stageKey}-${s.programKey}`))
    let idx = 0
    for (const program of programRegistry.reachable) {
      for (const stage of program.workflowStages ?? []) {
        if (!stagesExisting.has(`${stage.key}-${program.key}`)) {
          await db.insert(`
            INSERT INTO period_workflow_stages (periodId, stageKey, programKey, title, blocking, evaluationOrder)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [toPeriodId, stage.key, program.key, stage.title, stage.nonBlocking ? 0 : 1, idx++])
        } else {
          const row = stagesToCopyByKey[`${stage.key}-${program.key}`]
          await db.insert(`
            INSERT INTO period_workflow_stages (periodId, stageKey, programKey, title, blocking, evaluationOrder)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [toPeriodId, stage.key, program.key, row.title, row.blocking, idx++])
        }
      }
    }
  }

  const reachableRequirementKeys = requirementRegistry.reachable.map(r => r.key)
  const disabledRequirementKeys = await db.getall<{ requirementKey: string, programKey: string }>('SELECT requirementKey, programKey FROM period_program_requirements WHERE periodId = ? AND disabled = 1', [fromPeriodId])
  const disabledByRequirementKeyAndProgramKey = disabledRequirementKeys.reduce((acc, { requirementKey, programKey }) => {
    acc[requirementKey] ??= {}
    acc[requirementKey][programKey] = true
    return acc
  }, {} as Record<string, Record<string, boolean>>)
  if (reachableRequirementKeys.length) {
    const binds: any[] = []
    await db.insert(`
      INSERT INTO period_program_requirements (periodId, programKey, requirementKey, workflowStageKey, disabled)
      VALUES ${db.in(binds, reachableProgramKeys.flatMap(pk => reachableRequirementKeys.map(rk => [toPeriodId, pk, rk, programRegistry.getWorkflowStageByProgramAndRequirementKey(pk, rk)?.key, disabledByRequirementKeyAndProgramKey[rk]?.[pk] ? 1 : 0])))}
    `, binds)
  }
}

export async function createPeriod (period: PeriodUpdate, copyPeriodId?: string) {
  const { code, name, openDate, closeDate, archiveDate } = period
  const prevId = await db.getval<number>('SELECT id FROM periods ORDER BY id DESC LIMIT 1')
  return await db.transaction(async db => {
    const periodId = await db.insert(`
      INSERT INTO periods (code, name, openDate, closeDate, archiveDate)
      VALUES (?, ?, ?, ?, ?)
    `, [code, name, openDate?.toJSDate(), closeDate?.toJSDate(), archiveDate?.toJSDate()])
    await copyConfigurations(copyPeriodId ?? prevId, periodId, db)
    await ensureConfigurationRecords([periodId], db)
    return periodId
  })
}

export async function updatePeriod (id: string, period: PeriodUpdate) {
  const { code, name, openDate, closeDate, archiveDate } = period
  await db.update(`
    UPDATE periods
    SET code = ?, name = ?, openDate = ?, closeDate = ?, archiveDate = ?
    WHERE id = ?
  `, [code, name, openDate.toJSDate(), closeDate?.toJSDate(), archiveDate?.toJSDate(), id])
}

export async function markPeriodReviewed (periodId: number | string) {
  await db.update('UPDATE periods SET reviewed = 1 WHERE id = ?', [periodId])
}

export async function deletePeriod (id: string) {
  await db.transaction(async db => {
    const hasAppRequests = await db.getval<number>('SELECT COUNT(*) FROM app_requests WHERE periodId = ?', [id])
    if (hasAppRequests) throw new Error('Cannot delete a period that has app requests.')
    await db.delete('DELETE FROM periods WHERE id = ?', [id])
  })
}

function processConfigurationFilters (filters?: ConfigurationFilters) {
  const where: string[] = []
  const binds: any[] = []
  if (filters?.ids?.length) {
    where.push(`(c.periodId, c.definitionKey) IN (${db.in(binds, filters.ids.map(({ periodId, key }) => [periodId, key]))})`)
  }
  if (filters?.periodIds?.length) {
    where.push(`c.periodId IN (${db.in(binds, filters.periodIds)})`)
  }
  if (filters?.periodCodes?.length) {
    where.push(`p.code IN (${db.in(binds, filters.periodCodes)})`)
  }
  if (filters?.keys?.length) {
    where.push(`c.definitionKey IN (${db.in(binds, filters.keys)})`)
  }
  return { where, binds }
}

export async function getConfigurations (filters?: ConfigurationFilters) {
  const { where, binds } = processConfigurationFilters(filters)
  const rows = await db.getall<PeriodConfigurationRow>(`
    SELECT c.periodId, c.definitionKey, c.updatedAt
    FROM period_configurations c
    INNER JOIN periods p ON p.id = c.periodId
    ${where.length ? `WHERE (${where.join(') AND (')})` : ''}
  `, binds)
  return rows.map(row => new Configuration(row))
}

export async function getConfigurationData (ids: { periodId: string, definitionKey: string }[]) {
  const binds: any[] = []
  const rows = await db.getall<{ periodId: number, definitionKey: string, data: string }>(`
    SELECT periodId, definitionKey, data
    FROM period_configurations
    WHERE (periodId, definitionKey) IN (${db.in(binds, ids.map(pair => [pair.periodId, pair.definitionKey]))})
  `, binds)
  return rows.map(row => ({ periodId: String(row.periodId), definitionKey: row.definitionKey, data: JSON.parse(row.data || '{}') }))
}

export async function upsertConfiguration (periodId: string, key: string, data: any, tdb: Queryable = db) {
  const dataStr = stringify(data)
  await tdb.update(`
    INSERT INTO period_configurations (periodId, definitionKey, data)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE data = VALUES(data)
  `, [periodId, key, dataStr])
}

/**
 * This function is run on startup and makes sure future periods have entries for all the
 * configurations, programs, and requirements that are available in the code.
 */
export async function ensureConfigurationRecords (periodIds?: number[], tdb?: Queryable) {
  const action = async (db: Queryable) => {
    const futurePeriodIds = periodIds ?? await db.getvals<number>('SELECT id FROM periods WHERE openDate > NOW()')
    if (!futurePeriodIds.length) return
    const configurations = await db.getall<{ periodId: number, definitionKey: string }>(`SELECT periodId, definitionKey FROM period_configurations WHERE periodId IN (${db.in([], futurePeriodIds)})`, futurePeriodIds)
    const configMap: Record<string, Set<string>> = {}
    for (const { periodId, definitionKey } of configurations) {
      if (!configMap[periodId]) configMap[periodId] = new Set()
      configMap[periodId].add(definitionKey)
    }
    const prompts = promptRegistry.reachable
    const requirements = requirementRegistry.reachable
    const programs = programRegistry.reachable
    const configKeysSet = new Set([...prompts.map(p => p.key), ...requirements.map(r => r.key), ...programs.map(p => p.key)])
    const promptConfigurationsToInsert = futurePeriodIds.flatMap(periodId => prompts.filter(p => !configMap?.[periodId]?.has(p.key)).map(p => ({ periodId: periodId, key: p.key, data: stringify(p.configuration?.default ?? {}) })))
    const requirementConfigurationsToInsert = futurePeriodIds.flatMap(periodId => requirements.filter(r => !configMap?.[periodId]?.has(r.key)).map(r => ({ periodId: periodId, key: r.key, data: stringify(r.configuration?.default ?? {}) })))
    // a program's configuration is its label overrides, empty means use the titles from the code
    const programConfigurationsToInsert = futurePeriodIds.flatMap(periodId => programs.filter(p => !configMap?.[periodId]?.has(p.key)).map(p => ({ periodId: periodId, key: p.key, data: stringify({}) })))
    const configurationsToInsert = [...promptConfigurationsToInsert, ...requirementConfigurationsToInsert, ...programConfigurationsToInsert]
    const configurationsToDelete = futurePeriodIds.flatMap(periodId => Array.from(configMap?.[periodId] ?? []).filter(key => !configKeysSet.has(key)).map(key => ({ periodId: periodId, key })))
    if (configurationsToInsert.length) {
      const binds: any[] = []
      await db.insert(`
        INSERT INTO period_configurations (periodId, definitionKey, data)
        VALUES ${db.in(binds, configurationsToInsert.map(({ periodId, key, data }) => [periodId, key, data]))}
        `, binds)
    }
    if (configurationsToDelete.length) {
      const binds: any[] = []
      await db.query(`DELETE FROM period_configurations WHERE (periodId, definitionKey) IN (${db.in(binds, configurationsToDelete.map(({ periodId, key }) => [periodId, key]))})`, binds)
    }

    const program_rows = await db.getall<{ periodId: number, programKey: string }>(`SELECT periodId, programKey FROM period_programs WHERE periodId IN (${db.in([], futurePeriodIds)})`, futurePeriodIds)
    const programKeys = programRegistry.reachable.map(p => p.key)
    const programKeysSet = new Set(programKeys)
    const programMap: Record<string, Set<string>> = {}
    for (const { periodId, programKey } of program_rows) {
      if (!programMap[periodId]) programMap[periodId] = new Set()
      programMap[periodId].add(programKey)
    }

    const programsToInsert = futurePeriodIds.flatMap(periodId => programKeys.filter(key => !programMap?.[periodId]?.has(key)).map(key => ({ periodId: periodId, key })))
    const programsToDelete = futurePeriodIds.flatMap(periodId => Array.from(programMap?.[periodId] ?? []).filter(key => !programKeysSet.has(key)).map(key => ({ periodId: periodId, key })))
    if (programsToInsert.length) {
      const binds: any[] = []
      await db.insert(`
        INSERT INTO period_programs (periodId, programKey)
        VALUES ${db.in(binds, programsToInsert.map(({ periodId, key }) => [periodId, key]))}
      `, binds)
    }
    if (programsToDelete.length) {
      const binds: any[] = []
      await db.query(`
        DELETE FROM period_programs
        WHERE (periodId, programKey) IN (${db.in(binds, programsToDelete.map(({ periodId, key }) => [periodId, key]))})
      `, binds)
    }

    const workflow_rows = await db.getall<PeriodWorkflowRow>(`SELECT * FROM period_workflow_stages WHERE periodId IN (${db.in([], futurePeriodIds)})`, futurePeriodIds)
    const workflowByKey = keyby(workflow_rows, row => `${row.periodId}-${row.stageKey}-${row.programKey}`)
    const workflowRecords: (PeriodWorkflowRow & { insert: boolean })[] = []
    const workflowKeys = new Set()
    for (const periodId of futurePeriodIds) {
      let idx = 0
      for (const program of programRegistry.reachable) {
        for (const stage of program.workflowStages ?? []) {
          const key = `${periodId}-${stage.key}-${program.key}`
          workflowKeys.add(key)
          if (!workflowByKey[key]) workflowRecords.push({ periodId, stageKey: stage.key, programKey: program.key, title: stage.title, blocking: stage.nonBlocking ? 0 : 1, evaluationOrder: idx++, insert: true })
          else workflowRecords.push({ ...workflowByKey[key], evaluationOrder: idx++, insert: false })
        }
      }
    }
    const workflowToInsert = workflowRecords.filter(r => r.insert)
    const workflowToUpdate = workflowRecords.filter(r => !r.insert)
    const workflowToDelete = workflow_rows.filter(row => !workflowKeys.has(`${row.periodId}-${row.stageKey}-${row.programKey}`))
    if (workflowToInsert.length) {
      const binds: any[] = []
      await db.insert(`
        INSERT INTO period_workflow_stages (periodId, stageKey, programKey, title, blocking, evaluationOrder)
        VALUES ${db.in(binds, workflowToInsert.map(w => [w.periodId, w.stageKey, w.programKey, w.title, w.blocking, w.evaluationOrder]))}
      `, binds)
    }
    for (const row of workflowToUpdate) {
      await db.update(`
        UPDATE period_workflow_stages
        SET title = ?, blocking = ?, evaluationOrder = ?
        WHERE periodId = ? AND stageKey = ? AND programKey = ?
      `, [row.title, row.blocking, row.evaluationOrder, row.periodId, row.stageKey, row.programKey])
    }
    if (workflowToDelete.length) {
      const binds: any[] = []
      await db.delete(`
        DELETE FROM period_workflow_stages
        WHERE (periodId, stageKey, programKey) IN (${db.in(binds, workflowToDelete.map(row => [row.periodId, row.stageKey, row.programKey]))})
      `, binds)
    }

    const requirement_rows = await db.getall<{ periodId: number, programKey: string, requirementKey: string }>(`SELECT periodId, programKey, requirementKey FROM period_program_requirements WHERE periodId IN (${db.in([], futurePeriodIds)})`, futurePeriodIds)
    const requirementMap: Record<string, Record<string, Set<string>>> = {}
    for (const { periodId, programKey, requirementKey } of requirement_rows) {
      requirementMap[periodId] ??= {}
      requirementMap[periodId][programKey] ??= new Set()
      requirementMap[periodId][programKey].add(requirementKey)
    }
    const reachablePairs: Record<string, Record<string, boolean>> = {}
    const requirementsToInsert: { periodId: number, programKey: string, requirementKey: string }[] = []
    for (const program of programRegistry.reachable) {
      for (const requirementKey of programRegistry.allRequirementKeys[program.key] ?? []) {
        reachablePairs[program.key] ??= {}
        reachablePairs[program.key][requirementKey] = true
        for (const periodId of futurePeriodIds) {
          if (!requirementMap[periodId]?.[program.key]?.has(requirementKey)) {
            requirementsToInsert.push({ periodId, programKey: program.key, requirementKey })
          }
        }
      }
    }
    const requirementsToDelete = requirement_rows.filter(row => reachablePairs[row.programKey]?.[row.requirementKey] == null).map(row => [row.periodId, row.programKey, row.requirementKey])
    if (requirementsToInsert.length) {
      const binds: any[] = []
      await db.insert(`
        INSERT INTO period_program_requirements (periodId, programKey, requirementKey, workflowStageKey, disabled)
        VALUES ${db.in(binds, requirementsToInsert.map(({ periodId, programKey, requirementKey }) => [periodId, programKey, requirementKey, programRegistry.getWorkflowStageByProgramAndRequirementKey(programKey, requirementKey)?.key, 0]))}
      `, binds)
    }
    if (requirementsToDelete.length) {
      const binds: any[] = []
      await db.query(`
        DELETE FROM period_program_requirements
        WHERE (periodId, programKey, requirementKey) IN (${db.in(binds, requirementsToDelete)})
      `, binds)
    }

    // if we added or removed any configurations, programs, or requirements, we need to ensure that the app requests are updated
    const periodIdsAffected = new Set([...configurationsToInsert.map(c => c.periodId), ...configurationsToDelete.map(c => c.periodId), ...programsToInsert.map(p => p.periodId), ...programsToDelete.map(p => p.periodId), ...requirementsToInsert.map(r => r.periodId), ...requirementsToDelete.map(r => r[0])])
    const appRequestsAffected = periodIdsAffected.size ? await getAppRequests({ periodIds: Array.from(periodIdsAffected).map(String) }, db) : []
    for (const appRequest of appRequestsAffected) await ensureAppRequestRecords(appRequest, db)
  }
  if (tdb) return await action(tdb)
  else return await db.transaction(action)
}

export const periodConfigCache = new Cache(async (periodId: string) => {
  const configs = await getConfigurations({ periodIds: [periodId] })
  const configData = await getConfigurationData(configs.map(c => ({ periodId, definitionKey: c.key })))
  const configDataByKey = keyby(configData, c => c.definitionKey)
  const result: Record<string, any> = {}
  for (const config of configs) {
    result[config.key] = configDataByKey[config.key]?.data ?? {}
  }
  return result
}, { freshseconds: 30 }) // cache for 30 seconds

export const programAliasCache = new Cache(async () => {
  const keys = programRegistry.keys()
  const aliases: Record<string, string[]> = {}
  if (!keys.length) return aliases
  const binds: any[] = []
  const rows = await db.getall<{ definitionKey: string, data: string | null }>(`
    SELECT pc.definitionKey, pc.data
    FROM period_configurations pc
    INNER JOIN periods p ON p.id = pc.periodId
    WHERE pc.definitionKey IN (${db.in(binds, keys)})
    ORDER BY p.openDate DESC
  `, binds)
  for (const row of rows) {
    const definition = programRegistry.get(row.definitionKey)
    const labels = parseProgramLabels(row.data)
    const title = labels?.title
    if (!title || title === definition.title) continue
    aliases[row.definitionKey] ??= []
    if (!aliases[row.definitionKey].includes(title)) aliases[row.definitionKey].push(title)
  }
  return aliases
}, { freshseconds: 60 }) // short, so API instances that did not save the label catch up quickly

export async function getProgramAliasNote (key: string) {
  const seen = new Set([normalizeProgramName(programRegistry.get(key).title)])
  const aliases = (await programAliasCache.get())[key]?.filter(alias => {
    const normalized = normalizeProgramName(alias)
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
  return aliases?.length ? `aka ${aliases.join(', ')}` : undefined
}

export interface ProgramNameConflict {
  /** the name as the caller passed it */
  name: string
  /** the program that holds it */
  otherKey: string
  /**
   * code: it is the other program's title or navTitle in its definition
   * locked: a period that has app requests uses it - configuration there can no longer change, so it never frees up
   * unlocked: a period that can still be configured uses it right now - it frees up once removed there
   */
  source: 'code' | 'locked' | 'unlocked'
  periodName?: string
}

/**
 * Which of `names` belong to a program other than `programKey`, so that a name only ever means one
 * program. A name is held by another program when it is
 * - that program's title or navTitle in code,
 * - its label in a locked period (one with app requests) - permanently, as that history is frozen, or
 * - its label in an unlocked period, but only while it is still there. Every unlocked period counts,
 *   not just the one being edited, otherwise two periods could each give the name to a different
 *   program and keep it once both lock.
 *
 * Reads the database directly rather than `programAliasCache`, so a save cannot slip past a name
 * another instance stored moments ago.
 */
export async function findProgramNameConflicts (programKey: string, names: (string | undefined)[], tdb: Queryable = db) {
  const wanted = new Map<string, string>()
  for (const name of names) if (name) wanted.set(normalizeProgramName(name), name)
  const conflicts: ProgramNameConflict[] = []
  if (!wanted.size) return conflicts
  const claim = (otherKey: string, otherName: string | undefined, source: ProgramNameConflict['source'], periodName?: string) => {
    if (!otherName || otherKey === programKey) return
    const name = wanted.get(normalizeProgramName(otherName))
    if (name && !conflicts.some(c => c.name === name && c.otherKey === otherKey && c.source === source && c.periodName === periodName)) conflicts.push({ name, otherKey, source, periodName })
  }
  for (const program of programRegistry.list()) {
    claim(program.key, program.title, 'code')
    claim(program.key, program.navTitle, 'code')
  }
  const otherKeys = programRegistry.keys().filter(key => key !== programKey)
  if (otherKeys.length) {
    const binds: any[] = []
    const rows = await tdb.getall<{ definitionKey: string, data: string | null, periodName: string, locked: 0 | 1 }>(`
      SELECT pc.definitionKey, pc.data, p.name AS periodName,
        EXISTS (SELECT 1 FROM app_requests ar WHERE ar.periodId = p.id) AS locked
      FROM period_configurations pc
      INNER JOIN periods p ON p.id = pc.periodId
      WHERE pc.definitionKey IN (${db.in(binds, otherKeys)})
      ORDER BY p.openDate DESC
    `, binds)
    for (const row of rows) {
      const labels = parseProgramLabels(row.data)
      const source = row.locked ? 'locked' : 'unlocked'
      claim(row.definitionKey, labels?.title, source, row.periodName)
      claim(row.definitionKey, labels?.navTitle, source, row.periodName)
    }
  }
  return conflicts
}
