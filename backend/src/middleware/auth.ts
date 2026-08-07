import type { NextFunction, Request, Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { config } from '@/config'
import { AppError } from '@/middleware/errorHandler'
import type { TokenPayload } from '@/modules/auth/auth.types'

function extractPayload(token: string): TokenPayload {
  const payload = jwt.verify(token, config.jwt.secret) as JwtPayload
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new AppError(401, 'Invalid token payload')
  }
  return { sub: payload.sub, email: payload.email }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid authorization header')
  }

  try {
    ;(req as Request & { user: TokenPayload }).user = extractPayload(header.slice(7))
    next()
  } catch {
    throw new AppError(401, 'Invalid or expired token')
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      ;(req as Request & { user: TokenPayload }).user = extractPayload(header.slice(7))
    } catch {
      // Invalid token — continue as anonymous.
    }
  }
  next()
}