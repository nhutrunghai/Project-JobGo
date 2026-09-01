import { Router } from 'express'
import { UserRole } from '~/constants/enums.js'
import {
  createAdminJobCategoryController,
  getAdminJobCategoriesController,
  toggleAdminJobCategoryController,
  updateAdminJobCategoryController
} from '~/controllers/admin/job-category.controller.js'
import { adminAuthMiddleware } from '~/middlewares/admin/auth.middleware.js'
import { authorizeAdmin } from '~/middlewares/admin/authorization.middleware.js'

const adminJobCategoryRouter = Router()

adminJobCategoryRouter.get('/', adminAuthMiddleware, authorizeAdmin([UserRole.ADMIN]), getAdminJobCategoriesController)
adminJobCategoryRouter.post('/', adminAuthMiddleware, authorizeAdmin([UserRole.ADMIN]), createAdminJobCategoryController)
adminJobCategoryRouter.patch('/:categoryId', adminAuthMiddleware, authorizeAdmin([UserRole.ADMIN]), updateAdminJobCategoryController)
adminJobCategoryRouter.patch('/:categoryId/status', adminAuthMiddleware, authorizeAdmin([UserRole.ADMIN]), toggleAdminJobCategoryController)

export default adminJobCategoryRouter
