import { DatabaseMigration } from '../migrations'
import { seedMailTemplates } from './mail.seed.js'
import { updateMailTemplateContent } from './mail.database.js'
import { applicationRescindedTemplate, applicationRestoredTemplate, periodClosingReminderTemplate } from './templates/index.js'

export const mailMigrations: DatabaseMigration[] = [
  {
    id: '20260629000000',
    async execute (db) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS mail_templates (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          templateKey VARCHAR(255) NOT NULL,
          description VARCHAR(255) NOT NULL,
          audience VARCHAR(255) NOT NULL,
          variables LONGTEXT,
          subject VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          enabled TINYINT(1) NOT NULL DEFAULT 0,
          UNIQUE (templateKey)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS mail_outbox (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          templateKey VARCHAR(255) NOT NULL,
          emailTo VARCHAR(255) NOT NULL,
          replyTo VARCHAR(255),
          variables LONGTEXT,
          triggeredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          sentAt DATETIME,
          status VARCHAR(255) NOT NULL,
          attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
          lastErrorAt DATETIME,
          lastErrorMessage VARCHAR(255),
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `)
      await seedMailTemplates(db)
    }
  },
  {
    id: '20260817000000',
    async execute (db) {
      // seed the templates added since the initial migration (rescind/restore), leaving existing rows untouched
      await seedMailTemplates(db)
    }
  },
  {
    id: '20260817000100',
    async execute (db) {
      // application_complete shipped with a variable name 'applicationName' nothing supplies, so it rendered blank.
      await db.update("UPDATE mail_templates SET body = REPLACE(body, '{{applicationName}}', '{{appName}}') WHERE templateKey = 'application_complete'")
    }
  },
  {
    id: '20260922000000',
    async execute (db) {
      // application_rescinded and application_restored were revised to the wording approved in reqquest-txstate#389.
      // The seeder deliberately leaves existing rows alone, so push the new content onto databases that already hold
      // the originals. This overwrites any local edits to those two rows; there is no admin edit surface yet.
      for (const { templateKey, subject, body, description } of [applicationRescindedTemplate, applicationRestoredTemplate]) {
        await updateMailTemplateContent({ templateKey, subject, body, description }, db)
      }
      // dedupKey lets a recurring job (the period-closing reminder) enqueue idempotently:
      // INSERT IGNORE against the unique index means a re-run adds nothing.
      const exists = await db.getval("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mail_outbox' AND COLUMN_NAME = 'dedupKey'")
      if (!exists) await db.execute('ALTER TABLE mail_outbox ADD COLUMN dedupKey VARCHAR(255) NULL, ADD UNIQUE INDEX mail_outbox_dedupKey (dedupKey)')
      // seed the period_closing_reminder template, leaving existing rows untouched
      await seedMailTemplates(db)
    }
  },
  {
    id: '20261006000000',
    async execute (db) {
      // application_rescinded and application_restored wording was revised again after 20260922000000 shipped in v1.15.0;
      // push the new content onto databases that already hold the earlier version. Overwrites local edits to those rows.
      for (const { templateKey, subject, body, description } of [applicationRescindedTemplate, applicationRestoredTemplate]) {
        await updateMailTemplateContent({ templateKey, subject, body, description }, db)
      }
    }
  },
  {
    id: '20261116000000',
    async execute (db) {
      // period_closing_reminder wording was revised in reqquest-txstate#364 after 20260922000000 seeded the original;
      // push the new content onto databases that already hold it. Overwrites local edits to that row.
      const { templateKey, subject, body, description } = periodClosingReminderTemplate
      await updateMailTemplateContent({ templateKey, subject, body, description }, db)
    }
  }
]
