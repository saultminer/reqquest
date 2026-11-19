import { OneToManyLoader, PrimaryKeyLoader } from 'dataloader-factory'
import {
  Application, AuthService, getApplicationRequirements, ApplicationRequirement,
  ApplicationRequirementFilter, PeriodProgramRequirement, getPeriodProgramRequirements,
  PeriodProgramKey, PeriodProgramRequirementKey, PeriodRequirementKey, AppRequest,
  AppRequestService, updatePeriodProgramRequirement, RequirementType,
  ConfigurationService, statusVisibleToApplicant, RequirementStatus
} from '../internal.js'
import { BaseService } from '@txstate-mws/graphql-server'

const byIdLoader = new PrimaryKeyLoader({
  fetch: async (ids: string[]) => {
    return await getApplicationRequirements({ ids })
  }
})

const byApplicationIdLoader = new OneToManyLoader({
  fetch: async (applicationIds: string[]) => {
    return await getApplicationRequirements({ applicationIds })
  },
  extractKey: requirement => requirement.applicationId,
  idLoader: byIdLoader
})

const byAppRequestIdLoader = new OneToManyLoader({
  fetch: async (appRequestIds: string[], filters: ApplicationRequirementFilter) => {
    return await getApplicationRequirements({ ...filters, appRequestIds })
  },
  extractKey: (requirement: ApplicationRequirement) => requirement.appRequestId,
  idLoader: [byIdLoader]
})

export class ApplicationRequirementServiceInternal extends BaseService<ApplicationRequirement> {
  async findById (id: string, appRequestTags?: Record<string, string[]>) {
    const req = await this.loaders.get(byIdLoader).load(id)
    req!.appRequestTags = appRequestTags ?? await this.svc(AppRequestService).getTags(req!.appRequestId)
    return req
  }

  async findByAppRequest (appRequest: AppRequest) {
    const reqs = await this.loaders.get(byAppRequestIdLoader).load(appRequest.id)
    for (const req of reqs) req.appRequestTags = appRequest.tags
    return reqs
  }

  async findByApplication (application: Application) {
    const reqs = await this.loaders.get(byApplicationIdLoader).load(application.id)
    for (const req of reqs) req.appRequestTags = application.appRequestTags
    return reqs
  }
}

export class ApplicationRequirementService extends AuthService<ApplicationRequirement> {
  raw = this.svc(ApplicationRequirementServiceInternal)
  async findById (id: string, appRequestTags?: Record<string, string[]>) {
    const req = await this.raw.findById(id, appRequestTags)
    return this.removeUnauthorized(req)
  }

  async findByAppRequest (appRequest: AppRequest) {
    const reqs = await this.raw.findByAppRequest(appRequest)
    return this.removeUnauthorized(reqs)
  }

  async findByApplication (application: Application) {
    const reqs = await this.raw.findByApplication(application)
    return this.removeUnauthorized(reqs)
  }

  async getConfigurationData (requirement: ApplicationRequirement) {
    if (!this.mayViewConfig(requirement)) return undefined
    return await this.svc(ConfigurationService).getData(requirement.periodId, requirement.key)
  }

  authorize (requirements: ApplicationRequirement[]) {
    return this.removeUnauthorized(requirements)
  }

  isOwn (requirement: ApplicationRequirement): boolean {
    return requirement.userInternalId === this.user?.internalId
  }

  // requirements need to be visible so that we can see the statusReason and show it
  // to everyone who can see the app request, we have a mayViewDetails below to control
  // elevated access like viewing the configuration data
  mayView (requirement: ApplicationRequirement): boolean {
    // TODO: block applicants from viewing non-blocking workflow requirements
    if (this.isOwn(requirement)) return true
    return this.hasControl('AppRequest', 'review', requirement.appRequestTags)
  }

