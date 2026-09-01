import { Response } from 'express'
import ms, { StringValue } from 'ms'
import env from '~/configs/env.config.js'

const AUTH_COOKIE_PATH = '/api/v1/auth'

function getRefreshCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: env.AUTH_COOKIE_SECURE,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    path: AUTH_COOKIE_PATH,
    ...(remember
      ? { maxAge: ms(env.ExpiresIn_REFRESH_TOKEN as StringValue) as number }
      : {})
  } as const
}

export function setRefreshTokenCookie(res: Response, refreshToken: string, remember = true) {
  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions(remember))
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, getRefreshCookieOptions(false))
}
