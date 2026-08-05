import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import EmployerTopBar from '../../components/EmployerTopBar.jsx'
import Toast from '../../components/Toast.jsx'
import { loadEmployerDashboardOverview } from '../../data/apiClient.js'

const statShells = [
  {
    key: 'openJobs',
    label: 'Tin đang tuyển',
    badge: 'Đang mở',
    icon: 'work',
    className: 'from-blue-500 to-indigo-600',
  },
  {
    key: 'totalApplications',
    label: 'Hồ sơ gần đây',
    badge: 'Ứng viên',
    icon: 'groups',
    className: 'from-emerald-500 to-teal-600',
  },
  {
    key: 'interviewing',
    label: 'Phỏng vấn gần đây',
    badge: 'Theo dõi',
    icon: 'event_available',
    className: 'from-amber-500 to-orange-600',
  },
  {
    key: 'totalJobs',
    label: 'Tổng tin tuyển dụng',
    badge: 'Tất cả',
    icon: 'business_center',
    className: 'from-rose-500 to-pink-600',
  },
]

const quickActions = [
  {
    label: 'Đăng tin tuyển dụng',
    description: 'Tạo vị trí mới và bắt đầu nhận hồ sơ.',
    to: '/employer-post-job',
    icon: 'add_circle',
    className: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    label: 'Quản lý job',
    description: 'Theo dõi trạng thái, hạn tuyển và hiệu quả từng tin.',
    to: '/employer-job-list',
    icon: 'checklist',
    className: 'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    label: 'Hồ sơ ứng viên',
    description: 'Xem, lọc và cập nhật trạng thái ứng viên.',
    to: '/employer-received-cv',
    icon: 'description',
    className: 'bg-amber-500 hover:bg-amber-600',
  },
  {
    label: 'Lịch phỏng vấn',
    description: 'Kiểm tra các buổi phỏng vấn đang theo dõi.',
    to: '/employer-interviews',
    icon: 'calendar_month',
    className: 'bg-rose-500 hover:bg-rose-600',
  },
]

