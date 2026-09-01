import { ParamsDictionary } from 'express-serve-static-core'
import { UserRole } from '~/constants/enums.js'

export interface RegisterRqType {
  fullName: string
  email: string
  password: string
  device_info: string
  role?: UserRole
  remember?: boolean
}

export interface LoginRqType {
  email: string
  password: string
  remember?: boolean
}

export interface AdminLoginRqType {
  email: string
  password: string
}

export interface EmailVerifyRqType {
  email_verify_token: string
}

export interface ForgotPasswordRqType {
  email: string
}

export interface ResetPasswordRqType {
  password: string
  forgot_password_token: string
}

export interface GetUserRqType extends ParamsDictionary {
  id: string
}

export interface newPasswordRqType {
  newPassword: string
  OtpCode: string
}

export interface UpdateUserAvatarRqType {
  avatar_file_key: string
}

export interface UpdateCompanyLogoRqType {
  logo: string
  logo_file_key: string
}

export interface ResumeIdParamType extends ParamsDictionary {
  resumeId: string
}

export interface CreateResumeRqType {
  title: string
  cv_url: string
  resume_file_key: string
  is_default?: boolean
}
