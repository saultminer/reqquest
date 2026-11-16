export interface RCPreQual {
  lsat: number
  gpa: number
  availability: boolean
  acknowledgeExpectations: boolean
  __prestage: object
}

export interface WrittenAutomation {
  hasWrittenAutomation: boolean
  writtenAutomation: string
}

export interface EvidenceWrittenAutomation {
  appropriateAutomation: boolean
  comments: string
}

export interface InvestigatedFutureCareer {
  interestInCareer: string
}

export interface RateFutureCareer {
  scoreInterestInCareer: string
}

export interface DataRelatedPuzzle {
  puzzleAnswer: string
  additionalDocumentation: any
}

export interface AssessDataRelatedPuzzle {
  score: string
  explanation: string
}

export interface OutsideClassExample {
  outsideClassExample: string
  description: string
}

export interface AssessOutsideClassExample {
  showCriticalThinking: string
  explanation: string
}

export interface CriticalThinking {
  criticalThinkingAnswer: string
}

export interface AssessCriticalThinking {
  realIssue: boolean
  feasable: boolean
}

export interface Organization {
  describeOrganization: string
}

export interface AssessOrganization {
  demonstrateOrganization: boolean
}

export interface Communication {
  describeCommunication: string
}

export interface AssessCommunication {
  demonstrateCommunication: boolean
  comments?: string
}

export interface AssessAttentionDetail {
  demonstrateAttentionDetail: boolean
  grammarErrors: boolean
}

export interface TechnicalTroubleshooting {
  describeTechincalTroubleshooting: string
}

export interface AssessTechnicalTroubleshooting {
  demonstrateTechincalTroubleshooting: boolean
  complexity: number
}

export interface SupportCommunication {
  describeSupportCommunication: string
}

export interface AssessSupportCommunication {
  clarity: string
}

export interface MaintainSysDocumentation {
  maintainSysDocumentation: boolean
  documentation: any
}

export interface AssessMaintainSysDocumentation {
  clarity: boolean
  comments: string
}

export interface ReccomendationLetter {
  reccomendationLetter: any
}

export interface AssessReccomendationLetter {
  score: string
}

export interface VerifyReccomendationLetter {
  authentic: boolean
  addressesTechnicalSkills: boolean
  relationship: string
}

export interface HelpDeskWeekendAvailability {
  weekendAvailable: boolean
}

export interface FutureCommunicationOptIn {
  optIn: boolean
}

export interface HelpDeskCustomerService {
  describeCustomerService: string
}
