import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appUrl: process.env.PUBLIC_URL ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${Number(process.env.PORT) || 3000}`),
  databaseUrl: process.env.DATABASE_URL ?? './data/weldrr.db',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID ?? '',
  },
  zeptomail: {
    token: process.env.ZEPTOMAIL_TOKEN ?? '',
    from: process.env.ZEPTOMAIL_FROM ?? '',
    fromName: process.env.ZEPTOMAIL_FROM_NAME ?? 'Weldrr',
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET ?? '',
    publicUrl: process.env.R2_PUBLIC_URL ?? '',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
  },
} as const

export type Config = typeof config
