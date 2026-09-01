import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import sanitizeHtml from 'sanitize-html'
import { JobModerationStatus, JobStatus } from '~/constants/enums'
import UserMessages from '~/constants/messages/index'
import { CompanyLocals, JobLocals } from '~/types/http/response.type'
import Job from '~/models/schema/client/jobs.schema'
import jobsService from '~/services/client/job.service'

const sanitizeRichJobContent = (value: string) => sanitizeHtml(value, {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote'],
  allowedAttributes: {}
})

export const createCompanyJobController = async (
  req: Request<ParamsDictionary, unknown, Job>,
  res: Response<unknown, CompanyLocals>
) => {
  const company = res.locals.company

  const newJob = new Job({
    company_id: company?._id as ObjectId,
    title: req.body.title,
    description: sanitizeRichJobContent(req.body.description),
    requirements: sanitizeRichJobContent(req.body.requirements),
    benefits: sanitizeRichJobContent(req.body.benefits),
    salary: req.body.salary,
    location: req.body.location,
    job_type: req.body.job_type,
    level: req.body.level,
    status: req.body.status,
    category_ids: req.body.category_ids,
    skills: req.body.skills,
    quantity: req.body.quantity,
    expired_at: req.body.expired_at,
    moderation_status: JobModerationStatus.ACTIVE,
    published_at: req.body.status === JobStatus.OPEN ? new Date() : undefined
  })

  const result = await jobsService.createJob(newJob)

  return res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: UserMessages.JOB_CREATED_SUCCESS,
    data: {
      _id: result.insertedId,
      title: newJob.title,
      description: newJob.description,
      requirements: newJob.requirements,
      benefits: newJob.benefits,
      salary: newJob.salary,
      location: newJob.location,
      job_type: newJob.job_type,
      level: newJob.level,
      status: newJob.status,
      moderation_status: newJob.moderation_status,
      category_ids: newJob.category_ids,
      skills: newJob.skills,
      quantity: newJob.quantity,
      expired_at: newJob.expired_at,
      published_at: newJob.published_at,
      created_at: newJob.created_at,
      updated_at: newJob.updated_at
    }
  })
}

export const getCompanyJobsController = async (req: Request, res: Response<unknown, CompanyLocals>) => {
  const company = res.locals.company as NonNullable<CompanyLocals['company']>
  const page = Number(req.query.page || 1)
  const limit = Number(req.query.limit || 10)
  const status = req.query.status as JobStatus | undefined
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : undefined

  const result = await jobsService.getCompanyJobs({
    companyId: company._id as ObjectId,
    status,
    keyword,
    page,
    limit
  })

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      jobs: result.jobs.map((job) => ({
        _id: job._id,
        title: job.title,
        location: job.location,
        job_type: job.job_type,
        level: job.level,
        status: job.status,
        moderation_status: job.moderation_status,
        blocked_reason: job.blocked_reason ?? '',
        quantity: job.quantity,
        expired_at: job.expired_at,
        published_at: job.published_at,
        created_at: job.created_at,
        updated_at: job.updated_at
      })),
      pagination: result.pagination
    }
  })
}

export const getCompanyJobDetailController = async (
  req: Request,
  res: Response<unknown, CompanyLocals & JobLocals>
) => {
  const job = res.locals.job as Job

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      _id: job._id,
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      salary: job.salary,
      location: job.location,
      job_type: job.job_type,
      level: job.level,
      status: job.status,
      moderation_status: job.moderation_status,
      blocked_reason: job.blocked_reason ?? '',
      category_ids: job.category_ids,
      skills: job.skills,
      quantity: job.quantity,
      expired_at: job.expired_at,
      published_at: job.published_at,
      created_at: job.created_at,
      updated_at: job.updated_at
    }
  })
}

export const updateCompanyJobController = async (
  req: Request<ParamsDictionary, unknown, Partial<Job>>,
  res: Response<unknown, CompanyLocals & JobLocals>
) => {
  const job = res.locals.job as Job

  const payload: Partial<Job> = {
    ...req.body,
    updated_at: new Date()
  }

  if (typeof payload.description === 'string') payload.description = sanitizeRichJobContent(payload.description)
  if (typeof payload.requirements === 'string') payload.requirements = sanitizeRichJobContent(payload.requirements)
  if (typeof payload.benefits === 'string') payload.benefits = sanitizeRichJobContent(payload.benefits)

  const updatedJob = await jobsService.updateCompanyJob(job._id as ObjectId, payload)

  return res.status(StatusCodes.OK).json({
    status: 'success',
    message: UserMessages.JOB_UPDATED_SUCCESS,
    data: {
      _id: updatedJob?._id,
      title: updatedJob?.title,
      description: updatedJob?.description,
      requirements: updatedJob?.requirements,
      benefits: updatedJob?.benefits,
      salary: updatedJob?.salary,
      location: updatedJob?.location,
      job_type: updatedJob?.job_type,
      level: updatedJob?.level,
      status: updatedJob?.status,
      moderation_status: updatedJob?.moderation_status,
      category_ids: updatedJob?.category_ids,
      skills: updatedJob?.skills,
      quantity: updatedJob?.quantity,
      expired_at: updatedJob?.expired_at,
      published_at: updatedJob?.published_at,
      created_at: updatedJob?.created_at,
      updated_at: updatedJob?.updated_at
    }
  })
}

export const updateCompanyJobStatusController = async (
  req: Request<ParamsDictionary, unknown, { status: JobStatus }>,
  res: Response<unknown, CompanyLocals & JobLocals>
) => {
  const job = res.locals.job as Job

  const payload: Partial<Job> = {
    status: req.body.status,
    updated_at: new Date()
  }

  if (req.body.status === JobStatus.OPEN && !job.published_at) {
    payload.published_at = new Date()
  }

  const updatedJob = await jobsService.updateCompanyJob(job._id as ObjectId, payload)

  return res.status(StatusCodes.OK).json({
    status: 'success',
    message: UserMessages.JOB_STATUS_UPDATED_SUCCESS,
    data: {
      _id: updatedJob?._id,
      title: updatedJob?.title,
      status: updatedJob?.status,
      moderation_status: updatedJob?.moderation_status,
      published_at: updatedJob?.published_at,
      expired_at: updatedJob?.expired_at,
      updated_at: updatedJob?.updated_at
    }
  })
}

