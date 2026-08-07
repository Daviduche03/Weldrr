import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_URL: z.string().optional(),
  RAILWAY_PUBLIC_DOMAIN: z.string().optional(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  GOOGLE_CLIENT_ID: z.string().default(''),
  APPLE_CLIENT_ID: z.string().default(''),

  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  GITHUB_CALLBACK_URL: z
    .string()
    .url('GITHUB_CALLBACK_URL must be a valid URL')
    .or(z.literal(''))
    .default(''),

  ZEPTOMAIL_TOKEN: z.string().default(''),
  ZEPTOMAIL_FROM: z.string().default(''),
  ZEPTOMAIL_FROM_NAME: z.string().default('Weldrr'),

  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET: z.string().default(''),
  R2_PUBLIC_URL: z.string().default(''),

  OPENAI_API_KEY: z.string().default(''),
  AI_MODEL: z.string().default('gpt-4o-mini'),

  MODAL_TOKEN_ID: z.string().default(''),
  MODAL_TOKEN_SECRET: z.string().default(''),
  MODAL_ENVIRONMENT: z.string().default(''),
  MODAL_APP_NAME: z.string().default('weldrr-sandboxes'),
  MODAL_IMAGE_NAME: z.string().default('weldrr-sandbox-runtime'),

  SANDBOX_PROVIDER_API_KEY: z.string().default(''),
  SANDBOX_OPENCODE_MODEL: z.string().default('opencode-go/deepseek-v4-flash'),
  SANDBOX_OPENCODE_PORT: z.coerce.number().int().positive().default(4096),
  SANDBOX_TIMEOUT_MS: z.coerce.number().int().positive().default(60 * 60 * 1000),
  SANDBOX_IDLE_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  SANDBOX_CALLBACK_URL: z
    .string()
    .url('SANDBOX_CALLBACK_URL must be a valid URL')
    .or(z.literal(''))
    .default(''),
  SANDBOX_CREDENTIAL_ENCRYPTION_KEY: z.string().default(''),
  SANDBOX_TEMPLATES: z
    .string()
    .default('{"typescript":"","python":"","java":"","go":"","ruby":"","php":"","docs":""}'),
})

const parseEnv = (raw: NodeJS.ProcessEnv): z.infer<typeof envSchema> => {
  const result = envSchema.safeParse(raw)

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ')
    throw new Error(`Invalid environment configuration: ${messages}`)
  }

  return result.data
}

const env = parseEnv(process.env)

const publicUrl =
  env.PUBLIC_URL ?? (env.RAILWAY_PUBLIC_DOMAIN ? `https://${env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${env.PORT}`)

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  appUrl: publicUrl,
  databaseUrl: env.DATABASE_URL,
  logLevel: env.LOG_LEVEL,
  corsOrigins: env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    secret: env.JWT_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  google: { clientId: env.GOOGLE_CLIENT_ID },
  apple: { clientId: env.APPLE_CLIENT_ID },
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    callbackUrl:
      env.GITHUB_CALLBACK_URL || `${publicUrl}/api/github/callback`,
  },
  zeptomail: {
    token: env.ZEPTOMAIL_TOKEN,
    from: env.ZEPTOMAIL_FROM,
    fromName: env.ZEPTOMAIL_FROM_NAME,
  },
  r2: {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET,
    publicUrl: env.R2_PUBLIC_URL,
  },
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    model: env.AI_MODEL,
  },
  modal: {
    tokenId: env.MODAL_TOKEN_ID,
    tokenSecret: env.MODAL_TOKEN_SECRET,
    environment: env.MODAL_ENVIRONMENT,
    appName: env.MODAL_APP_NAME,
    imageName: env.MODAL_IMAGE_NAME,
  },
  sandbox: {
    providerApiKey: env.SANDBOX_PROVIDER_API_KEY,
    opencodeModel: env.SANDBOX_OPENCODE_MODEL,
    opencodePort: env.SANDBOX_OPENCODE_PORT,
    timeoutMs: env.SANDBOX_TIMEOUT_MS,
    idleTimeoutMs: env.SANDBOX_IDLE_TIMEOUT_MS,
    callbackUrl: env.SANDBOX_CALLBACK_URL,
    templates: parseTemplates(env.SANDBOX_TEMPLATES),
    credentialEncryptionKey: env.SANDBOX_CREDENTIAL_ENCRYPTION_KEY,
  },
} as const

function parseTemplates(raw: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>
    }
  } catch {
    // fall through to empty
  }
  return {}
}

export type Config = typeof config