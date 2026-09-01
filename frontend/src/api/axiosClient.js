import { buildApiUrl, clearClientAuthSession, createJsonHeaders } from '../config/api'
import { refreshAccessToken } from './tokenRefresh.js'

function getHeaders(headers = {}, options = {}) {
  return createJsonHeaders(headers, options)
}

async function readPayload(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function runRequest(method, path, { params, data, headers, auth = true } = {}) {
  const response = await fetch(buildApiUrl(path, params), {
    method,
    credentials: 'include',
    headers: getHeaders(headers, { auth, hasBody: data !== undefined }),
    body: data !== undefined ? JSON.stringify(data) : undefined,
  })

  const payload = await readPayload(response)

  return { response, payload }
}

async function request(method, path, {
  params,
  data,
  headers,
  auth = true,
  retryOnUnauthorized = true,
  redirectOnUnauthorized = true,
} = {}) {
  let { response, payload } = await runRequest(method, path, { params, data, headers, auth })

  if (response.status === 401 && auth && retryOnUnauthorized && path !== '/auth/refresh-token') {
    try {
      await refreshAccessToken()
      ;({ response, payload } = await runRequest(method, path, { params, data, headers, auth }))
    } catch (refreshError) {
      clearClientAuthSession()
      if (redirectOnUnauthorized && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      }
      throw refreshError
    }
  }

  if (!response.ok) {
    if (payload?.message) {
      throw new Error(payload.message)
    }

    const gatewayErrorMessage = {
      502: 'Không kết nối được tới máy chủ. Vui lòng thử lại sau ít giây.',
      503: 'Máy chủ đang tạm thời bận. Vui lòng thử lại sau ít giây.',
      504: 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau ít giây.',
    }[response.status]

    throw new Error(gatewayErrorMessage || 'Không thể kết nối máy chủ. Vui lòng thử lại sau.')
  }

  return { data: payload }
}

const apiClient = {
  get(path, options) {
    return request('GET', path, options)
  },
  post(path, data, options = {}) {
    return request('POST', path, { ...options, data })
  },
  patch(path, data, options = {}) {
    return request('PATCH', path, { ...options, data })
  },
  delete(path, options) {
    return request('DELETE', path, options)
  },
}

export default apiClient
