import { ObjectId } from 'mongodb'
import { StatusCodes } from 'http-status-codes'
import databaseService from '~/configs/database.config.js'
import {
  JobModerationStatus,
  JobPromotionSource,
  JobPromotionStatus,
  JobPromotionType,
  JobStatus,
  WalletStatus,
  WalletTransactionDirection,
  WalletTransactionReferenceType,
  WalletTransactionStatus,
  WalletTransactionType
} from '~/constants/enums.js'
import UserMessages from '~/constants/messages/index.js'
import { AppError } from '~/errors/app-error.js'
import JobPromotion from '~/models/schema/client/jobPromotions.schema.js'
import JobPromotionPlan from '~/models/schema/client/jobPromotionPlans.schema.js'
import WalletTransaction from '~/models/schema/client/walletTransactions.schema.js'

type CompanyPromotionListItem = JobPromotion & {
  job: {
    _id: ObjectId
    title: string
    location: string
    job_type: string
    level: string
    status?: JobStatus
    moderation_status?: JobModerationStatus
    published_at?: Date
    expired_at?: Date
  }
}

class CompanyJobPromotionService {
  async getPlans() {
    const plans = await databaseService.jobPromotionPlans.find({ is_active: true }).sort({ sort_order: 1 }).toArray()
    return { plans }
  }

  calculateAmount(plan: JobPromotionPlan, durationDays: number) {
    return durationDays * plan.daily_price
  }

  async purchasePromotion({
    userId,
    companyId,
    jobId,
    planId,
    durationDays
  }: {
    userId: ObjectId
    companyId: ObjectId
    jobId: ObjectId
    planId: ObjectId
    durationDays: number
  }) {
    const plan = await databaseService.jobPromotionPlans.findOne({ _id: planId, is_active: true })
    if (!plan) {
      throw new AppError({ statusCode: StatusCodes.NOT_FOUND, message: 'Không tìm thấy gói quảng cáo đang hoạt động.' })
    }
    if (durationDays < plan.min_duration_days || durationDays > plan.max_duration_days) {
      throw new AppError({
        statusCode: StatusCodes.BAD_REQUEST,
        message: `Thời lượng gói phải từ ${plan.min_duration_days} đến ${plan.max_duration_days} ngày.`
      })
    }
    const startsAt = new Date()
    const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000)
    const amount = this.calculateAmount(plan, durationDays)

    const job = await databaseService.jobs.findOne({
      _id: jobId,
      company_id: companyId
    })

    if (!job) {
      throw new AppError({
        statusCode: StatusCodes.NOT_FOUND,
        message: UserMessages.JOB_NOT_FOUND
      })
    }

    if (
      job.status !== JobStatus.OPEN ||
      job.moderation_status !== JobModerationStatus.ACTIVE ||
      !job.published_at ||
      job.expired_at <= new Date()
    ) {
      throw new AppError({
        statusCode: StatusCodes.BAD_REQUEST,
        message: UserMessages.JOB_PROMOTION_JOB_NOT_ELIGIBLE
      })
    }

    await this.assertNoOverlappingPromotion({
      jobId,
      type: plan.type,
      startsAt,
      endsAt
    })

