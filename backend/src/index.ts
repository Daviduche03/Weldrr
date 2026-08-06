import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { config } from '@/config'
import { authRoutes } from '@/modules/auth/auth.routes'
import { uploadRoutes } from '@/modules/upload/upload.routes'
import { sdkRoutes } from '@/modules/sdks/sdk.routes'
import { seedAll } from '@/db/seed'
import { errorHandler } from '@/middleware/errorHandler'
import { notFound } from '@/middleware/notFound'
import { logger } from '@/utils/logger'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

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

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use('/api/auth', authRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/sdks', sdkRoutes)

seedAll().catch((err) => logger.error({ err }, 'Failed to seed data'))

app.use(notFound)
app.use(errorHandler)

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`)
})

export default app
