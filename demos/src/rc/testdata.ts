import { createAppRequest, createPeriod, DatabaseMigration, AccessDatabase, updateAppRequestData, submitAppRequest, markPeriodReviewed, createMailTemplate } from '@reqquest/api'
import { DateTime } from 'luxon'
import { periodOpenedTemplate } from './mail/periodOpened.template.js'

export const rcTestMigrations: DatabaseMigration[] = [
  {
    id: '30251001090000',
    execute: async (db, installTestData) => {
      if (!installTestData) return
      const periodId = await createPeriod({ name: 'Period 1', code: 'Period 1', openDate: DateTime.fromFormat('20260101080000', 'yyyyMMddHHmmss') })
      await markPeriodReviewed(periodId)
    }
  },
  {
    id: '30251001090050',
    execute: async (db, installTestData) => {
      if (!installTestData) return
      // The API only learns which periods carry non-blocking workflow from a cache that refreshes on its own clock, so a
      // period created while the server is running reads as having none and completing its review skips straight to
      // COMPLETE. This one exists at startup, for the specs that need to reach non-blocking workflow.
      const periodId = await createPeriod({ name: 'Period 2', code: 'Period 2', openDate: DateTime.fromFormat('20260101080000', 'yyyyMMddHHmmss') })
      await markPeriodReviewed(periodId)
    }
  },
  {
    id: '30251001090100',
    execute: async db => {
      // rc's own mail template, used by the period_opened_notification scheduled hook. Not test
      // data - the template is part of the application, so it is seeded in every environment.
      // createMailTemplate is ON DUPLICATE KEY UPDATE noop, so an existing (possibly edited) row is left alone.
      const { audience, variables, ...template } = periodOpenedTemplate
      await createMailTemplate({ ...template, audience: audience.join(', '), variables: JSON.stringify(variables) }, db)
    }
  }
]
