import { Router } from 'express'
import {
  createCompanyController,
  getCompanyMeController,
  updateCompanyLogoController,
  updateCompanyController
} from '~/controllers/client/company.controller'
import {
  updateCompanyApplicationStatusController,
  getCompanyApplicationDetailController,
  getCompanyJobApplicationsController
} from '~/controllers/client/job-application.controller'
import {
  createCompanyJobController,
  getCompanyJobDetailController,
  getCompanyJobsController,
  updateCompanyJobController,
  updateCompanyJobStatusController
} from '~/controllers/client/job.controller'
import {
  cancelCompanyJobPromotionController,
  getCompanyJobPromotionDetailController,
  getCompanyJobPromotionsController,
  getCompanyPromotionPlansController,
  purchaseCompanyJobPromotionController
} from '~/controllers/client/job-promotion.controller'
import { loadCompany, requireCompany, checkCompany } from '~/middlewares/client/company.middleware'
import {
  ensureValidApplicationStatusTransition,
  loadCompanyApplication,
  loadCompanyApplicationDetail,
  requireCompanyApplication,
  requireCompanyApplicationDetail
} from '~/middlewares/client/company-application.middleware'
import { loadCompanyJob, requireCompanyJob } from '~/middlewares/client/job.middleware'
import { isVerifiedCompany } from '~/middlewares/client/verification.middleware'
import { paymentLimiter, writeLimiter } from '~/middlewares/common/rate-limit.middleware'
import validate from '~/middlewares/common/validator.middleware'
import { createCompanyValidator, updateCompanyLogoValidator, updateCompanyValidator } from '~/validators/client/company.validator'
import {
  getCompanyApplicationDetailValidator,
  getCompanyJobApplicationsValidator,
  updateCompanyApplicationStatusValidator
} from '~/validators/client/job-application.validator'
import {
  createJobValidator,
  getCompanyJobDetailValidator,
  getCompanyJobsValidator,
  updateJobValidator,
  updateJobStatusValidator
} from '~/validators/client/job.validator'
import {
  cancelCompanyJobPromotionValidator,
  getCompanyJobPromotionDetailValidator,
  getCompanyJobPromotionsValidator,
  purchaseCompanyJobPromotionValidator
} from '~/validators/client/job-promotion.validator'

const companyRouter = Router()

companyRouter.get('/', (req, res) => {
  res.json({ message: 'Company route' })
})
companyRouter.get('/me', loadCompany, requireCompany, getCompanyMeController)
companyRouter.post('/', writeLimiter, validate(createCompanyValidator), checkCompany, createCompanyController)
companyRouter.patch('/', loadCompany, requireCompany, writeLimiter, validate(updateCompanyValidator), updateCompanyController)
companyRouter.patch('/logo', loadCompany, requireCompany, writeLimiter, validate(updateCompanyLogoValidator), updateCompanyLogoController)
companyRouter.get(
  '/job-promotions/plans',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  getCompanyPromotionPlansController
)
companyRouter.get(
  '/job-promotions',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  validate(getCompanyJobPromotionsValidator),
  getCompanyJobPromotionsController
)
companyRouter.get(
  '/job-promotions/:promotionId',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  validate(getCompanyJobPromotionDetailValidator),
  getCompanyJobPromotionDetailController
)
companyRouter.patch(
  '/job-promotions/:promotionId/cancel',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  paymentLimiter,
  validate(cancelCompanyJobPromotionValidator),
  cancelCompanyJobPromotionController
)
companyRouter.post(
  '/jobs',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  writeLimiter,
  validate(createJobValidator),
  createCompanyJobController
)
companyRouter.get('/jobs', loadCompany, requireCompany, isVerifiedCompany, validate(getCompanyJobsValidator), getCompanyJobsController)
companyRouter.get(
  '/jobs/:jobId',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  validate(getCompanyJobDetailValidator),
  loadCompanyJob,
  requireCompanyJob,
  getCompanyJobDetailController
)
companyRouter.get(
  '/jobs/:jobId/applications',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  validate(getCompanyJobDetailValidator),
  loadCompanyJob,
  requireCompanyJob,
  validate(getCompanyJobApplicationsValidator),
  getCompanyJobApplicationsController
)
companyRouter.get(
  '/applications/:applicationId',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  validate(getCompanyApplicationDetailValidator),
  loadCompanyApplicationDetail,
  requireCompanyApplicationDetail,
  getCompanyApplicationDetailController
)
companyRouter.patch(
  '/applications/:applicationId/status',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  writeLimiter,
  validate(updateCompanyApplicationStatusValidator),
  loadCompanyApplication,
  requireCompanyApplication,
  ensureValidApplicationStatusTransition,
  updateCompanyApplicationStatusController
)
companyRouter.patch(
  '/jobs/:jobId',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  writeLimiter,
  validate(getCompanyJobDetailValidator),
  loadCompanyJob,
  requireCompanyJob,
  validate(updateJobValidator),
  updateCompanyJobController
)
companyRouter.patch(
  '/jobs/:jobId/status',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  writeLimiter,
  validate(getCompanyJobDetailValidator),
  loadCompanyJob,
  requireCompanyJob,
  validate(updateJobStatusValidator),
  updateCompanyJobStatusController
)
companyRouter.post(
  '/jobs/:jobId/promotions/purchase',
  loadCompany,
  requireCompany,
  isVerifiedCompany,
  paymentLimiter,
  validate(purchaseCompanyJobPromotionValidator),
  loadCompanyJob,
  requireCompanyJob,
  purchaseCompanyJobPromotionController
)
export default companyRouter

