import type { Response, NextFunction } from 'express'
import multer from 'multer'
import { AppError } from '@/middleware/errorHandler'
import { ALLOWED_UPLOAD_MIME_TYPES, uploadToR2, generateObjectKey } from '@/services/r2'
import type { AuthRequest } from '@/modules/auth/auth.types'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError(400, 'Only images (JPEG, PNG, WebP, GIF) and PDF files are allowed'))
    }
  },
})

export const uploadController = {
  async uploadFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded')
      }

      const key = generateObjectKey(req.file.mimetype)
      const url = await uploadToR2({
        body: req.file.buffer,
        contentType: req.file.mimetype,
        key,
      })

      res.status(201).json({
        status: 'success',
        data: {
          url,
          key,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      })
    } catch (err) {
      next(err)
    }
  },
}
