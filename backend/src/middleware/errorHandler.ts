import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { logger } from '@/utils/logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
    public issues?: unknown,
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, message)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.issues !== undefined ? { issues: err.issues } : {}),
    })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      issues: err.issues,
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