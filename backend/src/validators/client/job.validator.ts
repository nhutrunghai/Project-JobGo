import _ from 'lodash'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { JobLevel, JobStatus, JobType } from '~/constants/enums'
import UserMessages from '~/constants/messages/index'

const jobTypeValues = Object.values(JobType) as [JobType, ...JobType[]]
const jobLevelValues = Object.values(JobLevel) as [JobLevel, ...JobLevel[]]
const salaryCurrencyValues = ['VND', 'USD'] as const
const createStatusValues = [JobStatus.DRAFT, JobStatus.OPEN] as const
const updateStatusValues = [JobStatus.DRAFT, JobStatus.OPEN, JobStatus.PAUSED, JobStatus.CLOSED] as const
const listStatusValues = [
  JobStatus.DRAFT,
  JobStatus.OPEN,
  JobStatus.PAUSED,
  JobStatus.CLOSED,
  JobStatus.EXPIRED
] as const

const titleSchema = z
  .string({ message: UserMessages.JOB_TITLE_NOT_STRING })
  .trim()
  .min(2, { message: UserMessages.JOB_TITLE_MIN_LENGTH })
  .max(200, { message: UserMessages.JOB_TITLE_MAX_LENGTH })
  .transform((value) => _.escape(value))

const descriptionSchema = z
  .string({ message: UserMessages.JOB_DESCRIPTION_NOT_STRING })
  .trim()
  .min(2, { message: UserMessages.JOB_TITLE_MIN_LENGTH })
  .max(5000, { message: UserMessages.JOB_DESCRIPTION_MAX_LENGTH })
  .transform((value) => _.escape(value))

const requirementsSchema = z
  .string({ message: UserMessages.JOB_REQUIREMENTS_NOT_STRING })
  .trim()
  .min(2, { message: UserMessages.JOB_TITLE_MIN_LENGTH })
  .max(5000, { message: UserMessages.JOB_REQUIREMENTS_MAX_LENGTH })
  .transform((value) => _.escape(value))

const benefitsSchema = z
  .string({ message: UserMessages.JOB_BENEFITS_NOT_STRING })
  .trim()
  .min(2, { message: UserMessages.JOB_TITLE_MIN_LENGTH })
  .max(3000, { message: UserMessages.JOB_BENEFITS_MAX_LENGTH })
  .transform((value) => _.escape(value))

const locationSchema = z
  .string({ message: UserMessages.JOB_LOCATION_NOT_STRING })
  .trim()
  .min(2, { message: UserMessages.JOB_LOCATION_MIN_LENGTH })
  .max(100, { message: UserMessages.JOB_LOCATION_MAX_LENGTH })
  .transform((value) => _.escape(value))

const categoryIdsSchema = z
  .array(
    z
      .string({ message: UserMessages.JOB_CATEGORY_ITEM_NOT_STRING })
      .trim()
      .refine((value) => ObjectId.isValid(value), { message: UserMessages.JOB_CATEGORY_ITEM_INVALID }),
    { message: UserMessages.JOB_CATEGORY_NOT_ARRAY }
  )
  .min(1, { message: UserMessages.JOB_CATEGORY_MIN_LENGTH })
  .max(5, { message: UserMessages.JOB_CATEGORY_MAX_LENGTH })
  .transform((values) => [...new Set(values)].map((value) => new ObjectId(value)))

const skillsSchema = z
  .array(
    z
      .string({ message: UserMessages.JOB_SKILL_NOT_STRING })
      .trim()
      .min(1, { message: UserMessages.JOB_SKILL_EMPTY })
      .transform((value) => _.escape(value)),
    { message: UserMessages.SKILLS_NOT_ARRAY }
  )
  .min(1, { message: UserMessages.JOB_SKILLS_MIN_LENGTH })

