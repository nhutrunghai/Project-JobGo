import bodyParser from 'body-parser'
import { z } from 'zod'
import UserMessages from '~/constants/messages/index.js'
const emailSchema = z
  .string({ message: UserMessages.EMAIL_NOT_STRING })
  .email({ message: UserMessages.EMAIL_INVALID })
  .trim()
  .toLowerCase()
export const passwordSchema = z
  .string({ message: UserMessages.PASSWORD_NOT_STRING })
  .min(8, { message: UserMessages.PASSWORD_MIN_LENGTH })
  .max(50, { message: UserMessages.PASSWORD_MAX_LENGTH })
const fullNameSchema = z
  .string({ message: UserMessages.NAME_NOT_STRING })
  .trim()
  .min(2, { message: UserMessages.NAME_MIN_LENGTH })
  .max(100, { message: UserMessages.NAME_MAX_LENGTH })
export const CONFIRM_PASSWORD_NOT_STRING = z.string({ message: UserMessages.CONFIRM_PASSWORD_NOT_STRING })
export const registerValidator = z.object({
  body: z
    .object({
      fullName: fullNameSchema,
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: CONFIRM_PASSWORD_NOT_STRING,
      remember: z.boolean().optional()
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: UserMessages.CONFIRM_PASSWORD_MISMATCH,
      path: ['confirmPassword']
    })
})
export const loginValidator = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    remember: z.boolean().optional()
  })
})
export const verifyEmailValidator = z.object({
  body: z.object({
    email_verify_token: z.string({ message: UserMessages.EMAIL_VERIFY_TOKEN_NOT_FOUND })
  })
})
export const forgotPasswordValidator = z.object({
  body: z.object({
    email: emailSchema
  })
})
export const resetPasswordValidator = z.object({
  body: z
    .object({
      password: passwordSchema,
      confirmPassword: CONFIRM_PASSWORD_NOT_STRING,
      forgot_password_token: z.string({ message: UserMessages.FORGOT_PASSWORD_TOKEN_NOT_FOUND })
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: UserMessages.CONFIRM_PASSWORD_MISMATCH,
      path: ['confirmPassword']
    })
})
