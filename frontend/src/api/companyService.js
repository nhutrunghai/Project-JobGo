import apiClient from './axiosClient.js'


export async function getJobCategories() {
  const response = await apiClient.get('/job-categories', { auth: false })
  return response.data?.data?.categories || []
}

export async function createCompanyJob(payload) {
  const response = await apiClient.post('/company/jobs', payload, { auth: true })
  return response.data
}

export async function updateCompanyJob(jobId, payload) {
  const response = await apiClient.patch(`/company/jobs/${encodeURIComponent(jobId)}`, payload, { auth: true })
  return response.data
}

export async function getCompanyJob(jobId) {
  const response = await apiClient.get(`/company/jobs/${encodeURIComponent(jobId)}`, { auth: true })
  return response.data
}

export async function getCompanyJobs(params = {}) {
  const response = await apiClient.get('/company/jobs', { auth: true, params })
  const data = response.data?.data || {}
  return {
    items: data.jobs || [],
    pagination: data.pagination || {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 20,
      total: 0,
    },
  }
}

export async function getCompanyPromotionPlans() {
  const response = await apiClient.get('/company/job-promotions/plans', { auth: true })
  return response.data?.data || { plans: [] }
}

export async function purchaseCompanyJobPromotion(jobId, payload) {
  const response = await apiClient.post(`/company/jobs/${encodeURIComponent(jobId)}/promotions/purchase`, payload, { auth: true })
  return response.data?.data || {}
}

export async function getCompanyJobPromotions(params = {}) {
  const response = await apiClient.get('/company/job-promotions', { auth: true, params })
  const data = response.data?.data || {}
  return {
    items: data.promotions || [],
    pagination: data.pagination || {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 10,
      total: 0,
      total_pages: 1,
    },
  }
}

export async function getCompanyJobPromotionDetail(promotionId) {
  const response = await apiClient.get(`/company/job-promotions/${encodeURIComponent(promotionId)}`, { auth: true })
  return response.data?.data?.promotion || response.data?.promotion || null
}

export async function cancelCompanyJobPromotion(promotionId) {
  const response = await apiClient.patch(`/company/job-promotions/${encodeURIComponent(promotionId)}/cancel`, {}, { auth: true })
  return response.data?.data?.promotion || response.data?.promotion || null
}

export async function getCompanyJobApplications(jobId, status, page = 1, limit = 20) {
  const response = await apiClient.get(`/company/jobs/${encodeURIComponent(jobId)}/applications`, {
    auth: true,
    params: { status, page, limit },
  })
  const data = response.data?.data || {}
  return {
    items: data.applications || [],
    pagination: data.pagination || { page, limit, total: 0 },
  }
}
