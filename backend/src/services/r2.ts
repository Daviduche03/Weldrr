import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'node:crypto'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import { logger } from '@/utils/logger'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
})

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

export function isR2Configured(): boolean {
  return Boolean(
    config.r2.accountId &&
      config.r2.accessKeyId &&
      config.r2.secretAccessKey &&
      config.r2.bucket &&
      config.r2.publicUrl,
  )
}

export function extensionForMimeType(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
  }
  return map[mimeType] ?? 'bin'
}

export async function uploadToR2(params: {
  body: Buffer
  contentType: string
  key: string
}): Promise<string> {
  if (!isR2Configured()) {
    throw new AppError(500, 'R2 storage is not configured')
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.r2.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    )
  } catch (err) {
    logger.error({ err, key: params.key }, 'R2 upload failed')
    throw new AppError(500, 'Failed to upload file')
  }

  return `${config.r2.publicUrl}/${params.key}`
}

export function generateObjectKey(mimeType: string, prefix = 'uploads'): string {
  const id = crypto.randomUUID()
  const ext = extensionForMimeType(mimeType)
  return `${prefix}/${id}.${ext}`
}
