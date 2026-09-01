import { ObjectId } from 'mongodb'
import { JobPromotionSource, JobPromotionStatus, JobPromotionType } from '~/constants/enums.js'

export type JobPromotionPlanSnapshot = {
  code: string
  name: string
  type: JobPromotionType
  daily_price: number
  currency: 'VND' | 'USD'
  min_duration_days: number
  max_duration_days: number
  default_priority: number
}

interface JobPromotionTypeSchema {
  _id?: ObjectId
  job_id: ObjectId
  company_id: ObjectId
  plan_id?: ObjectId
  plan_snapshot?: JobPromotionPlanSnapshot
  source?: JobPromotionSource
  type?: JobPromotionType
  status?: JobPromotionStatus
  starts_at: Date
  ends_at: Date
  priority?: number
  amount_paid?: number
  currency?: 'VND' | 'USD'
  created_at?: Date
  updated_at?: Date
}

export default class JobPromotion {
  _id?: ObjectId
  job_id: ObjectId
  company_id: ObjectId
  plan_id?: ObjectId
  plan_snapshot?: JobPromotionPlanSnapshot
  source: JobPromotionSource
  type: JobPromotionType
  status: JobPromotionStatus
  starts_at: Date
  ends_at: Date
  priority: number
  amount_paid: number
  currency: 'VND' | 'USD'
  created_at: Date
  updated_at: Date

  constructor(promotion: JobPromotionTypeSchema) {
    const date = new Date()

    this._id = promotion._id
    this.job_id = promotion.job_id
    this.company_id = promotion.company_id
    this.plan_id = promotion.plan_id
    this.plan_snapshot = promotion.plan_snapshot
    this.source = promotion.source || JobPromotionSource.ADMIN_GRANT
    this.type = promotion.type || JobPromotionType.HOMEPAGE_FEATURED
    this.status = promotion.status || JobPromotionStatus.ACTIVE
    this.starts_at = promotion.starts_at
    this.ends_at = promotion.ends_at
    this.priority = promotion.priority || 0
    this.amount_paid = promotion.amount_paid || 0
    this.currency = promotion.currency || 'VND'
    this.created_at = promotion.created_at || date
    this.updated_at = promotion.updated_at || date
  }
}
