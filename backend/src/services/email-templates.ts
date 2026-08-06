export type EmailTemplateKey =
  | 'verification_otp'
  | 'welcome'
  | 'password_reset'
  | 'sdk_ready'
  | 'sdk_failed'

export interface EmailTemplateDefinition {
  key: EmailTemplateKey
  description: string
  category: 'transactional' | 'marketing'
  mergeVariables: Record<string, string>
}

export const emailTemplates: Record<EmailTemplateKey, EmailTemplateDefinition> = {
  verification_otp: {
    key: 'verification_otp',
    description: 'One-time passcode to confirm a new email/password account',
    category: 'transactional',
    mergeVariables: {
      NAME: "User's first name",
      OTP: '4-digit verification code',
      EXPIRY_MINUTES: 'Code expiry window in minutes',
    },
  },
  welcome: {
    key: 'welcome',
    description: 'Sent after sign-up to welcome the user to Weldrr',
    category: 'transactional',
    mergeVariables: {
      NAME: "User's first name",
      DASHBOARD_URL: 'Link to the SDK dashboard',
    },
  },
  password_reset: {
    key: 'password_reset',
    description: 'Sent when a user requests a password reset',
    category: 'transactional',
    mergeVariables: {
      NAME: "User's first name",
      CODE: 'One-time password reset code',
      EXPIRY_MINUTES: 'Code expiry window in minutes',
    },
  },
  sdk_ready: {
    key: 'sdk_ready',
    description: 'Sent when an SDK generation completes',
    category: 'transactional',
    mergeVariables: {
      NAME: "User's first name",
      SDK_NAME: 'Name of the generated SDK',
      SDK_URL: 'Link to the generated SDK',
    },
  },
  sdk_failed: {
    key: 'sdk_failed',
    description: 'Sent when an SDK generation fails',
    category: 'transactional',
    mergeVariables: {
      NAME: "User's first name",
      SDK_NAME: 'Name of the failed SDK',
      SDK_URL: 'Link to the SDK details page',
    },
  },
}

export const transactionalTemplateKeys = Object.values(emailTemplates)
  .filter((t) => t.category === 'transactional')
  .map((t) => t.key)

export const marketingTemplateKeys = Object.values(emailTemplates)
  .filter((t) => t.category === 'marketing')
  .map((t) => t.key)
