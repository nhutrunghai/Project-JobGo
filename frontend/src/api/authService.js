import apiClient from './axiosClient'
import { clearClientAuthSession, saveAccessToken } from '../config/api.js'
import { markRefreshCookieAvailable, markRefreshCookieUnavailable } from './tokenRefresh.js'

export function clearAuthSession() {
  clearClientAuthSession()
  markRefreshCookieUnavailable()
}

export function saveAuthSession(authData) {
  saveAccessToken(authData)
  markRefreshCookieAvailable()
}

export async function login(payload, options = {}) {
  const response = await apiClient.post('/auth/login', {
    email: payload.email,
    password: payload.password,
    remember: options.remember !== false,
  }, { auth: false })
  const authData = response?.data?.data

  if (!authData?.AccessToken) {
    throw new Error('Phản hồi đăng nhập không hợp lệ.')
  }

  saveAuthSession(authData)

  return {
    id: authData.id,
    accessToken: authData.AccessToken,
    message: response?.data?.message || 'Đăng nhập thành công.',
  }
}

export async function register(payload, options = {}) {
  const response = await apiClient.post('/auth/register', {
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    remember: options.remember !== false,
  }, { auth: false })
  const authData = response?.data?.data

  if (!authData?.AccessToken) {
    throw new Error('Phản hồi đăng ký không hợp lệ.')
  }

  saveAuthSession(authData)

  return {
    id: authData.id,
    accessToken: authData.AccessToken,
    message: response?.data?.message || 'Đăng ký thành công.',
  }
}

export async function forgotPassword(payload) {
  const response = await apiClient.post('/auth/forgot-password', {
    email: payload.email,
  }, { auth: false })

  return {
    message: response?.data?.message || 'Đã gửi email đặt lại mật khẩu nếu email tồn tại trong hệ thống.',
  }
}

export async function resetPassword(payload) {
  const response = await apiClient.post('/auth/reset-password', {
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    forgot_password_token: payload.forgotPasswordToken,
  }, { auth: false })

  return {
    message: response?.data?.message || 'Đặt lại mật khẩu thành công.',
  }
}

export async function verifyEmail(payload, options = {}) {
  const response = await apiClient.post('/auth/verify-email', {
    email_verify_token: payload.emailVerifyToken,
  }, { auth: false })
  const authData = response?.data?.data

  if (authData?.AccessToken) {
    saveAuthSession(authData, options)
  }

  return {
    id: authData?.id,
    accessToken: authData?.AccessToken,
    message: response?.data?.message || 'Xác minh email thành công.',
  }
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout', undefined)
  } finally {
    clearAuthSession()
  }
}
