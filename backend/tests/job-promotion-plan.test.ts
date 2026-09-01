import { ObjectId } from 'mongodb'
import { JobPromotionSource, JobPromotionStatus, JobPromotionType } from '../src/constants/enums/index.js'
import JobPromotionPlan from '../src/models/schema/client/jobPromotionPlans.schema.js'
import JobPromotion from '../src/models/schema/client/jobPromotions.schema.js'

describe('job promotion plan model', () => {
  it('normalizes code and keeps configured commercial values', () => {
    const plan = new JobPromotionPlan({
      code: ' Homepage-Premium ',
      name: ' Gói cao cấp ',
      daily_price: 90000,
      min_duration_days: 3,
      max_duration_days: 30,
      default_priority: 200
    })

    expect(plan.code).toBe('homepage-premium')
    expect(plan.name).toBe('Gói cao cấp')
    expect(plan.daily_price).toBe(90000)
    expect(plan.default_priority).toBe(200)
    expect(plan.is_active).toBe(true)
  })

  it('keeps plan snapshot independent from later plan changes', () => {
    const planId = new ObjectId()
    const snapshot = {
      code: 'homepage-standard',
      name: 'Nổi bật tiêu chuẩn',
      type: JobPromotionType.HOMEPAGE_FEATURED,
      daily_price: 50000,
      currency: 'VND' as const,
      min_duration_days: 1,
      max_duration_days: 30,
      default_priority: 100
    }
    const promotion = new JobPromotion({
      job_id: new ObjectId(),
      company_id: new ObjectId(),
      plan_id: planId,
      plan_snapshot: snapshot,
      source: JobPromotionSource.EMPLOYER_PURCHASE,
      status: JobPromotionStatus.ACTIVE,
      starts_at: new Date('2026-08-05T00:00:00.000Z'),
      ends_at: new Date('2026-08-12T00:00:00.000Z'),
      priority: snapshot.default_priority,
      amount_paid: 350000,
      currency: 'VND'
    })

    expect(promotion.plan_id).toEqual(planId)
    expect(promotion.plan_snapshot?.daily_price).toBe(50000)
    expect(promotion.source).toBe(JobPromotionSource.EMPLOYER_PURCHASE)
    expect(promotion.amount_paid).toBe(350000)
  })
})
