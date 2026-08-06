import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { logger } from '@/utils/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    })
    return
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large — maximum size is 5MB'
        : `Upload error: ${err.code}`
    res.status(400).json({ status: 'error', message })
    return
  }

  logger.error({ err }, 'Unhandled error')
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  })
}
