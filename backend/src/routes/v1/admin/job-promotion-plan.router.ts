import { Router } from 'express'
import { UserRole } from '~/constants/enums.js'
import { adminAuthMiddleware } from '~/middlewares/admin/auth.middleware.js'
import { authorizeAdmin } from '~/middlewares/admin/authorization.middleware.js'
import { adminLimiter } from '~/middlewares/common/rate-limit.middleware.js'
import validate from '~/middlewares/common/validator.middleware.js'
import {
  createAdminJobPromotionPlanController,
  deleteAdminJobPromotionPlanController,
  getAdminJobPromotionPlansController,
  updateAdminJobPromotionPlanController
} from '~/controllers/admin/job-promotion-plan.controller.js'
import {
  adminJobPromotionPlanIdValidator,
  createAdminJobPromotionPlanValidator,
  updateAdminJobPromotionPlanValidator
} from '~/validators/admin/job-promotion-plan.validator.js'

const router = Router()
router.use(adminAuthMiddleware, authorizeAdmin([UserRole.ADMIN]))
router.get('/', getAdminJobPromotionPlansController)
router.post('/', adminLimiter, validate(createAdminJobPromotionPlanValidator), createAdminJobPromotionPlanController)
router.patch('/:planId', adminLimiter, validate(updateAdminJobPromotionPlanValidator), updateAdminJobPromotionPlanController)
router.delete('/:planId', adminLimiter, validate(adminJobPromotionPlanIdValidator), deleteAdminJobPromotionPlanController)
export default router
