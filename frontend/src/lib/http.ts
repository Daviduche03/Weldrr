import { clearTokens, getTokens, setTokens } from '@/lib/tokens'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  status: number
  issues?: unknown

  constructor(message: string, status: number, issues?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.issues = issues
  }
}

type Query = Record<string, string | number | boolean | undefined>

export type HttpOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  query?: Query
}

function formatIssues(issues: unknown): string | null {
  if (!Array.isArray(issues)) return null
  const first = issues[0] as { message?: string } | undefined
  return typeof first?.message === 'string' ? first.message : null
}

async function request<T>(path: string, options: HttpOptions, retried = false): Promise<T> {
  const { method = 'GET', body, auth = true, query } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const tokens = getTokens()
    if (tokens) headers['Authorization'] = `Bearer ${tokens.accessToken}`
  }

  const url = new URL(API_BASE_URL + path)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && !retried) {
    const refreshed = await refreshSession()
    if (refreshed) return request<T>(path, options, true)
    clearTokens()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  const text = await res.text()
  let json: Record<string, unknown> | null = null
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>
    } catch {
      json = null
    }
  }

  if (!res.ok) {
    const issues = json?.issues
    const message =
      (typeof json?.message === 'string' && json.message) ||
      formatIssues(issues) ||
      `Request failed with status ${res.status}`
    throw new ApiError(message, res.status, issues)
  }

  if (json && json.status === 'success') return json.data as T
  return json as T
}

async function refreshSession(): Promise<boolean> {
  const tokens = getTokens()
  if (!tokens) return false
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    })
    if (!res.ok) return false
    const json = (await res.json()) as { data: { accessToken: string; refreshToken: string } }
    setTokens(json.data)
    return true
  } catch {
    return false
  }
}

function get<T>(path: string, options?: Omit<HttpOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' })
}

function post<T>(path: string, body?: unknown, options?: Omit<HttpOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', body })
}

function patch<T>(path: string, body?: unknown, options?: Omit<HttpOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'PATCH', body })
}

function remove<T>(path: string, options?: Omit<HttpOptions, 'method' | 'body'>): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' })
}

export const http = { get, post, patch, remove, url: API_BASE_URL }