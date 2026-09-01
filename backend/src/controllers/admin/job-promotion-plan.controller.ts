import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { StatusCodes } from 'http-status-codes'
import { AdminAuditAction, AdminAuditTargetType } from '~/constants/enums.js'
import adminAuditLogService from '~/services/admin/audit-log.service.js'
import adminJobPromotionPlanService from '~/services/admin/job-promotion-plan.service.js'

export const getAdminJobPromotionPlansController = async (_req: Request, res: Response) => {
  const plans = await adminJobPromotionPlanService.getPlans()
  return res.status(StatusCodes.OK).json({ status: 'success', data: { plans } })
}

export const createAdminJobPromotionPlanController = async (req: Request, res: Response) => {
  const plan = await adminJobPromotionPlanService.createPlan(req.body)
  await adminAuditLogService.create({
    req, action: AdminAuditAction.JOB_PROMOTION_PLAN_CREATE, targetType: AdminAuditTargetType.JOB_PROMOTION_PLAN,
    targetId: plan._id, statusCode: StatusCodes.CREATED, metadata: { code: plan.code, name: plan.name }
  })
  return res.status(StatusCodes.CREATED).json({ status: 'success', message: 'Tạo gói quảng cáo thành công.', data: { plan } })
}

export const updateAdminJobPromotionPlanController = async (req: Request, res: Response) => {
  const planId = new ObjectId(req.params.planId as string)
  const plan = await adminJobPromotionPlanService.updatePlan(planId, req.body)
  await adminAuditLogService.create({
    req, action: AdminAuditAction.JOB_PROMOTION_PLAN_UPDATE, targetType: AdminAuditTargetType.JOB_PROMOTION_PLAN,
    targetId: planId, statusCode: StatusCodes.OK, metadata: { updated_fields: Object.keys(req.body) }
  })
  return res.status(StatusCodes.OK).json({ status: 'success', message: 'Cập nhật gói quảng cáo thành công.', data: { plan } })
}

export const deleteAdminJobPromotionPlanController = async (req: Request, res: Response) => {
  const planId = new ObjectId(req.params.planId as string)
  const plan = await adminJobPromotionPlanService.deletePlan(planId)
  await adminAuditLogService.create({
    req, action: AdminAuditAction.JOB_PROMOTION_PLAN_DELETE, targetType: AdminAuditTargetType.JOB_PROMOTION_PLAN,
    targetId: planId, statusCode: StatusCodes.OK, metadata: { code: plan.code }
  })
  return res.status(StatusCodes.OK).json({ status: 'success', message: 'Xóa gói quảng cáo thành công.', data: { plan } })
}
