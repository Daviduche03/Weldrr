import type { Request, Response, NextFunction } from 'express'

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>

export type ControllerMethod = (req: Request, res: Response, next: NextFunction) => Promise<void>

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
