import { isIP } from 'node:net'
import { lookup } from 'node:dns/promises'
import { AppError } from '@/middleware/errorHandler'

/**
 * Blocks fetches to private/loopback/link-local/reserved addresses to prevent
 * SSRF (e.g. a user-provided specUrl pointing at internal services or
 * cloud metadata endpoints).
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new AppError(400, 'Invalid URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError(400, 'URL must use http or https')
  }

  const hostname = url.hostname
  if (isIP(hostname) === 4 || isIP(hostname) === 6) {
    if (isPrivateAddress(hostname)) {
      throw new AppError(400, 'URL targets a private address')
    }
    return url
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new AppError(400, 'URL host could not be resolved')
  }

  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new AppError(400, 'URL targets a private address')
  }

  return url
}

function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip)
  if (v === 4) return isPrivateIPv4(ip)
  if (v === 6) return isPrivateIPv6(ip)
  return true
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return true
  const [a, b] = parts
  if (a === 0) return true
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 255) return true
  return false
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::' || lower === '::1') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // fc00::/7
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true // fe80::/10
  if (lower.startsWith('::ffff:7f00:') || lower.startsWith('::ffff:0:7f00:')) return true // mapped 127.0.0.0/8
  if (lower.startsWith('::ffff:0a') || lower.startsWith('::ffff:0:0a')) return true // mapped 10/8
  if (lower.startsWith('::ffff:ac1')) return true // mapped 172.16/12 (approx)
  if (lower.startsWith('::ffff:c0a8')) return true // mapped 192.168/16
  if (lower.startsWith('::ffff:a9fe')) return true // mapped 169.254/16
  return false
}
