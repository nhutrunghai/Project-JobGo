import { ObjectId } from 'mongodb'
import { JobPromotionType } from '~/constants/enums.js'

export type JobPromotionPlanInput = {
  _id?: ObjectId
  code: string
  name: string
  description?: string
  type?: JobPromotionType
  daily_price: number
  currency?: 'VND' | 'USD'
  min_duration_days?: number
  max_duration_days?: number
  default_priority?: number
  is_active?: boolean
  sort_order?: number
  created_at?: Date
  updated_at?: Date
}

export default class JobPromotionPlan {
  _id?: ObjectId
  code: string
  name: string
  description: string
  type: JobPromotionType
  daily_price: number
  currency: 'VND' | 'USD'
  min_duration_days: number
  max_duration_days: number
  default_priority: number
  is_active: boolean
  sort_order: number
  created_at: Date
  updated_at: Date

  constructor(plan: JobPromotionPlanInput) {
    const now = new Date()
    this._id = plan._id
    this.code = plan.code.trim().toLowerCase()
    this.name = plan.name.trim()
    this.description = plan.description?.trim() || ''
    this.type = plan.type || JobPromotionType.HOMEPAGE_FEATURED
    this.daily_price = plan.daily_price
    this.currency = plan.currency || 'VND'
    this.min_duration_days = plan.min_duration_days || 1
    this.max_duration_days = plan.max_duration_days || 30
    this.default_priority = plan.default_priority || 0
    this.is_active = plan.is_active ?? true
    this.sort_order = plan.sort_order || 0
    this.created_at = plan.created_at || now
    this.updated_at = plan.updated_at || now
  }
}
