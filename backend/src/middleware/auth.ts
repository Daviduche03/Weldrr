import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import type { TokenPayload, AuthRequest } from '@/modules/auth/auth.types'

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid authorization header')
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, config.jwt.secret) as unknown as TokenPayload
    req.user = payload
    next()
  } catch {
    throw new AppError(401, 'Invalid or expired token')
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, config.jwt.secret) as unknown as TokenPayload
    req.user = payload
  } catch {
    // token invalid, continue without user
  }
  next()
}
