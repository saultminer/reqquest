const subject = 'Submit Your Application: {{appName}}'

const body = `Hello,

You previously started an application for {{appName}}. The submission period is closing soon, and unsubmitted applications may not be reviewed once the deadline passes.

Please log in to review your application status, complete your application, or withdraw it if it is no longer needed.

<a href="{{loginLink}}">Login</a>

Thank you,
{{signature}}`

export const periodClosingReminderTemplate = {
  subject,
  body,
  description: 'Reminder sent to applicants who have started but not submitted a request as the period close date approaches. Cadence is set by emailConfig.periodClosing.daysBefore and emailConfig.periodClosing.reminderDays.',
  audience: ['applicant'],
  templateKey: 'period_closing_reminder',
  variables: {
    loginLink: process.env.PUBLISHED_BASE_URL
  }
}
