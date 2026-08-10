import type { Request, Response } from 'express'
import { webhookService } from '@/modules/webhooks/webhooks.service'
import { logger } from '@/utils/logger'

export const webhookController = {
  async github(req: Request, res: Response) {
    const raw = (req as Request & { rawBody?: string }).rawBody
    const body = raw ?? JSON.stringify(req.body)
    const signature = req.headers['x-hub-signature-256'] as string | undefined

    try {
      const result = await webhookService.handlePush(body, signature)
      res.json({ status: 'success', regenerated: result.regenerated })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Webhook failed'
      const status = /signature/i.test(msg) ? 401 : 400
      logger.warn({ err: msg }, 'Webhook handling failed')
      res.status(status).json({ status: 'error', message: msg })
    }
  },
}