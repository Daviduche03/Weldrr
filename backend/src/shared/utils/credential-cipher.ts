import crypto from 'node:crypto'
import { config } from '@/config'

const PREFIX = 'v1'

function encryptionKey(): Buffer {
  const secret = config.sandbox.credentialEncryptionKey || config.jwt.secret
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a secret at rest with AES-256-GCM.
 * Format: `v1:<iv>:<authTag>:<ciphertext>` (all base64).
 */
export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [
    PREFIX,
    iv.toString('base64'),
    authTag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':')
}

/**
 * Decrypts a secret produced by {@link encryptSecret}. Values that do not
 * carry the `v1:` prefix (e.g. legacy plaintext rows) are returned unchanged.
 */
export function decryptSecret(value: string): string {
  if (!value.startsWith(`${PREFIX}:`)) return value
  const [, ivB64, tagB64, dataB64] = value.split(':')
  if (!ivB64 || !tagB64 || !dataB64) return value

  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      encryptionKey(),
      Buffer.from(ivB64, 'base64'),
    )
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return value
  }
}
