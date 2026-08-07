const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/

export type SemverPart = 'major' | 'minor' | 'patch'

export function nextVersion(
  current: string | null | undefined,
  part: SemverPart = 'patch',
): string {
  // Start at 0.0.1 — 0.x signals pre-1.0 (API may change), which is honest
  // for auto-generated artifacts that evolve as the source updates.
  if (!current) return '0.0.1'

  const match = SEMVER_RE.exec(current.trim())
  if (!match) {
    // Unparseable — start over from 0.0.1
    return '0.0.1'
  }

  let major = Number(match[1])
  let minor = Number(match[2])
  let patch = Number(match[3])

  if (part === 'major') {
    major += 1
    minor = 0
    patch = 0
  } else if (part === 'minor') {
    minor += 1
    patch = 0
  } else {
    patch += 1
  }

  return `${major}.${minor}.${patch}`
}

export function validVersion(value: string): boolean {
  return SEMVER_RE.test(value.trim())
}
