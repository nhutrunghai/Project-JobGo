import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import EmployerTopBar from '../../components/EmployerTopBar.jsx'
import Toast from '../../components/Toast.jsx'
import { loadEmployerReceivedApplications } from '../../data/apiClient.js'
import { toSafeResourceUrl } from '../../utils/safeUrl.js'

const applicationStatusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'submitted', label: 'Mới nhận' },
  { value: 'reviewing', label: 'Đang xem' },
  { value: 'shortlisted', label: 'Tiềm năng' },
  { value: 'interviewing', label: 'Phỏng vấn' },
  { value: 'hired', label: 'Đã nhận' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'withdrawn', label: 'Đã rút' },
]

const statusTone = {
  submitted: 'border-violet-100 bg-violet-50 text-violet-700',
  reviewing: 'border-blue-100 bg-blue-50 text-blue-700',
  shortlisted: 'border-cyan-100 bg-cyan-50 text-cyan-700',
  interviewing: 'border-amber-100 bg-amber-50 text-amber-700',
  hired: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-100 bg-rose-50 text-rose-700',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-600',
}

const statCards = [
  { key: 'total', title: 'Tổng hồ sơ', icon: 'description', tone: 'bg-blue-50 text-blue-600' },
  { key: 'submitted', title: 'Mới nhận', icon: 'mark_email_unread', tone: 'bg-violet-50 text-violet-600' },
  { key: 'reviewing', title: 'Đang xem', icon: 'manage_search', tone: 'bg-cyan-50 text-cyan-600' },
  { key: 'interviewing', title: 'Phỏng vấn', icon: 'event_available', tone: 'bg-amber-50 text-amber-600' },
]

const defaultPagination = { page: 1, limit: 10, total: 0, total_pages: 1 }

function formatDateTime(value) {
  if (!value) return 'Chưa có dữ liệu'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu'
  return date.toLocaleString('vi-VN')
}

export default function EmployerReceivedProfiles() {
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState({ total: 0, submitted: 0, reviewing: 0, interviewing: 0, hired: 0 })
  const [pagination, setPagination] = useState(defaultPagination)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [previewCv, setPreviewCv] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let active = true
    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      try {
        const data = await loadEmployerReceivedApplications({
          status: statusFilter,
          keyword: search,
          page,
          limit: pagination.limit,
        })
        if (!active) return
        setApplications(data.applications)
        setStats(data.stats)
        setPagination(data.pagination)
      } catch (error) {
        if (!active) return
        setApplications([])
        setStats({ total: 0, submitted: 0, reviewing: 0, interviewing: 0, hired: 0 })
        setPagination(defaultPagination)
        setToast({ type: 'error', message: error.message || 'Không thể tải danh sách hồ sơ.' })
      } finally {
        if (active) setLoading(false)
      }
    }, search.trim() ? 300 : 0)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [page, pagination.limit, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const totalPages = Math.max(1, Number(pagination.total_pages || 1))

  const visibleRange = useMemo(() => {
    if (!pagination.total) return '0 hồ sơ'
    const start = (pagination.page - 1) * pagination.limit + 1
    const end = Math.min(pagination.total, pagination.page * pagination.limit)
    return `${start}-${end} / ${pagination.total} hồ sơ`
  }, [pagination])

  return (
    <div className="dashboard-copy-font min-h-screen bg-[#F9FAFB] text-slate-900">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardSidebar activeKey="received-cv" />

      <main className="min-h-screen bg-[#F9FAFB] lg:ml-64">
        <EmployerTopBar />
        <div className="px-4 py-5 lg:px-6 lg:py-7">
        <section className="mb-4 lg:mb-6">
          <div>
            <p className="text-sm font-semibold text-blue-600">Quản lý tuyển dụng</p>
            <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-950 sm:text-[32px] lg:text-[34px]">Hồ sơ đã nhận</h1>
            <p className="mt-2 text-sm text-slate-500">Tổng hợp hồ sơ ứng viên từ các job của công ty.</p>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4 lg:mb-5">
          {statCards.map((card) => (
            <article key={card.key} className="flex min-h-[92px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
                <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{card.title}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{stats[card.key] || 0}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:mb-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_240px_150px]">
            <label className="relative block">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="Tìm ứng viên, email, số điện thoại, job..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {applicationStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              value={pagination.limit}
              onChange={(event) => {
                setPagination((current) => ({ ...current, limit: Number(event.target.value) }))
                setPage(1)
              }}
            >
              <option value={10}>10/trang</option>
              <option value={20}>20/trang</option>
              <option value={50}>50/trang</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5">
            <p className="text-sm font-bold text-slate-900">Danh sách hồ sơ</p>
            <p className="text-sm font-semibold text-slate-500">{visibleRange}</p>
          </div>

          {loading ? (
            <div className="px-5 py-8 text-sm font-semibold text-slate-400">Đang tải danh sách hồ sơ...</div>
          ) : applications.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <span className="material-symbols-outlined text-[28px]">folder_off</span>
              </div>
              <p className="mt-4 text-lg font-bold text-slate-800">Chưa có hồ sơ phù hợp</p>
              <p className="mt-2 text-sm text-slate-500">Thử đổi trạng thái lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map((candidate) => (
                <article key={candidate.applicationId} className="received-profile-row grid grid-cols-1 gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5 lg:grid-cols-[minmax(0,1fr)_230px_112px] lg:items-center lg:gap-5 lg:px-6">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${candidate.tone}`}>
                      {candidate.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-[15px] font-bold leading-5 text-slate-900">{candidate.name}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-4 ${statusTone[candidate.status] || 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                          {candidate.statusLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-slate-500">{candidate.email || 'Chưa có email'} {candidate.phone ? `• ${candidate.phone}` : ''}</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-slate-700">{candidate.jobTitle}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Nộp: {formatDateTime(candidate.appliedAt)} • {candidate.appliedTimeLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap content-center gap-2 lg:justify-start">
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700">{candidate.jobLevel}</span>
                    <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-[11px] font-semibold text-cyan-700">{candidate.jobType}</span>
                    {candidate.jobLocation && (
                      <span className="rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700">{candidate.jobLocation}</span>
                    )}
                  </div>

                  <div className="flex w-full items-center gap-2 sm:w-auto lg:justify-end">
                    {candidate.cvUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewCv(candidate)}
                        className="inline-flex h-10 min-w-14 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        CV
                      </button>
                    )}
                    <Link
                      to={`/employer-received-cv/${candidate.applicationId}`}
                      className="inline-flex h-10 min-w-[76px] items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5">
            <p className="text-sm font-semibold text-slate-500">Trang {pagination.page} / {totalPages}</p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
        </div>
      </main>

      {previewCv && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {previewCv.name} - {previewCv.jobTitle}
                </p>
                <p className="text-xs text-slate-500">CV ứng tuyển · Preview CV</p>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <a
                  href={toSafeResourceUrl(previewCv.cvUrl) || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                >
                  Mở tab mới
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewCv(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <iframe
              title={`Preview CV ${previewCv.name}`}
              src={toSafeResourceUrl(previewCv.cvUrl) || undefined}
              sandbox="allow-same-origin allow-downloads"
              className="min-h-0 flex-1 border-0 bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  )
}
