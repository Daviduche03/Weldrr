const ACCESS_KEY = 'weldrr_access_token'
const REFRESH_KEY = 'weldrr_refresh_token'

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export function getTokens(): TokenPair | null {
  if (typeof window === 'undefined') return null
  const accessToken = window.localStorage.getItem(ACCESS_KEY)
  const refreshToken = window.localStorage.getItem(REFRESH_KEY)
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export function setTokens(tokens: TokenPair): void {
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
}