  // remove requirement statuses for review requirements
  removeProperties (req: ApplicationRequirement) {
    const redactTitle = this.isOwn(req) && !this.hasControl('AppRequest', 'review_own', req.appRequestTags)
    const redactStatus = redactTitle && !statusVisibleToApplicant(req.applicationPhase, req.appRequestPhase) && [RequirementType.APPROVAL, RequirementType.WORKFLOW].includes(req.type)
    const ret = redactTitle || redactStatus ? ApplicationRequirement.clone(req) : req
    if (redactTitle) {
      ret.title = ''
    }
    if (redactStatus) {
      ret.status = RequirementStatus.PENDING
      ret.statusReason = undefined
      ret.setBlame(undefined)
    }
    return ret
  }

  mayViewConfig (requirement: ApplicationRequirement) {
    const isReviewer = this.hasControl('AppRequest', 'review', requirement.appRequestTags) && (!this.isOwn(requirement) || this.hasControl('AppRequest', 'review_own', requirement.appRequestTags))
    const isOwn = this.isOwn(requirement)
    if (!isReviewer && !isOwn) return false

    if ([RequirementType.ACCEPTANCE, RequirementType.POSTQUAL, RequirementType.PREQUAL, RequirementType.QUALIFICATION].includes(requirement.type)) return true

    if (isReviewer) {
      const visiblePrompts = requirement.definition.visiblePrompts
      if (visiblePrompts.some(prompt => this.hasControl('PromptAnswer', 'view', { ...prompt.authorizationKeys, ...requirement.appRequestTags }))) return true
    }
    return false
  }
}

const periodRequirementByFullKeyLoader = new PrimaryKeyLoader({
  fetch: async (keys: PeriodProgramRequirementKey[]) => {
    return await getPeriodProgramRequirements({ keys })
  },
  extractId: row => ({ periodId: row.periodId, programKey: row.programKey, requirementKey: row.key })
})

const periodRequirementsByPeriodIdLoader = new OneToManyLoader({
  fetch: async (periodIds: string[]) => {
    return await getPeriodProgramRequirements({ periodIds })
  },
  extractKey: row => row.periodId,
  idLoader: periodRequirementByFullKeyLoader
})

const periodRequirementsByPeriodIdAndRequirementKeyLoader = new OneToManyLoader({
  fetch: async (periodRequirementKeys: PeriodRequirementKey[]) => {
    return await getPeriodProgramRequirements({ periodRequirementKeys })
  },
  extractKey: row => ({ periodId: row.periodId, requirementKey: row.key }),
  idLoader: periodRequirementByFullKeyLoader
})

const periodProgramRequirementsByPeriodIdAndProgramKeyLoader = new OneToManyLoader({
  fetch: async (periodPrograms: PeriodProgramKey[]) => {
    return await getPeriodProgramRequirements({ periodPrograms })
  },
  extractKey: row => ({ periodId: row.periodId, programKey: row.programKey })
})

export class PeriodRequirementService extends AuthService<PeriodProgramRequirement> {
  async findByPeriodId (periodId: string) {
    return await this.loaders.get(periodRequirementsByPeriodIdLoader).load(periodId)
  }

  async findByPeriodIdAndProgramKey (periodId: string, programKey: string) {
    return await this.loaders.get(periodProgramRequirementsByPeriodIdAndProgramKeyLoader).load({ periodId, programKey })
  }

  async findByPeriodIdAndRequirementKey (periodId: string, requirementKey: string) {
    return await this.loaders.get(periodRequirementsByPeriodIdAndRequirementKeyLoader).load({ periodId, requirementKey })
  }

  async findByKey (periodId: string, programKey: string, requirementKey: string) {
    return await this.loaders.get(periodRequirementByFullKeyLoader).load({ periodId, programKey, requirementKey })
  }

  async update (periodId: string, requirementKey: string, disabled: boolean) {
    return await updatePeriodProgramRequirement(periodId, requirementKey, disabled)
  }

  mayConfigure (requirement: PeriodProgramRequirement) {
    if (requirement.definition.configuration == null) return false
    return this.hasControl('Requirement', 'configure', requirement.authorizationKeys)
  }
}