function getCompanyInitials(name) {
  return String(name || 'NTD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default function EmployerOverviewDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [company, setCompany] = useState(null)
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    draftJobs: 0,
    closedJobs: 0,
    totalApplications: 0,
    interviewing: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [needsAdminApproval, setNeedsAdminApproval] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoFailed, setLogoFailed] = useState(false)
  const [toast, setToast] = useState(location.state?.toast ?? null)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await loadEmployerDashboardOverview()
        if (!mounted) return
        if (data?.needsCompanyProfile) {
          navigate('/employer/company-registration', {
            replace: true,
            state: {
              toast: location.state?.toast || null,
            },
          })
          return
        }
        setNeedsAdminApproval(data?.needsAdminApproval === true)
        setCompany(data.company)
        setStats(data.stats)
        setRecentActivities(data.recentActivities)
      } catch (loadError) {
        if (!mounted) return
        const message = loadError.message || 'Không thể tải dashboard nhà tuyển dụng.'
        setError(message)
        setToast({ type: 'error', message })
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [location.state?.toast, navigate])

  useEffect(() => {
    if (!location.state?.toast) return

    const { toast: _toast, ...nextState } = location.state
    navigate(location.pathname, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    })
  }, [location.pathname, location.state, navigate])

  const companyName = company?.company_name || 'Nhà tuyển dụng'
  const showCompanyLogo = Boolean(company?.logo) && !logoFailed
  const companyMeta = useMemo(() => {
    const details = [company?.address, company?.website].filter(Boolean)
    return details.length ? details.join(' · ') : 'Thiết lập hồ sơ công ty để ứng viên tin tưởng hơn.'
  }, [company])

  useEffect(() => {
    setLogoFailed(false)
  }, [company?.logo])

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-on-surface">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardSidebar activeKey="employer-dashboard" />

      <main className="min-h-screen bg-[#F9FAFB] lg:ml-64">
        <EmployerTopBar />
        <div className="px-4 py-5 lg:px-6 lg:py-7">
        <header className="mb-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {showCompanyLogo ? (
              <img
                src={company.logo}
                alt={companyName}
                onError={() => setLogoFailed(true)}
                className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-lg font-extrabold text-white">
                {getCompanyInitials(companyName)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-slate-900">Dashboard nhà tuyển dụng</h1>
                {company?.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    Đã xác minh
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm font-medium text-slate-500">{companyName} · {companyMeta}</p>
            </div>
          </div>

          {!needsAdminApproval && <div className="flex flex-wrap gap-2">
            <Link to="/employer-post-job" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Đăng tin mới
            </Link>
            <Link to="/employer-job-list" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
              <span className="material-symbols-outlined text-[18px]">manage_search</span>
              Quản lý job
            </Link>
          </div>}
        </header>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {needsAdminApproval ? (
          <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
            <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-white px-5 py-6 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <span className="material-symbols-outlined text-[30px]">pending_actions</span>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Đang chờ xác minh</span>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">Hồ sơ công ty đang được admin duyệt</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Chúng tôi đã nhận hồ sơ của <strong>{companyName}</strong>. Các chức năng đăng tin, quản lý ứng viên và lịch phỏng vấn sẽ được mở ngay sau khi hồ sơ được xác minh.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-7">
              {[
                { icon: 'task_alt', title: 'Hồ sơ đã gửi', text: 'Thông tin công ty của bạn đã được ghi nhận.', tone: 'text-emerald-600 bg-emerald-50' },
                { icon: 'admin_panel_settings', title: 'Admin đang kiểm tra', text: 'Vui lòng chờ kết quả xác minh từ quản trị viên.', tone: 'text-amber-600 bg-amber-50' },
                { icon: 'rocket_launch', title: 'Bắt đầu tuyển dụng', text: 'Bạn sẽ có thể sử dụng đầy đủ tính năng sau khi được duyệt.', tone: 'text-blue-600 bg-blue-50' },
              ].map((item) => (
                <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.tone}`}>
                    <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        ) : <>
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">Tổng quan tuyển dụng</h2>
            </div>
            {isLoading && <span className="text-sm font-semibold text-slate-400">Đang tải...</span>}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statShells.map((card) => (
              <article key={card.key} className={`rounded-lg bg-gradient-to-br p-4 text-white ${card.className}`}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="material-symbols-outlined text-[26px]">{card.icon}</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">{card.badge}</span>
                </div>
                <p className="text-[34px] font-extrabold leading-none">{stats[card.key]}</p>
                <p className="mt-1 text-[14px] font-semibold text-white/95">{card.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">Thao tác nhanh</h2>
              <p className="mt-1 text-sm text-slate-500">Các luồng chính cho nhà tuyển dụng.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {quickActions.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex min-h-[54px] items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[15px] font-bold text-white transition ${item.className}`}
                title={item.description}
              >
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-slate-900">Hoạt động gần đây</h2>
              <p className="mt-1 text-sm text-slate-500">Các hồ sơ mới nhất từ những tin tuyển dụng của công ty.</p>
            </div>
            <Link to="/employer-received-cv" className="hidden text-sm font-bold text-blue-600 hover:text-blue-700 md:inline-flex">
              Xem hồ sơ
            </Link>
          </div>

          <div className="space-y-2">
            {recentActivities.length ? (
              recentActivities.map((item) => (
                <article key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-slate-200">
                      <span className="material-symbols-outlined text-[19px]">person_add</span>
                    </div>
                    <p className="truncate text-[14px] font-semibold text-slate-700">{item.title}</p>
                  </div>
                  <span className={`shrink-0 text-[12px] font-bold ${item.tone}`}>{item.time}</span>
                </article>
              ))
            ) : (
              <article className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3.5 py-8 text-center">
                <span className="material-symbols-outlined text-[36px] text-slate-300">inbox</span>
                <p className="mt-2 text-[14px] font-semibold text-slate-500">Không có hoạt động gì gần đây</p>
              </article>
            )}
          </div>
        </section>
        </>}
        </div>
      </main>
    </div>
  )
}
