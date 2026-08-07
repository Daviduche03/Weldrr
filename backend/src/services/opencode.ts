import { AppError } from '@/middleware/errorHandler'
import { logger } from '@/utils/logger'

const OPENCODE_USERNAME = 'opencode'

function basicAuth(password: string): string {
  return `Basic ${Buffer.from(`${OPENCODE_USERNAME}:${password}`).toString('base64')}`
}

async function opencodeRequest(
  tunnelUrl: string,
  password: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = tunnelUrl.replace(/\/+$/, '') + path
  const res = await fetch(url, {
    ...init,
    headers: {
      authorization: basicAuth(password),
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    throw new AppError(
      502,
      `opencode server returned HTTP ${res.status} for ${path}`,
    )
  }
  return res
}

export async function opencodeHealth(
  tunnelUrl: string,
  password: string,
): Promise<{ healthy: boolean; version?: string }> {
  const res = await opencodeRequest(tunnelUrl, password, '/global/health')
  return res.json() as Promise<{ healthy: boolean; version?: string }>
}

export async function opencodeCreateSession(
  tunnelUrl: string,
  password: string,
  title: string,
): Promise<string> {
  const res = await opencodeRequest(tunnelUrl, password, '/session', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
  const session = (await res.json()) as { id?: string }
  const id = session?.id
  if (!id) throw new AppError(502, 'opencode did not return a session id')
  return id
}

export async function opencodeSendPrompt(
  tunnelUrl: string,
  password: string,
  sessionId: string,
  prompt: string,
  system?: string,
): Promise<void> {
  const res = await opencodeRequest(tunnelUrl, password, `/session/${sessionId}/prompt_async`, {
    method: 'POST',
    body: JSON.stringify({
      ...(system ? { system } : {}),
      parts: [{ type: 'text', text: prompt }],
    }),
  })
  if (res.status !== 204 && res.status !== 200) {
    logger.warn({ sessionId, status: res.status }, 'Non-2xx response from opencode prompt_async')
  }
}
