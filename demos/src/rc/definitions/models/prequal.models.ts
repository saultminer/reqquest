import type { SchemaObject } from '@txstate-mws/fastify-shared'
import type { FromSchema } from 'json-schema-to-ts'

export const PrequalPromptSchema = {
  type: 'object',
  properties: {
    gpa: { type: 'number' },
    availability: { type: 'boolean' },
    acknowledgeExpectations: { type: 'boolean' },
    orgs: { type: 'array', items: { type: 'string' } }
  },
  additionalProperties: false
} as const satisfies SchemaObject
export type PreQualPromptData = FromSchema<typeof PrequalPromptSchema>

export const minimumGpa = 2.5

export const orgs = ['Student Government', 'Debate Club', 'Drama Club', 'Music Club', 'Choir', 'Band', 'Orchestra', 'Art Club', 'Photography Club', 'Film Club', 'Creative Writing Club', 'Journalism Club', 'Newspaper Staff', 'Yearbook Club', 'Robotics Club', 'Coding Club', 'Computer Science Club', 'Math Club', 'Science Club', 'Biology Club', 'Chemistry Club', 'Physics Club', 'Environmental Club', 'Sustainability Club', 'Astronomy Club', 'Engineering Club', 'Entrepreneurship Club', 'Business Club', 'Marketing Club', 'Finance Club', 'Investment Club', 'Economics Club', 'Psychology Club', 'Sociology Club', 'Philosophy Club', 'History Club', 'Political Science Club', 'Model United Nations', 'Mock Trial', 'Pre-Med Club', 'Pre-Law Society', 'Nursing Students Association', 'Education Club', 'Language Clubs', 'Spanish Club', 'French Club', 'German Club', 'Chinese Club', 'Japanese Club', 'Cultural Clubs', 'International Students Association', 'Black Student Union', 'Hispanic/Latino Student Association', 'Asian Student Association', 'LGBTQ+ Alliance', 'Women’s Club', 'Men’s Group', 'Religious Organizations', 'Christian Fellowship', 'Muslim Student Association', 'Jewish Student Union', 'Hindu Student Council', 'Volunteer Club', 'Community Service Club', 'Habitat for Humanity Chapter', 'Red Cross Club', 'Amnesty International Club', 'Animal Welfare Club', 'Gaming Club', 'Esports Club', 'Chess Club', 'Board Games Club', 'Anime Club', 'Comic Book Club', 'Outdoor Adventure Club', 'Hiking Club', 'Ski Club', 'Surf Club', 'Dance Club', 'Cheerleading Squad', 'Fitness Club', 'Yoga Club', 'Martial Arts Club']

export const PrequalLsatPrestageSchema = {
  type: 'object',
  properties: {
    lsat: { type: 'number' }
  },
  additionalProperties: false
} as const satisfies SchemaObject
export type PrequalLsatPrestageData = FromSchema<typeof PrequalLsatPrestageSchema>


export const PrequalUserInfoPromptSchema = {
  type: 'object',
  properties: {
    correct: { type: 'boolean'}
  },
  additionalProperties: false
} as const satisfies SchemaObject
export type PreQualUserInfoPromptData = FromSchema<typeof PrequalUserInfoPromptSchema>

export const FutureCommunicationOptInSchema = {
  type: 'object',
  properties: {
    optIn: { type: 'boolean' }
  },
  additionalProperties: false
} as const satisfies SchemaObject
export type FutureCommunicationOptInData = FromSchema<typeof FutureCommunicationOptInSchema>

export const PrequalUserInfoPrestagePropmtSchema = {
  type: 'object',
  properties: {
    netid: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' }
  },
  additionalProperties: false
} as const satisfies SchemaObject
export type PreQualUserInfoPrestagePromptData = FromSchema<typeof PrequalUserInfoPrestagePropmtSchema>