    try {
      return await databaseService.withTransaction(async (session) => {
        const wallet = await databaseService.wallets.findOne(
          {
            user_id: userId
          },
          { session }
        )

        if (!wallet || wallet.status === WalletStatus.LOCKED) {
          throw new AppError({
            statusCode: StatusCodes.FORBIDDEN,
            message: UserMessages.WALLET_LOCKED
          })
        }

        if (wallet.currency !== plan.currency) {
          throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            message: `Ví ${wallet.currency} không thể thanh toán gói có đơn vị ${plan.currency}.`
          })
        }

        if (wallet.balance < amount) {
          throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            message: UserMessages.WALLET_INSUFFICIENT_BALANCE
          })
        }

        const now = new Date()
        const updatedWallet = await databaseService.wallets.findOneAndUpdate(
          {
            _id: wallet._id,
            status: WalletStatus.ACTIVE,
            balance: { $gte: amount }
          },
          {
            $inc: {
              balance: -amount
            },
            $set: {
              updated_at: now
            }
          },
          {
            returnDocument: 'after',
            session
          }
        )

        if (!updatedWallet) {
          throw new AppError({
            statusCode: StatusCodes.BAD_REQUEST,
            message: UserMessages.WALLET_INSUFFICIENT_BALANCE
          })
        }

        const promotion = new JobPromotion({
          job_id: jobId,
          company_id: companyId,
          plan_id: plan._id,
          plan_snapshot: this.getPlanSnapshot(plan),
          source: JobPromotionSource.EMPLOYER_PURCHASE,
          type: plan.type,
          status: JobPromotionStatus.ACTIVE,
          starts_at: startsAt,
          ends_at: endsAt,
          priority: plan.default_priority,
          amount_paid: amount,
          currency: plan.currency,
          created_at: now,
          updated_at: now
        })
        const promotionResult = await databaseService.jobPromotions.insertOne(promotion, { session })

        const transaction = new WalletTransaction({
          wallet_id: updatedWallet._id!,
          user_id: userId,
          type: WalletTransactionType.PROMOTION_PURCHASE,
          direction: WalletTransactionDirection.DEBIT,
          amount,
          currency: updatedWallet.currency,
          balance_before: updatedWallet.balance + amount,
          balance_after: updatedWallet.balance,
          status: WalletTransactionStatus.SUCCEEDED,
          reference_type: WalletTransactionReferenceType.JOB_PROMOTION,
          reference_id: promotionResult.insertedId,
          description: `Mua promotion cho job ${job.title}`,
          created_at: now,
          updated_at: now
        })
        const transactionResult = await databaseService.walletTransactions.insertOne(transaction, { session })

        return {
          wallet: updatedWallet,
          promotion: {
            _id: promotionResult.insertedId,
            ...promotion
          },
          transaction: {
            _id: transactionResult.insertedId,
            ...transaction
          }
        }
      })
    } catch (error) {
      if (!this.isTransactionUnsupportedError(error)) {
        throw error
      }

      return this.purchasePromotionWithoutTransaction({
        userId,
        companyId,
        jobId,
        jobTitle: job.title,
        plan,
        startsAt,
        endsAt,
        amount,
      })
    }
  }

  private async purchasePromotionWithoutTransaction({
    userId,
    companyId,
    jobId,
    jobTitle,
    plan,
    startsAt,
    endsAt,
    amount,
  }: {
    userId: ObjectId
    companyId: ObjectId
    jobId: ObjectId
    jobTitle: string
    plan: JobPromotionPlan
    startsAt: Date
    endsAt: Date
    amount: number
  }) {
    const wallet = await databaseService.wallets.findOne({
      user_id: userId
    })

    if (!wallet || wallet.status === WalletStatus.LOCKED) {
      throw new AppError({
        statusCode: StatusCodes.FORBIDDEN,
        message: UserMessages.WALLET_LOCKED
      })
    }

    if (wallet.currency !== plan.currency) {
      throw new AppError({
        statusCode: StatusCodes.BAD_REQUEST,
        message: `Ví ${wallet.currency} không thể thanh toán gói có đơn vị ${plan.currency}.`
      })
    }

    if (wallet.balance < amount) {
      throw new AppError({
        statusCode: StatusCodes.BAD_REQUEST,
        message: UserMessages.WALLET_INSUFFICIENT_BALANCE
      })
    }

    const now = new Date()
    const updatedWallet = await databaseService.wallets.findOneAndUpdate(
      {
        _id: wallet._id,
        status: WalletStatus.ACTIVE,
        balance: { $gte: amount }
      },
      {
        $inc: {
          balance: -amount
        },
        $set: {
          updated_at: now
        }
      },
      {
        returnDocument: 'after'
      }
    )

    if (!updatedWallet) {
      throw new AppError({
        statusCode: StatusCodes.BAD_REQUEST,
        message: UserMessages.WALLET_INSUFFICIENT_BALANCE
      })
    }

    let insertedPromotionId: ObjectId | null = null

    try {
      const promotion = new JobPromotion({
        job_id: jobId,
        company_id: companyId,
        plan_id: plan._id,
        plan_snapshot: this.getPlanSnapshot(plan),
        source: JobPromotionSource.EMPLOYER_PURCHASE,
        type: plan.type,
        status: JobPromotionStatus.ACTIVE,
        starts_at: startsAt,
        ends_at: endsAt,
        priority: plan.default_priority,
        amount_paid: amount,
        currency: plan.currency,
        created_at: now,
        updated_at: now
      })
      const promotionResult = await databaseService.jobPromotions.insertOne(promotion)
      insertedPromotionId = promotionResult.insertedId

      const transaction = new WalletTransaction({
        wallet_id: updatedWallet._id!,
        user_id: userId,
        type: WalletTransactionType.PROMOTION_PURCHASE,
        direction: WalletTransactionDirection.DEBIT,
        amount,
        currency: updatedWallet.currency,
        balance_before: updatedWallet.balance + amount,
        balance_after: updatedWallet.balance,
        status: WalletTransactionStatus.SUCCEEDED,
        reference_type: WalletTransactionReferenceType.JOB_PROMOTION,
        reference_id: promotionResult.insertedId,
        description: `Mua promotion cho job ${jobTitle}`,
        created_at: now,
        updated_at: now
      })
      const transactionResult = await databaseService.walletTransactions.insertOne(transaction)

      return {
        wallet: updatedWallet,
        promotion: {
          _id: promotionResult.insertedId,
          ...promotion
        },
        transaction: {
          _id: transactionResult.insertedId,
          ...transaction
        }
      }
    } catch (error) {
      try {
        if (insertedPromotionId) {
          await databaseService.jobPromotions.deleteOne({ _id: insertedPromotionId })
        }
      } finally {
        await databaseService.wallets.updateOne(
          {
            _id: updatedWallet._id
          },
          {
            $inc: {
              balance: amount
            },
            $set: {
              updated_at: new Date()
            }
          }
        )
      }

      throw error
    }
  }

  async getCompanyPromotions({
    companyId,
    status,
    page,
    limit
  }: {
    companyId: ObjectId
    status?: JobPromotionStatus
    page: number
    limit: number
  }) {
    await this.syncPromotionStatuses(companyId)

    const match: {
      company_id: ObjectId
      status?: JobPromotionStatus
    } = {
      company_id: companyId
    }

    if (status) {
      match.status = status
    }

    const [result] = await databaseService.jobPromotions
      .aggregate<{
        items: CompanyPromotionListItem[]
        total: { count: number }[]
      }>([
        { $match: match },
        {
          $lookup: {
            from: databaseService.jobs.collectionName,
            localField: 'job_id',
            foreignField: '_id',
            as: 'job'
          }
        },
        { $unwind: '$job' },
        {
          $sort: {
            created_at: -1
          }
        },
        {
          $facet: {
            items: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              this.getCompanyPromotionProjection()
            ],
            total: [{ $count: 'count' }]
          }
        }
      ])
      .toArray()

    const total = result?.total[0]?.count || 0

    return {
      promotions: result?.items || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    }
  }

  async getCompanyPromotionDetailOrThrow({ companyId, promotionId }: { companyId: ObjectId; promotionId: ObjectId }) {
    await this.syncPromotionStatuses(companyId)

    const promotion = await databaseService.jobPromotions
      .aggregate<CompanyPromotionListItem>([
        {
          $match: {
            _id: promotionId,
            company_id: companyId
          }
        },
        {
          $lookup: {
            from: databaseService.jobs.collectionName,
            localField: 'job_id',
            foreignField: '_id',
            as: 'job'
          }
        },
        { $unwind: '$job' },
        this.getCompanyPromotionProjection()
      ])
      .next()

    if (!promotion) {
      throw new AppError({
        statusCode: StatusCodes.NOT_FOUND,
        message: UserMessages.JOB_PROMOTION_NOT_FOUND
      })
    }

    return promotion
  }

  async cancelPromotion({ companyId, promotionId }: { companyId: ObjectId; promotionId: ObjectId }) {
    await this.syncPromotionStatuses(companyId)

    const promotion = await databaseService.jobPromotions.findOne({
      _id: promotionId,
      company_id: companyId
    })

    if (!promotion) {
      throw new AppError({
        statusCode: StatusCodes.NOT_FOUND,
        message: UserMessages.JOB_PROMOTION_NOT_FOUND
      })
    }

    if (![JobPromotionStatus.ACTIVE, JobPromotionStatus.SCHEDULED].includes(promotion.status)) {
      throw new AppError({
        statusCode: StatusCodes.BAD_REQUEST,
        message: UserMessages.JOB_PROMOTION_CANCEL_NOT_ALLOWED
      })
    }

    await databaseService.jobPromotions.updateOne(
      {
        _id: promotionId
      },
      {
        $set: {
          status: JobPromotionStatus.CANCELLED,
          updated_at: new Date()
        }
      }
    )

    return this.getCompanyPromotionDetailOrThrow({ companyId, promotionId })
  }

  private async assertNoOverlappingPromotion({
    jobId,
    type,
    startsAt,
    endsAt
  }: {
    jobId: ObjectId
    type: JobPromotionType
    startsAt: Date
    endsAt: Date
  }) {
    const duplicated = await databaseService.jobPromotions.findOne({
      job_id: jobId,
      type,
      status: { $in: [JobPromotionStatus.ACTIVE, JobPromotionStatus.SCHEDULED] },
      starts_at: { $lt: endsAt },
      ends_at: { $gt: startsAt }
    })

    if (duplicated) {
      throw new AppError({
        statusCode: StatusCodes.CONFLICT,
        message: UserMessages.JOB_PROMOTION_DUPLICATED
      })
    }
  }

  async syncPromotionStatuses(companyId?: ObjectId) {
    const now = new Date()
    const filter = {
      status: { $in: [JobPromotionStatus.ACTIVE, JobPromotionStatus.SCHEDULED] },
      ends_at: { $lte: now },
      ...(companyId ? { company_id: companyId } : {})
    }

    await databaseService.jobPromotions.updateMany(filter, {
      $set: {
        status: JobPromotionStatus.EXPIRED,
        updated_at: now
      }
    })

    await databaseService.jobPromotions.updateMany(
      {
        status: JobPromotionStatus.SCHEDULED,
        starts_at: { $lte: now },
        ends_at: { $gt: now },
        ...(companyId ? { company_id: companyId } : {})
      },
      { $set: { status: JobPromotionStatus.ACTIVE, updated_at: now } }
    )
  }

  private getPlanSnapshot(plan: JobPromotionPlan) {
    return {
      code: plan.code,
      name: plan.name,
      type: plan.type,
      daily_price: plan.daily_price,
      currency: plan.currency,
      min_duration_days: plan.min_duration_days,
      max_duration_days: plan.max_duration_days,
      default_priority: plan.default_priority
    }
  }

  private getCompanyPromotionProjection() {
    return {
      $project: {
        _id: 1,
        job_id: 1,
        company_id: 1,
        plan_id: 1,
        plan_snapshot: 1,
        source: 1,
        type: 1,
        status: 1,
        starts_at: 1,
        ends_at: 1,
        priority: 1,
        amount_paid: 1,
        currency: 1,
        created_at: 1,
        updated_at: 1,
        job: {
          _id: '$job._id',
          title: '$job.title',
          location: '$job.location',
          job_type: '$job.job_type',
          level: '$job.level',
          status: '$job.status',
          moderation_status: '$job.moderation_status',
          published_at: '$job.published_at',
          expired_at: '$job.expired_at'
        }
      }
    }
  }

  private isTransactionUnsupportedError(error: unknown) {
    if (!(error instanceof Error)) {
      return false
    }

    const message = error.message.toLowerCase()

    return (
      message.includes('transaction numbers are only allowed on a replica set member or mongos') ||
      message.includes('transactions are not supported')
    )
  }
}

const companyJobPromotionService = new CompanyJobPromotionService()

export default companyJobPromotionService
