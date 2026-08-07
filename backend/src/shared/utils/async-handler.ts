import type { NextFunction, Request, RequestHandler, Response } from 'express'

type AsyncRoute<Req extends Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<unknown>

export function asyncHandler<Req extends Request = Request>(fn: AsyncRoute<Req>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next)
  }
}