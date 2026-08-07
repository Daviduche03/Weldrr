import type { NextFunction, Request, Response } from 'express'
import { AppError } from '@/middleware/errorHandler'

type RateLimitOptions = {
  name: string
  windowMs: number
  max: number
}

const hits = new Map<string, number[]>()

export function rateLimit({ name, windowMs, max }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${name}:${req.ip ?? 'unknown'}:${req.headers['user-agent'] ?? ''}`
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

    if (recent.length >= max) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      next(new AppError(429, 'Too many requests — please try again later'))
      return
    }

    recent.push(now)
    hits.set(key, recent)
    next()
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, times] of hits) {
    if (times.every((t) => now - t >= 60_000)) {
      hits.delete(key)
    }
  }
}, 60_000).unref()