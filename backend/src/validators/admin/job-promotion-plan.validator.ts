import { z } from 'zod'
import { JobPromotionType } from '~/constants/enums.js'

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/)
const planFields = {
  code: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().default(''),
  type: z.enum([JobPromotionType.HOMEPAGE_FEATURED]).optional().default(JobPromotionType.HOMEPAGE_FEATURED),
  daily_price: z.coerce.number().int().min(0).max(100000000),
  currency: z.enum(['VND', 'USD']).optional().default('VND'),
  min_duration_days: z.coerce.number().int().min(1).max(365),
  max_duration_days: z.coerce.number().int().min(1).max(365),
  default_priority: z.coerce.number().int().min(0).max(100000),
  is_active: z.boolean().optional().default(true),
  sort_order: z.coerce.number().int().min(0).max(100000).optional().default(0)
}

const validateDuration = (body: { min_duration_days?: number; max_duration_days?: number }, ctx: z.RefinementCtx) => {
  if (body.min_duration_days !== undefined && body.max_duration_days !== undefined && body.min_duration_days > body.max_duration_days) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['max_duration_days'], message: 'Số ngày tối đa phải lớn hơn hoặc bằng số ngày tối thiểu.' })
  }
}

export const createAdminJobPromotionPlanValidator = z.object({ body: z.object(planFields).superRefine(validateDuration) })
export const updateAdminJobPromotionPlanValidator = z.object({
  params: z.object({ planId: objectId }),
  body: z.object({
    code: planFields.code.optional(), name: planFields.name.optional(), description: z.string().trim().max(500).optional(),
    type: planFields.type.optional(), daily_price: planFields.daily_price.optional(), currency: planFields.currency.optional(),
    min_duration_days: planFields.min_duration_days.optional(), max_duration_days: planFields.max_duration_days.optional(),
    default_priority: planFields.default_priority.optional(), is_active: z.boolean().optional(), sort_order: planFields.sort_order.optional()
  }).refine((body) => Object.keys(body).length > 0, { message: 'Cần có ít nhất một trường để cập nhật.' }).superRefine(validateDuration)
})
export const adminJobPromotionPlanIdValidator = z.object({ params: z.object({ planId: objectId }) })
