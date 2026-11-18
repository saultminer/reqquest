import { type AppDefinition, CategoryTag, RQServer } from '@reqquest/api'
import { analyticsPlugin, unifiedAuthenticate } from 'fastify-txstate'
import { DateTime } from 'luxon'

import { defaultTestMigrations } from './default/testdata.js'
import { defaultPrograms } from './default/definitions/programs.js'
import * as defaultRequirements from './default/definitions/requirements/index.js'
import * as defaultPrompts from './default/definitions/prompts/index.js'

import { simpleTestMigrations } from './simple/testdata.js'
import { simplePrograms } from './simple/definitions/programs.js'
import * as simpleRequirements from './simple/definitions/requirements/index.js'
import * as simplePrompts from './simple/definitions/prompts/index.js'

import { multiTestMigrations } from './multi/testdata.js'
import { defaultPrograms as multiPrograms } from './default/definitions/programs.js'
import * as multiRequirements from './default/definitions/requirements/index.js'
import * as multiPrompts from './default/definitions/prompts/index.js'

import { complexTestMigrations } from './complex/testdata.js'
import { complexPrograms } from './complex/definitions/programs.js'
import * as complexRequirements from './complex/definitions/requirements/index.js'
import * as complexPrompts from './complex/definitions/prompts/index.js'

import { rcTestMigrations } from './rc/testdata.js'
import { rcPrograms } from './rc/definitions/programs.js'
import * as rcRequirements from './rc/definitions/requirements/index.js'
import * as rcPrompts from './rc/definitions/prompts/index.js'
import { rcHooks } from './rc/hooks/index.js'

interface UserOtherInfo {
  email: string
  indexes: {
    institutionalRoles: string[]
    lastLogin: DateTime
  }
}

async function main () {
  const server = new RQServer({
    authenticate: unifiedAuthenticate,
    validOrigins: process.env.NODE_ENV === 'development' ? ['http://localhost', 'http://localhost:3000'] : undefined
  })

  await server.app.register(analyticsPlugin, { appName: 'reqquest', authorize: req => !!req.auth?.username.length })

  const { programs, requirements, prompts, migrations, multipleRequestsPerPeriod, hooks } = configureDemoInstanceParams()

  const userTypes: Record<string, { groups: string[] }> = {
    su: { groups: ['sudoers'] },
    admin: { groups: ['administrators'] },
    reviewer: { groups: ['reviewers'] },
    commentator: { groups: ['commentators'] },
    applicant: { groups: ['applicants'] },
    tester: { groups: ['testers'] }
  }
  const userTypePrefixes = Object.keys(userTypes)
  await server.start({
    appConfig: {
      multipleRequestsPerPeriod,
      applicantGuide: true,
      userLookups: {
        byLogins: async (logins: string[], applicableGroups: string[]) => {
          const pseudoInstitutionalRoles = (login: string) => {
            if (login.startsWith('su') || login.startsWith('tester') || login.startsWith('commentator')) return ['STAFF']
            if (login.startsWith('admin')) return ['STAFF', 'FACULTY']
            if (login.startsWith('review')) return ['FACULTY']
            return ['STUDENT']
          }
          return logins.filter(login => userTypePrefixes.some(p => login.startsWith(p))).map(
            login => ({
              login,
              fullname: `${login} Full Name`,
              email: 'reqquest-next@qual.txstate.edu',
              groups: userTypes[userTypePrefixes.find(p => login.startsWith(p))!].groups,
              otherInfo: {
                email: 'reqquest-next@qual.txstate.edu',
                indexes: {
                  institutionalRoles: pseudoInstitutionalRoles(login),
                  lastLogin: DateTime.fromJSDate(new Date())
                }
              }
            })
          )
        },
        indexes: [{
          category: 'institutionalRoles',
          label: 'Institutional Roles',
          useInFilters: true,
          useInList: true,
          // Example of reformatting so tag may be used both for index and display.
          dataToCategoryTags: (data: UserOtherInfo | undefined) => data?.indexes.institutionalRoles.map(role => ({ tag: role.charAt(0).toLocaleUpperCase() + role.slice(1).toLocaleLowerCase() })) ?? []
        }, {
          category: 'lastLogin',
          label: 'Last Login',
          useInFilters: false,
          useInList: true,
          // Example of tag turning date data into epoch index for sortable timestamp.
          // and label simplifying date for display format.
          dataToCategoryTags: (data: UserOtherInfo | undefined) => [{ tag: data?.indexes.lastLogin.toSeconds().toString(), label: data?.indexes.lastLogin.toFormat('MM/dd/yyyy') }].filter(t => t.tag != null) as CategoryTag[]
        }]
      },
      groups: async (groupnames: string[]) => {
        const groupDateAdded = (groupname: string): DateTime => {
          if (['sudoers', 'administrators', 'reviewers', 'applicants'].includes(groupname)) return DateTime.fromFormat('20240101080000', 'yyyyMMddHHmmss')
          return DateTime.fromFormat('20250601080000', 'yyyyMMddHHmmss')
        }
        return groupnames.map(groupName => ({ groupName, managers: [{ fullname: `${String(groupName).charAt(0).toLocaleUpperCase() + String(groupName).slice(1)} Lastname`, email: `${groupName.toLocaleLowerCase()}@txstate.edu` }], dateCreated: groupDateAdded(groupName) }))
      },
      emailConfig: {
        appName: 'Reqquest',
        signature: 'Mobile Web Systems',
        from: 'Reqquest <reqquest@txstate.edu>',
        // remind applicants with an unsubmitted request starting 14 days before the period closes,
        // then every 3 days until it closes or they submit (sends only while the period_closing_reminder template is enabled)
        periodClosing: { daysBefore: 14, reminderDays: 3 }
      },
      hooks
    },
    programs,
    requirements,
    prompts,
    migrations
  })
}

main().catch(e => { console.error(e) })

function configureDemoInstanceParams () {
  if (process.env.DEMO_INSTANCE === 'simple') return {
    programs: simplePrograms,
    requirements: simpleRequirements,
    prompts: simplePrompts,
    migrations: simpleTestMigrations,
    multipleRequestsPerPeriod: false,
    hooks: undefined as AppDefinition['hooks']
  }
  else if (process.env.DEMO_INSTANCE === 'multi') return {
    programs: multiPrograms,
    requirements: multiRequirements,
    prompts: multiPrompts,
    migrations: multiTestMigrations,
    multipleRequestsPerPeriod: true,
    hooks: undefined as AppDefinition['hooks']
  }
  else if (process.env.DEMO_INSTANCE === 'complex') return {
    programs: complexPrograms,
    requirements: complexRequirements,
    prompts: complexPrompts,
    migrations: complexTestMigrations,
    multipleRequestsPerPeriod: false,
    hooks: undefined as AppDefinition['hooks']
  }
  else if (process.env.DEMO_INSTANCE === 'rc') return {
    programs: rcPrograms,
    requirements: rcRequirements,
    prompts: rcPrompts,
    migrations: rcTestMigrations,
    multipleRequestsPerPeriod: false,
    hooks: rcHooks
  }
  return {
    programs: defaultPrograms,
    requirements: defaultRequirements,
    prompts: defaultPrompts,
    migrations: defaultTestMigrations,
    multipleRequestsPerPeriod: false,
    hooks: undefined as AppDefinition['hooks']
  }
}
