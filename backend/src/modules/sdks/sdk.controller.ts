import type { Response, NextFunction } from 'express'
import { sdkService } from '@/modules/sdks/sdk.service'
import {
  createSdkSchema,
  updateSdkSchema,
  sdkQuerySchema,
} from '@/modules/sdks/sdk.schema'
import type { AuthRequest } from '@/modules/auth/auth.types'

export const sdkController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = sdkQuerySchema.parse(req.query)
      const { data, meta } = await sdkService.list(req.user!.sub, query)
      res.json({ status: 'success', data, meta })
    } catch (err) {
      next(err)
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const sdk = await sdkService.getById(req.user!.sub, id)
      res.json({ status: 'success', data: sdk })
    } catch (err) {
      next(err)
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = createSdkSchema.parse(req.body)
      const sdk = await sdkService.create(req.user!.sub, data)
      res.status(201).json({ status: 'success', data: sdk })
    } catch (err) {
      next(err)
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      const data = updateSdkSchema.parse(req.body)
      const sdk = await sdkService.update(req.user!.sub, id, data)
      res.json({ status: 'success', data: sdk })
    } catch (err) {
      next(err)
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string
      await sdkService.delete(req.user!.sub, id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
}
