import { RequirementDefinition, RequirementStatus, RequirementType } from '@reqquest/api'
import { FutureCommunicationOptInData, minimumGpa, OverrideGPAWarningData, PreQualPromptData, PreQualUserInfoPromptData } from '../models/index.js'

export const step1_prequal_req: RequirementDefinition<PreQualPromptData> = {
  type: RequirementType.PREQUAL,
  key: 'step1_prequal_req',
  title: 'Title goes here',
  navTitle: 'Nav title goes here',
  description: 'Pre qualification requirements',
  promptKeys: ['pre_qual_prompt', 'pre_qual_user_info_prompt'],
  promptKeysNoDisplay: [{ key: 'reviewer_override_gpa_warning_prompt', gate: false }],
  resolve: (data, config) => {
    const preQualPromptData = data['pre_qual_prompt'] as PreQualPromptData
    const preQualUserInfoPromptData = data['pre_qual_user_info_prompt'] as PreQualUserInfoPromptData
    const gpaOverride = data['reviewer_override_gpa_warning_prompt'] as OverrideGPAWarningData
    if (preQualPromptData?.availability == null) return { status: RequirementStatus.PENDING, blame: ['pre_qual_prompt'] }
    if (preQualPromptData?.gpa == null) return { status: RequirementStatus.PENDING, blame: ['pre_qual_prompt'] }
    if (preQualPromptData?.acknowledgeExpectations == null) return { status: RequirementStatus.PENDING, blame: ['pre_qual_prompt'] }
    if (preQualUserInfoPromptData?.correct == null) return { status: RequirementStatus.PENDING, blame: ['pre_qual_user_info_prompt'] }

    if (preQualPromptData.gpa < minimumGpa && !gpaOverride?.override) return { status: RequirementStatus.DISQUALIFYING, reason: `Minimum GPA of ${minimumGpa} required`, blame: ['pre_qual_prompt'] }
    if (preQualPromptData.gpa < minimumGpa) return { status: RequirementStatus.WARNING, reason: `Minimum GPA of ${minimumGpa} commonly required`, blame: ['pre_qual_prompt'] }
    if (!preQualPromptData?.availability) return { status: RequirementStatus.WARNING, reason: 'Not being available 5-10 hours may be a reason for disqualification', blame: ['pre_qual_prompt'] }

    return { status: RequirementStatus.MET }
  }
}

export const future_communication_opt_in_req: RequirementDefinition<FutureCommunicationOptInData> = {
  type: RequirementType.PREQUAL,
  key: 'future_communication_opt_in_req',
  title: 'Future communication',
  navTitle: 'Future communication',
  description: 'Applicant must choose whether to be contacted about future mentorships',
  promptKeys: ['future_communication_opt_in_prompt'],
  resolve: (data, config) => {
    const promptData = data['future_communication_opt_in_prompt'] as FutureCommunicationOptInData
    if (promptData?.optIn == null) return { status: RequirementStatus.PENDING, blame: ['future_communication_opt_in_prompt'] }
    return { status: RequirementStatus.MET }
  }
}
