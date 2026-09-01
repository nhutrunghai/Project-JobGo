const DEFAULT_API_ORIGIN = 'http://localhost:4000'
const DEFAULT_API_VERSION = 'v1'

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function stripOuterSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '')
}

function alignOriginHostname(origin) {
  if (typeof window === 'undefined' || !origin) return origin

  try {
    const url = new URL(origin)
    const currentHostname = window.location.hostname

    if (!currentHostname || currentHostname === url.hostname) return origin

    const localhostHosts = new Set(['localhost', '127.0.0.1', '::1'])
    const shouldAlign =
      localhostHosts.has(url.hostname) ||
      localhostHosts.has(currentHostname) ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(currentHostname)

    if (!shouldAlign) return origin

    url.hostname = currentHostname
    return url.toString().replace(/\/$/, '')
  } catch {
    return origin
  }
}

function resolveAbsoluteUrl(value) {
  if (!value) return ''

  if (typeof window !== 'undefined') {
    try {
      return new URL(value, window.location.origin).toString().replace(/\/$/, '')
    } catch {
      return value
    }
  }

  return value
}

function resolveApiBaseUrl() {
  const explicitBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (explicitBaseUrl) {
    return stripTrailingSlash(resolveAbsoluteUrl(alignOriginHostname(explicitBaseUrl)))
  }

  const version = stripOuterSlashes(import.meta.env.VITE_API_VERSION || DEFAULT_API_VERSION)

  // In local Vite dev, prefer same-origin API calls so the dev proxy can avoid CORS failures.
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return stripTrailingSlash(resolveAbsoluteUrl(`/api/${version}`))
  }

  const origin = stripTrailingSlash(alignOriginHostname(import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN))

  return `${origin}/api/${version}`
}

export const API_BASE_URL = resolveApiBaseUrl()

export function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return stripTrailingSlash(import.meta.env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN)
  }
}

const LEGACY_AUTH_STORAGE_KEYS = ['token', 'accessToken', 'refreshToken', 'user', 'authUser', 'isLoggedIn']
let accessToken = ''

function clearLegacyAuthStorage() {
  if (typeof window === 'undefined') return
  LEGACY_AUTH_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  })
}

clearLegacyAuthStorage()

export function getAccessToken() {
  return accessToken
}

export function hasAccessToken() {
  return Boolean(accessToken)
}

export function clearClientAuthSession() {
  accessToken = ''
  clearLegacyAuthStorage()
}

export function saveAccessToken(authData) {
  accessToken = authData?.AccessToken || authData?.accessToken || ''
  clearLegacyAuthStorage()
}

export function buildApiUrl(path, params) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

export function createJsonHeaders(headers = {}, { auth = true, hasBody = true } = {}) {
  const nextHeaders = new Headers(headers)
  const token = getAccessToken()

  if (hasBody && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json')
  }

  if (auth && token && !nextHeaders.has('Authorization')) {
    nextHeaders.set('Authorization', `Bearer ${token}`)
  }

  return nextHeaders
}
