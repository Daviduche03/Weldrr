import { Router } from 'express'
import { asyncHandler } from '@/shared/utils/async-handler'
import { assertPublicHttpUrl } from '@/shared/utils/url-safety'

const router = Router()

const FORWARDED_HEADERS = ['authorization', 'accept', 'content-type', 'x-api-key', 'cookie']
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { url, method = 'GET', headers = {}, body } = req.body ?? {}

    if (typeof url !== 'string' || !url) {
      res.status(400).json({ error: 'Missing "url"' })
      return
    }

    const target = await assertPublicHttpUrl(url)

    const upstreamHeaders = new Headers()
    for (const [name, value] of Object.entries(headers)) {
      if (typeof value === 'string' && FORWARDED_HEADERS.includes(name.toLowerCase())) {
        upstreamHeaders.set(name, value)
      }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30_000)

    try {
      const upstream = await fetch(target, {
        method: String(method).toUpperCase(),
        headers: upstreamHeaders,
        body: body && typeof body === 'string' ? body : undefined,
        signal: controller.signal,
        redirect: 'follow',
      })

      const contentLength = Number(upstream.headers.get('content-length') ?? 0)
      if (contentLength > MAX_RESPONSE_BYTES) {
        res.status(502).json({ error: 'Upstream response too large' })
        return
      }

      const text = await upstream.text()
      if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) {
        res.status(502).json({ error: 'Upstream response too large' })
        return
      }

      const contentType = upstream.headers.get('content-type')
      res.setHeader('Content-Type', contentType ?? 'application/json; charset=utf-8')
      res.status(upstream.status).send(text)
    } catch (err) {
      if (controller.signal.aborted) {
        res.status(504).json({ error: 'Upstream request timed out after 30s' })
        return
      }
      res.status(502).json({ error: err instanceof Error ? err.message : 'Upstream request failed' })
    } finally {
      clearTimeout(timeout)
    }
  }),
)

export { router as proxyRoutes }
