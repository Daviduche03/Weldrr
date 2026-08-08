import express, { type Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { config } from '@/config'
import { authRoutes } from '@/modules/auth/auth.routes'
import { workspaceRoutes } from '@/modules/workspace/workspace.routes'
import { projectRoutes } from '@/modules/projects/projects.routes'
import { apiKeyRoutes } from '@/modules/api-keys/api-keys.routes'
import { activityRoutes } from '@/modules/activity/activity.routes'
import { dashboardRoutes } from '@/modules/dashboard/dashboard.routes'
import { sdkRoutes } from '@/modules/sdks/sdk.routes'
import { uploadRoutes } from '@/modules/upload/upload.routes'
import { sandboxRoutes } from '@/modules/sandboxes/sandboxes.routes'
import { githubRoutes } from '@/modules/github/github.routes'
import { docsRoutes } from '@/modules/docs/docs.routes'
import { connectionRoutes } from '@/modules/connections/connections.routes'
import { publishingRoutes } from '@/modules/publishing/publishing.routes'
import { proxyRoutes } from '@/modules/proxy/proxy.routes'
import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import { rateLimit } from '@/middleware/rateLimit'
import { requestLogger } from '@/middleware/requestLogger'

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Weldrr API',
      version: '1.0.0',
      description: 'API documentation for Weldrr backend',
    },
    servers: [{ url: config.appUrl }],
  },
  apis: ['./src/modules/**/*.docs.ts'],
})

export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(requestLogger)

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() })
  })

  const apiLimiter = rateLimit({ name: 'api', windowMs: 60_000, max: 600 })
  const authLimiter = rateLimit({ name: 'auth', windowMs: 15 * 60_000, max: 60 })

  app.use('/api', apiLimiter)
  app.use('/api/auth', authLimiter)

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.use('/api/auth', authRoutes)
  app.use('/api/workspace', workspaceRoutes)
  app.use('/api/projects', projectRoutes, sdkRoutes)
  app.use('/api/api-keys', apiKeyRoutes)
  app.use('/api/activity', activityRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/uploads', uploadRoutes)
  app.use('/api/sandboxes', sandboxRoutes)
  app.use('/api/github', githubRoutes)
  app.use('/api/projects', docsRoutes)
  app.use('/api/connections', connectionRoutes)
  app.use('/api/projects', publishingRoutes)
  app.use('/api/proxy', proxyRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}