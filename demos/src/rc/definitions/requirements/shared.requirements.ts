import { RequirementDefinition, RequirementStatus, RequirementType } from '@reqquest/api'
import { AssessReccomendationLettersData, HelpDeskWeekendAvailabilityData, minimumGpa, OverrideGPAWarningData, PreQualPromptData, ReccomendationLettersData } from '../models/index.js'

/**
 * One requirement, two programs, two standards. Operations & Infrastructure carries weekend on-call, so
 * no weekend availability rules the applicant out; Application Management & Support only prefers it, so
 * the same answer is a warning there.
 *
 * It asks the `program` selector for the key only when the answer is "no". When the answer is "yes" it
 * never looks, so it is evaluated once for the whole request and both programs reuse the result.
 */
export const weekend_coverage_req: RequirementDefinition = {
  type: RequirementType.QUALIFICATION,
  key: 'weekend_coverage_req',
  title: 'Weekend Coverage',
  navTitle: 'Weekend Coverage',
  description: 'Operations & Infrastructure requires weekend on-call availability; Application Management & Support prefers it',
  promptKeys: ['help_desk_weekend_availability_prompt'],
  resolve: (data, config, configLookup, program) => {
    const promptData = data['help_desk_weekend_availability_prompt'] as HelpDeskWeekendAvailabilityData
    if (promptData?.weekendAvailable == null) return { status: RequirementStatus.PENDING }
    if (promptData.weekendAvailable) return { status: RequirementStatus.MET }
    const { key, title } = program({ key: true, title: true })
    if (key === 'operations_infrastructure') return { status: RequirementStatus.DISQUALIFYING, reason: `${title} requires weekend on-call availability`, blame: ['help_desk_weekend_availability_prompt'] }
    return { status: RequirementStatus.WARNING, reason: `${title} prefers weekend availability`, blame: ['help_desk_weekend_availability_prompt'] }
  }
}

export const reccomendation_letter_req: RequirementDefinition = {
  type: RequirementType.QUALIFICATION,
  key: 'reccomendation_letter_req',
  title: 'Technical Troubleshooting',
  navTitle: 'Technical Troubleshooting',
  description: 'Technical Troubleshooting',
  promptKeys: ['reccomendation_letter_prompt'],
  resolve: (data, config) => {
    const writtenAutomationData = data['reccomendation_letter_prompt'] as ReccomendationLettersData
    if (writtenAutomationData?.reccomendationLetter == null) return { status: RequirementStatus.PENDING }
    return { status: RequirementStatus.MET }
  }
}

export const assess_reccomendation_letter_req: RequirementDefinition = {
  type: RequirementType.APPROVAL,
  key: 'assess_reccomendation_lettern_req',
  title: 'Assess Technical Troubleshooting',
  navTitle: 'Assess Technical Troubleshooting',
  description: 'Assess Technical Troubleshooting ',
  promptKeys: ['assess_reccomendation_letter_prompt'],
  resolve: (data, config) => {
    const niceData = data['assess_reccomendation_letter_prompt'] as AssessReccomendationLettersData
    if (niceData?.score == null) return { status: RequirementStatus.PENDING }
    return { status: RequirementStatus.MET }
  }
}

export const reviewer_override_gpa_warning_req: RequirementDefinition = {
  type: RequirementType.WORKFLOW,
  key: 'reviewer_override_gpa_warning_req',
  title: 'Override GPA Warning',
  navTitle: 'Override GPA Warning',
  description: 'Override GPA minimum requirement to not show warning',
  promptKeys: ['reviewer_override_gpa_warning_prompt'],
  promptKeysNoDisplay: ['pre_qual_prompt'],
  resolve: (data, config) => {
    const preQualPromptData = data['pre_qual_prompt'] as PreQualPromptData | undefined
    if (preQualPromptData?.gpa == null) return { status: RequirementStatus.PENDING }
    if (preQualPromptData.gpa >= minimumGpa) return { status: RequirementStatus.NOT_APPLICABLE }
    const overrideGpaWarningData = data['reviewer_override_gpa_warning_prompt'] as OverrideGPAWarningData
    if (overrideGpaWarningData?.override == null) return { status: RequirementStatus.PENDING }
    if (overrideGpaWarningData.override) {
      return { status: RequirementStatus.WARNING, reason: 'Overriding gpa may have unintended consequences', blame: ['reviewer_override_gpa_warning_prompt'] }
    }
    return { status: RequirementStatus.MET }
  }
}
