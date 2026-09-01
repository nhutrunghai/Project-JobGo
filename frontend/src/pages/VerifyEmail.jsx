import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/authService.js'
import useCurrentUser from '../hooks/useCurrentUser.js'

function VerifyEmail() {
  const navigate = useNavigate()
  const { refreshSession } = useCurrentUser()
  const [searchParams] = useSearchParams()
  const didVerifyRef = useRef(false)
  const emailVerifyToken = searchParams.get('email_verify_token') || ''
  const [status, setStatus] = useState(() => (emailVerifyToken ? 'loading' : 'error'))
  const [message, setMessage] = useState(() =>
    emailVerifyToken ? 'Đang xác minh email của bạn...' : 'Liên kết xác minh email không hợp lệ hoặc thiếu token.',
  )

  useEffect(() => {
    if (!emailVerifyToken) {
      return
    }

    if (didVerifyRef.current) return
    didVerifyRef.current = true

    async function handleVerifyEmail() {
      try {
        const result = await verifyEmail({ emailVerifyToken }, { remember: true })
        if (result.accessToken) await refreshSession({ force: true })
        setStatus('success')
        setMessage(result.message || 'Xác minh email thành công.')
      } catch (error) {
        setStatus('error')
        setMessage(error.message || 'Không thể xác minh email. Liên kết có thể đã hết hạn hoặc không hợp lệ.')
      }
    }

    handleVerifyEmail()
  }, [emailVerifyToken, refreshSession])

  const isLoading = status === 'loading'
  const isSuccess = status === 'success'
  const icon = isLoading ? 'hourglass_top' : isSuccess ? 'mark_email_read' : 'error'

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef8ff_0%,#f7fbff_45%,#eef5ff_100%)] px-5 py-6 text-slate-900">
      <header className="mx-auto flex max-w-[1120px] items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-[#2b59ff]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            code
          </span>
          MYCODER
        </Link>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-[1120px] items-center justify-center py-12">
        <section className="w-full max-w-[460px] rounded-[22px] border border-white/90 bg-white/95 p-7 text-center shadow-[0_35px_70px_-35px_rgba(15,23,42,0.55)] backdrop-blur-md">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              isLoading ? 'bg-sky-100 text-sky-700' : isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            <span className="material-symbols-outlined !text-[34px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          </div>

          <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-sky-700">Xác minh email</p>
          <h1 className="mt-3 text-[32px] font-black tracking-tight text-slate-950">
            {isLoading ? 'Đang xử lý' : isSuccess ? 'Email đã xác minh' : 'Xác minh thất bại'}
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {isSuccess ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#30353b] px-4 text-sm font-bold text-white transition hover:bg-[#1f2937]"
              >
                Vào dashboard
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#30353b] px-4 text-sm font-bold text-white transition hover:bg-[#1f2937]"
              >
                Quay lại đăng nhập
              </Link>
            )}
            <Link
              to="/"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:text-sky-800"
            >
              Về trang chủ
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default VerifyEmail
