import { config } from '@/config'
import { logger } from '@/utils/logger'

const ZEPTOMAIL_API = 'https://api.zeptomail.com/v1.1/email'

export interface ZeptoMailSendParams {
  to: string
  toName?: string
  templateKey: string
  mergeInfo?: Record<string, string>
  bcc?: { emailAddress: string }[]
}

export class ZeptoMailError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: unknown,
  ) {
    super(message)
    Object.setPrototypeOf(this, ZeptoMailError.prototype)
  }
}

export async function sendTemplateEmail({
  to,
  toName,
  templateKey,
  mergeInfo,
  bcc,
}: ZeptoMailSendParams): Promise<void> {
  if (!config.zeptomail.token || !config.zeptomail.from) {
    logger.warn(
      { to, templateKey },
      'ZeptoMail not configured — skipping email send (set ZEPTOMAIL_TOKEN and ZEPTOMAIL_FROM)',
    )
    return
  }

  const payload = {
    mail_from: {
      address: config.zeptomail.from,
      name: config.zeptomail.fromName,
    },
    recipient: {
      address: to,
      ...(toName ? { name: toName } : {}),
    },
    template_key: templateKey,
    ...(mergeInfo ? { merge_info: mergeInfo } : {}),
    ...(bcc && bcc.length > 0 ? { bcc } : {}),
  }

  const response = await fetch(`${ZEPTOMAIL_API}/template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Zoho-enczapikey ${config.zeptomail.token}`,
    },
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    logger.error({ to, templateKey, status: response.status, body }, 'ZeptoMail send failed')
    throw new ZeptoMailError(
      `ZeptoMail send failed (${response.status})`,
      response.status,
      body,
    )
  }

  logger.info({ to, templateKey }, 'Email sent')
}

export { emailTemplates } from '@/services/email-templates'
