import express from 'express'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import env from './configs/env.config.js'
import databaseService from './configs/database.config.js'
import { ensurePublicJobsSearchIndex, ensureResumeChunksSearchIndex } from './configs/search.config.js'
import BASE_PATH from './constants/api-path.js'
import globalErrorHandle from './middlewares/common/error-handler.middleware.js'
import v1Router from './routes/v1/index.js'
import cors from 'cors'
import corsOptions from '~/configs/cors.config.js'
import morgan from 'morgan'
import uploadThingProvider from '~/providers/uploadthing.provider.js'
import adminJobPromotionPlanService from '~/services/admin/job-promotion-plan.service.js'
import { startPromotionStatusWorker } from '~/services/jobs/promotion-status.worker.js'
export const createApp = async () => {
  await databaseService.connect()
  await adminJobPromotionPlanService.ensureDefaultPlans()
  startPromotionStatusWorker()
  await ensurePublicJobsSearchIndex()
  await ensureResumeChunksSearchIndex()
  const app = express()
  app.set('trust proxy', true)
  const isDev = env.BUILD_MODE === 'dev'
  if (isDev) {
    app.use(morgan('dev'))
  }
  app.disable('etag')
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    next()
  })
  app.use(cors(corsOptions))
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use('/api/uploadthing', uploadThingProvider.createExpressHandler())
  app.get('/', (req, res) => {
    res.send('Hello World')
  })
  app.use(BASE_PATH, v1Router)
  app.use(BASE_PATH, (req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'Không tìm thấy tài nguyên yêu cầu.'
    })
  })
  app.use(globalErrorHandle)
  return app
}
