import { ProgramDefinition, AppRequestPhase, WorkflowStage } from '@reqquest/api'

const overrideGpaWarningWorkflow: WorkflowStage = {
  key: 'override_gpa_warning',
  nonBlocking: true,
  nonBlockingEmergence: AppRequestPhase.STARTED,
  title: 'Override GPA Warning',
  requirementKeys: ['reviewer_override_gpa_warning_req']
}

const operations_infrastructure: ProgramDefinition = {
  title: 'Operations & Infrastructure',
  eligibilityDescription: 'Requires operation infrastructure knowledge',
  requirementKeys: [
    'operations_infrastructure_opt_out_req',
    'step1_prequal_req',
    'weekend_coverage_req',
    'written_automation_req',
    'evidence_automation_req',
    'investigated_future_career_req',
    'rate_future_career_req',
    'reccomendation_letter_req',
    'assess_reccomendation_lettern_req'
  ],
  workflowStages: [
    overrideGpaWarningWorkflow
  ]
}
const software_development: ProgramDefinition = {
  title: 'Software Development',
  requirementKeys: [
    'software_dev_opt_out_req',
    'step1_prequal_req',
    'data_related_puzzle_req',
    'assess_data_related_puzzle_req',
    'outside_class_example_req',
    'assess_outside_class_example_req',
    'critical_thinking_req',
    'assess_critical_thinking_req',
    'reccomendation_letter_req',
    'assess_reccomendation_lettern_req'
  ],
  workflowStages: [
    overrideGpaWarningWorkflow,
    {
      key: 'software_development_blocking_second_eyes',
      nonBlocking: false,
      title: 'Second reviewer assessment',
      requirementKeys: ['reviewer_software_development_second_eyes_req']
    },
    {
      key: 'software_development_non_blocking_show_submitted',
      nonBlocking: true,
      nonBlockingEmergence: AppRequestPhase.SUBMITTED,
      title: 'Audit the actively ongoing review',
      requirementKeys: ['audit_software_development_non_blocking_show_submitted_req']
    },
    {
      key: 'software_development_non_blocking_show_submitted2',
      nonBlocking: true,
      nonBlockingEmergence: AppRequestPhase.SUBMITTED,
      title: 'Audit the actively ongoing review for a second time',
      requirementKeys: ['audit_software_development_non_blocking_show_submitted_req2']
    },
    {
      key: 'software_development_non_blocking_show_regular',
      nonBlocking: true,
      title: 'Audit the entire program after all other phases complete',
      requirementKeys: ['audit_software_development_non_blocking_show_regular_req']
    },
    {
      key: 'software_development_non_blocking_show_regular2',
      nonBlocking: true,
      title: 'Audit the entire program again after all other phases complete',
      requirementKeys: ['audit_software_development_non_blocking_show_regular_req2']
    }
  ]
}
const project_management: ProgramDefinition = {
  title: 'Project Management',
  // demonstrates hiding a program from applicants and reviewers when the applicant was screened out of it
  // before submitting - see the low-GPA path in step1_prequal_req
  showIneligiblePreSubmit: false,
  requirementKeys: [
    'project_management_opt_out_req',
    'step1_prequal_req',
    'communication_req',
    'assess_communicationn_req',
    // 'attention_detail_req',
    'assess_attention_detail_req',
    'organization_req',
    'assess_organization_req',
    'reccomendation_letter_req',
    'assess_reccomendation_lettern_req'
  ],
  workflowStages: [
    overrideGpaWarningWorkflow
  ]
}
const application_management_support: ProgramDefinition = {
  title: 'Application Management & Support',
  requirementKeys: [
    'application_management_opt_out_req',
    'step1_prequal_req',
    'weekend_coverage_req',
    'technical_troubleshooting_req',
    'assess_technical_troubleshootingn_req',
    'support_communication_req',
    'assess_support_communicationn_req',
    'maintain_sys_documentation_req',
    'assess_maintain_sys_documentation_req',
    'reccomendation_letter_req',
    'assess_reccomendation_lettern_req'
  ],
  workflowStages: [
    overrideGpaWarningWorkflow
  ]
}
// no review, acceptance, or workflow requirements, so its application completes as soon as the request is submitted
const help_desk_associate: ProgramDefinition = {
  title: 'Help Desk Associate',
  requirementKeys: [
    'help_desk_opt_out_req',
    'step1_prequal_req',
    'help_desk_weekend_availability_req',
    'help_desk_customer_service_req'
  ]
}

/**
 * Declared order is preserved and is meaningful. Do not convert this to `import * as` - a module
 * namespace iterates alphabetically rather than in declared order, and RQServer.start rejects one.
 */
export const rcPrograms = {
  operations_infrastructure,
  software_development,
  project_management,
  application_management_support,
  help_desk_associate
}
