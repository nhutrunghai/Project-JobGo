import { buildApiUrl, createJsonHeaders, saveAccessToken } from '../config/api.js'

let refreshPromise = null
let refreshCookieState = 'unknown'

export function markRefreshCookieAvailable() {
  refreshCookieState = 'available'
}

export function markRefreshCookieUnavailable() {
  refreshCookieState = 'unavailable'
}

async function readPayload(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function refreshAccessToken() {
  if (refreshCookieState === 'unavailable') {
    throw new Error('Phiên đăng nhập đã hết hạn.')
  }

  if (!refreshPromise) {
    refreshPromise = fetch(buildApiUrl('/auth/refresh-token'), {
      method: 'POST',
      credentials: 'include',
      headers: createJsonHeaders({}, { auth: false, hasBody: false }),
    })
      .then(async (response) => {
        const payload = await readPayload(response)
        if (!response.ok) {
          refreshCookieState = 'unavailable'
          throw new Error(payload?.message || 'Không thể làm mới phiên đăng nhập.')
        }

        const authData = payload?.data
        if (!authData?.AccessToken) {
          throw new Error('Phản hồi refresh token không hợp lệ.')
        }

        saveAccessToken(authData)
        refreshCookieState = 'available'
        return authData
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}
