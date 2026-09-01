import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'
import adminJobCategoryService from '~/services/admin/job-category.service.js'

function categoryResponse(category: any) {
  return {
    _id: category._id,
    name: category.name,
    slug: category.slug,
    parent_id: category.parent_id ?? null,
    description: category.description ?? '',
    is_active: Boolean(category.is_active),
    sort_order: category.sort_order ?? 0,
    job_count: category.job_count ?? 0,
    created_at: category.created_at,
    updated_at: category.updated_at
  }
}

export const getAdminJobCategoriesController = async (_req: Request, res: Response) => {
  const categories = await adminJobCategoryService.getCategories()

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      categories: categories.map(categoryResponse)
    }
  })
}

export const createAdminJobCategoryController = async (req: Request, res: Response) => {
  const category = await adminJobCategoryService.createCategory(req.body || {})

  return res.status(StatusCodes.CREATED).json({
    status: 'success',
    data: {
      category: categoryResponse(category)
    }
  })
}

export const updateAdminJobCategoryController = async (req: Request, res: Response) => {
  const category = await adminJobCategoryService.updateCategory(new ObjectId(String(req.params.categoryId)), req.body || {})

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      category: categoryResponse(category)
    }
  })
}

export const toggleAdminJobCategoryController = async (req: Request, res: Response) => {
  const category = await adminJobCategoryService.toggleCategory(new ObjectId(String(req.params.categoryId)), Boolean(req.body?.is_active))

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      category: categoryResponse(category)
    }
  })
}
