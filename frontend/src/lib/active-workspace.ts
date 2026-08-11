const KEY = 'weldrr:active-workspace'

export function getActiveWorkspaceId(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setActiveWorkspaceId(id: string): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // ignore storage errors
  }
}

export function clearActiveWorkspaceId(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore storage errors
  }
}
