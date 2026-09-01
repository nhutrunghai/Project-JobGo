import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { login } from '../../api/authService.js'

export default function LoginModal({ onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose?.()
    }
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isSubmitting, onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim()

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Vui lòng nhập email hợp lệ.')
      return
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const result = await login({ email: normalizedEmail, password }, { remember })
      await onSuccess?.(result)
    } catch (loginError) {
      setError(loginError.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose?.()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.65)]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined">login</span>
            </div>
            <h2 id="login-modal-title" className="min-w-0 text-xl font-black leading-tight tracking-tight text-slate-950">
              Đăng nhập để ứng tuyển
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng cửa sổ đăng nhập"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form className="space-y-4 px-5 py-5 sm:px-6 sm:py-6" noValidate onSubmit={handleSubmit}>
          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-semibold leading-5 text-rose-700">
              <span className="material-symbols-outlined mt-0.5 text-[18px]">error</span>
              <span>{error}</span>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Email</span>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <span className="material-symbols-outlined shrink-0 text-[20px] text-slate-400">mail</span>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                className="h-full min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-sm text-slate-900 !shadow-none !outline-none !ring-0 placeholder:text-slate-400 focus:!border-0 focus:!outline-none focus:!ring-0"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Mật khẩu</span>
            <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <span className="material-symbols-outlined shrink-0 text-[20px] text-slate-400">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                className="h-full min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-sm text-slate-900 !shadow-none !outline-none !ring-0 placeholder:text-slate-400 focus:!border-0 focus:!outline-none focus:!ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex cursor-pointer items-center gap-2 font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Ghi nhớ đăng nhập
            </label>
            <Link to="/forgot-password" onClick={onClose} className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-wait disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập và tiếp tục'
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" onClick={onClose} className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </section>
    </div>
  )
}
