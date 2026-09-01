import { Router } from 'express'
import {
  forgotPasswordController,
  LoginController,
  LogoutController,
  OauthGoogleController,
  RefreshController,
  RegisterController,
  resetPasswordController,
  verifyEmailController
} from '~/controllers/client/auth.controller.js'
import {
  LoginMiddleware,
  LogoutMiddleware,
  OauthGoogleMiddleware,
  RefreshMiddleware,
  TrustedAuthOriginMiddleware,
  registerMiddleware,
  resetPasswordMiddleware,
  verifyEmailMiddleware
} from '~/middlewares/client/auth.middleware.js'
import { authLimiter, mailLimiter } from '~/middlewares/common/rate-limit.middleware'
import validate from '~/middlewares/common/validator.middleware.js'
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  verifyEmailValidator
} from '~/validators/client/auth.validator.js'
const authRouter = Router()
authRouter.use(TrustedAuthOriginMiddleware)
authRouter.post('/register', authLimiter, validate(registerValidator), registerMiddleware, RegisterController)
authRouter.post('/login', authLimiter, validate(loginValidator), LoginMiddleware, LoginController)
authRouter.get('/oauth/google', OauthGoogleMiddleware, OauthGoogleController)
authRouter.post('/logout', LogoutMiddleware, LogoutController)
authRouter.post('/refresh-token', authLimiter, RefreshMiddleware, RefreshController)
authRouter.post('/verify-email', authLimiter, validate(verifyEmailValidator), verifyEmailMiddleware, verifyEmailController)
authRouter.post('/forgot-password', validate(forgotPasswordValidator), mailLimiter, forgotPasswordController)
authRouter.post('/reset-password', authLimiter, validate(resetPasswordValidator), resetPasswordMiddleware, resetPasswordController)
export default authRouter

