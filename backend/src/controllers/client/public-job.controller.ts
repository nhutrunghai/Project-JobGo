import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { JobLevel, JobType } from '~/constants/enums'
import { PublicJobWithApplicationLocals } from '~/types/http/response.type'
import jobsService from '~/services/client/job.service'

export const getPublicJobDetailController = async (
  req: Request,
  res: Response<unknown, PublicJobWithApplicationLocals>
) => {
  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      ...res.locals.publicJob,
      my_application: res.locals.myApplication
    }
  })
}

export const searchPublicJobsController = async (req: Request, res: Response) => {
  const result = await jobsService.searchPublicJobs({
    q: req.query.q as string,
    location: req.query.location as string | undefined,
    job_type: req.query.job_type as JobType | undefined,
    level: req.query.level as JobLevel | undefined,
    category_id: req.query.category_id as string | undefined,
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 10)
  })

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: result
  })
}

export const getLatestPublicJobsController = async (req: Request, res: Response) => {
  const result = await jobsService.getLatestPublicJobs({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 8)
  })

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: result
  })
}

export const getFeaturedPublicJobsController = async (req: Request, res: Response) => {
  const result = await jobsService.getFeaturedPublicJobs({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 8)
  })

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: result
  })
}