const salarySchema = z
  .object({
    min: z.coerce.number().min(0, { message: UserMessages.JOB_SALARY_MIN_INVALID }).optional(),
    max: z.coerce.number().min(0, { message: UserMessages.JOB_SALARY_MAX_INVALID }).optional(),
    currency: z.enum(salaryCurrencyValues, { message: UserMessages.JOB_SALARY_CURRENCY_INVALID }),
    is_negotiable: z.boolean({ message: UserMessages.JOB_SALARY_NEGOTIABLE_NOT_BOOLEAN }).optional().default(false)
  })
  .superRefine((data, ctx) => {
    if (!data.is_negotiable && data.min === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: UserMessages.JOB_SALARY_MIN_REQUIRED,
        path: ['min']
      })
    }

    if (!data.is_negotiable && data.max === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: UserMessages.JOB_SALARY_MAX_REQUIRED,
        path: ['max']
      })
    }

    if (data.min !== undefined && data.max !== undefined && data.max < data.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: UserMessages.JOB_SALARY_MAX_LESS_THAN_MIN,
        path: ['max']
      })
    }
  })

const expiredAtSchema = z
  .preprocess(
    (value) => (typeof value === 'string' || value instanceof Date ? new Date(value) : value),
    z.date({ message: UserMessages.JOB_EXPIRED_AT_INVALID })
  )
  .refine((date) => date.getTime() > Date.now(), {
    message: UserMessages.JOB_EXPIRED_AT_IN_FUTURE
  })

const jobTypeSchema = z.enum(jobTypeValues, {
  message: UserMessages.JOB_TYPE_INVALID
})

const jobLevelSchema = z.enum(jobLevelValues, {
  message: UserMessages.JOB_LEVEL_INVALID
})

const createStatusSchema = z.enum(createStatusValues, {
  message: UserMessages.JOB_CREATE_STATUS_INVALID
})

const updateStatusSchema = z.enum(updateStatusValues, {
  message: UserMessages.JOB_UPDATE_STATUS_INVALID
})

const listStatusSchema = z.enum(listStatusValues, {
  message: UserMessages.JOB_UPDATE_STATUS_INVALID
})

const quantitySchema = z.coerce
  .number({ message: UserMessages.JOB_QUANTITY_NOT_NUMBER })
  .int({ message: UserMessages.JOB_QUANTITY_NOT_INTEGER })
  .min(1, { message: UserMessages.JOB_QUANTITY_MIN })

export const createJobValidator = z.object({
  body: z.object({
    title: titleSchema,
    description: descriptionSchema,
    requirements: requirementsSchema,
    benefits: benefitsSchema,
    salary: salarySchema,
    location: locationSchema,
    job_type: jobTypeSchema,
    level: jobLevelSchema,
    status: createStatusSchema.optional(),
    category_ids: categoryIdsSchema,
    skills: skillsSchema,
    quantity: quantitySchema,
    expired_at: expiredAtSchema
  })
})

export const updateJobValidator = z.object({
  body: z
    .object({
      title: titleSchema.optional(),
      description: descriptionSchema.optional(),
      requirements: requirementsSchema.optional(),
      benefits: benefitsSchema.optional(),
      salary: salarySchema.optional(),
      location: locationSchema.optional(),
      job_type: jobTypeSchema.optional(),
      level: jobLevelSchema.optional(),
      category_ids: categoryIdsSchema.optional(),
      skills: skillsSchema.optional(),
      quantity: quantitySchema.optional(),
      expired_at: expiredAtSchema.optional()
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: UserMessages.JOB_NOT_VALUE_UPDATE
    })
})

export const updateJobStatusValidator = z.object({
  body: z.object({
    status: updateStatusSchema
  })
})

export const getCompanyJobsValidator = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    status: listStatusSchema.optional(),
    keyword: z.string().trim().max(100).optional()
  })
})

export const searchPublicJobsValidator = z.object({
  query: z.object({
    q: z.string().trim().min(2).max(200).optional(),
    location: z.string().trim().min(2).max(100).optional(),
    job_type: jobTypeSchema.optional(),
    level: jobLevelSchema.optional(),
    category_id: z.string().trim().regex(/^[a-fA-F0-9]{24}$/).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(20).optional().default(10)
  })
})

export const getLatestPublicJobsValidator = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(8)
  })
})

export const getFeaturedPublicJobsValidator = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(8)
  })
})

export const getCompanyJobDetailValidator = z.object({
  params: z.object({
    jobId: z
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{24}$/, {
        message: UserMessages.JOB_ID_INVALID
      })
  })
})
