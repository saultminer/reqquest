import { MutationMessage, PromptDefinition, PromptPreStagingRecurrence } from '@reqquest/api'
import { FutureCommunicationOptInData, FutureCommunicationOptInSchema, minimumGpa, orgs, PrequalLsatPrestageData, PrequalLsatPrestageSchema, PreQualPromptData, PrequalPromptSchema, PreQualUserInfoPrestagePromptData, PrequalUserInfoPrestagePropmtSchema, PreQualUserInfoPromptData, PrequalUserInfoPromptSchema } from '../models/prequal.models.js'
import { MutationMessageType } from '@txstate-mws/graphql-server'

export const pre_qual_user_info_prompt: PromptDefinition<PreQualUserInfoPromptData> = {
  key: 'pre_qual_user_info_prompt',
  title: 'Confirm User info',
  description: 'Confirm personal user information',
  prestage: {
    recur: PromptPreStagingRecurrence.ALWAYS,
    schema: PrequalUserInfoPrestagePropmtSchema,
    fetch: (appRequest, config, allPeriodConfig, ctx): PreQualUserInfoPrestagePromptData  => {
      return {
        netid: ctx.login,
        name: ctx.authInfo?.user?.fullname ?? ctx.login,
        email: ctx.authInfo?.user?.email ?? `${ctx.login}@request-next.local`
      }
    }
  },
  schema: PrequalUserInfoPromptSchema,
  validate: (data, config) => {
    const messages: MutationMessage[] = []
    if (data.correct == null) messages.push({ type: MutationMessageType.error, message: 'Please confirm if your personal info is correct.', arg: 'correct' })
    return messages
  }
}

export const pre_qual_prompt: PromptDefinition<PreQualPromptData> = {
  key: 'pre_qual_prompt',
  title: 'Qualifications and expectations',
  description: 'MWS Technical Mentorship Experience Qualifications and expectations',
  prestage: {
    recur: PromptPreStagingRecurrence.ALWAYS,
    schema: PrequalLsatPrestageSchema,
    fetch: (appRequest, config, allPeriodConfig, ctx): PrequalLsatPrestageData  => {
      return {
        lsat: Math.floor(Math.random() * (180 - 120 + 1)) + 120
      }
    }
  },
  schema: PrequalPromptSchema,
  fetch: () => {
    return orgs
  },
  validate: (data, config) => {
    const messages: MutationMessage[] = []
    if (data.acknowledgeExpectations == null) messages.push({ type: MutationMessageType.error, message: 'Please acknowledge participation expectations.', arg: 'acknowledgeExpectations' })

    if (data.gpa == null) {
      messages.push({ type: MutationMessageType.error, message: 'Please enter your GPA.', arg: 'gpa' })
    } else if (data.gpa < minimumGpa) {
      messages.push({ type: MutationMessageType.warning, message: `Your GPA must be a minimum of ${minimumGpa}`, arg: 'gpa' })
    }

    if (data.availability == null) messages.push({ type: MutationMessageType.error, message: 'Please acknowledge availability expectations.', arg: 'availability' })

    return messages
  }
}

export const future_communication_opt_in_prompt: PromptDefinition<FutureCommunicationOptInData> = {
  key: 'future_communication_opt_in_prompt',
  title: 'Future communication',
  description: 'Opt into communication for future mentorships available?',
  schema: FutureCommunicationOptInSchema,
  validate: (data, config) => {
    const messages: MutationMessage[] = []
    if (data.optIn == null) messages.push({ type: MutationMessageType.error, message: 'You must select whether you wish to opt into future communications', arg: 'optIn' })
    return messages
  }
}
