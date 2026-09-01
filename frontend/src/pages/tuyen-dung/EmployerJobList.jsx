import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast.jsx'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import EmployerTopBar from '../../components/EmployerTopBar.jsx'
import {
  getCompanyJob,
  getCompanyJobPromotions,
  getCompanyPromotionPlans,
  purchaseCompanyJobPromotion,
} from '../../api/companyService.js'
import { loadEmployerJobApplications, loadEmployerJobsList, updateEmployerJobStatus } from '../../data/apiClient.js'
import { formatDate, statusOptions } from './employerData.js'
import { formatCurrencyVi as formatMoney } from '../../utils/formatters.js'
import { getPromotionTypeLabel } from '../../features/job-promotions/presentation.js'

const defaultJobsPerPage = 10
const pageSizeOptions = [5, 10, 20, 50]

const statusApiMap = {
  'Đang hoạt động': 'open',
  'Bản nháp': 'draft',
  'Tạm dừng': 'paused',
  'Đã đóng': 'closed',
  'Hết hạn': 'expired',
}

const reverseStatusMap = {
  open: 'Đang hoạt động',
  draft: 'Bản nháp',
  paused: 'Tạm dừng',
  closed: 'Đã đóng',
  expired: 'Hết hạn',
}

const editableJobStatuses = [
  { value: 'draft', label: 'Bản nháp' },
  { value: 'open', label: 'Đang hoạt động' },
  { value: 'paused', label: 'Tạm dừng' },
  { value: 'closed', label: 'Đã đóng' },
]

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 1) return [1]
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const filtered = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b)
  const items = []

  for (let index = 0; index < filtered.length; index += 1) {
    const page = filtered[index]
    const previous = filtered[index - 1]
    if (previous && page - previous > 1) items.push('ellipsis')
    items.push(page)
  }

  return items
}

function getJobStatusClass(status) {
  switch (status) {
    case 'Đang hoạt động':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'Bản nháp':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'Tạm dừng':
      return 'border-sky-200 bg-sky-50 text-sky-700'
    case 'Đã đóng':
      return 'border-slate-200 bg-slate-100 text-slate-700'
    case 'Hết hạn':
      return 'border-rose-200 bg-rose-50 text-rose-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600'
  }
}

function getJobModerationState(job) {
  if (job?.moderationStatus === 'blocked') {
    return {
      isBlocked: true,
      label: 'Admin đã chặn',
      description: 'Tin này không hiển thị công khai dù trạng thái tuyển dụng vẫn còn mở.',
      tone: 'border-rose-200 bg-rose-50 text-rose-700',
      iconTone: 'bg-rose-100 text-rose-700',
      icon: 'block',
    }
  }

  return {
    isBlocked: false,
    label: 'Được phép hiển thị',
    description: 'Tin được phép xuất hiện khi trạng thái tuyển dụng phù hợp.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    iconTone: 'bg-emerald-100 text-emerald-700',
    icon: 'verified',
  }
}

function formatCompactTime(value) {
  if (!value) return 'Chưa có cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có cập nhật'
  return date.toLocaleDateString('vi-VN')
}

function getPromotionBlockedReason(job, plans, plansLoading, plansError) {
  if (!job?.backendId) return 'Tin tuyển dụng này chưa có mã backend hợp lệ.'
  if (plansLoading) return 'Hệ thống đang tải danh sách gói quảng cáo. Hãy thử lại sau ít giây.'
  if (plansError) return plansError
  if (!Array.isArray(plans) || plans.length === 0) return 'Hiện chưa có gói quảng cáo khả dụng cho tài khoản này.'
  if (job.moderationStatus === 'blocked') return 'Job này đang bị admin chặn nên không thể mua gói quảng cáo.'
  if (job.rawStatus !== 'open') return 'Chỉ job đang mở tuyển dụng mới có thể mua gói quảng cáo.'

  const deadlineTime = job.deadline ? new Date(job.deadline).getTime() : NaN
  if (!Number.isNaN(deadlineTime) && deadlineTime <= Date.now()) {
    return 'Job này đã hết hạn nên không thể mua gói quảng cáo.'
  }

  return ''
}

function buildStatCards({ jobs, pagination }) {
  const totalApplicants = jobs.reduce((sum, job) => sum + Number(job.applicantsCount || 0), 0)
  const activeJobs = jobs.filter((job) => job.rawStatus === 'open').length
  const blockedJobs = jobs.filter((job) => job.moderationStatus === 'blocked').length
  const totalJobs = Number(pagination.total || jobs.length)

  return [
    {
      title: 'Tổng số Job',
      value: String(totalJobs),
      icon: 'description',
      iconTone: 'bg-blue-50 text-[#2563EB]',
    },
    {
      title: 'Đang đăng tuyển',
      value: String(activeJobs),
      icon: 'campaign',
      iconTone: 'bg-emerald-50 text-[#22C55E]',
    },
    {
      title: 'Tổng ứng viên',
      value: String(totalApplicants),
      icon: 'group',
      iconTone: 'bg-cyan-50 text-cyan-700',
    },
    {
      title: 'Bị admin chặn',
      value: String(blockedJobs),
      icon: 'block',
      iconTone: 'bg-rose-50 text-rose-700',
    },
  ]
}

function MetaBlock({ label, value }) {
  const tone =
    label === 'Ngày đăng'
      ? 'bg-blue-50 text-blue-600'
      : label === 'Hạn chót'
        ? 'bg-amber-50 text-amber-600'
        : 'bg-emerald-50 text-emerald-600'

  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined flex h-6 w-6 items-center justify-center rounded-md text-[15px] ${tone}`}>
          {label === 'Ngày đăng' ? 'calendar_month' : label === 'Hạn chót' ? 'event_busy' : 'group'}
        </span>
        <p className="text-[12px] font-semibold text-slate-500">{label}</p>
      </div>
      <p className="mt-1 text-[12px] font-semibold text-slate-700">{value}</p>
    </div>
  )
}

function JobAttributePill({ icon, value, tone }) {
  if (!value) return null

  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] font-semibold text-slate-700">
      <span className={`material-symbols-outlined flex h-5 w-5 items-center justify-center rounded-md text-[14px] ${tone}`}>
        {icon}
      </span>
      {value}
    </span>
  )
}

function CompactMetaBlock({ label, value, order }) {
  return (
    <div className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-slate-500">{label}</p>
        <span className="text-[11px] font-semibold text-slate-300">{order}</span>
      </div>
      <p className="mt-1.5 text-[12px] font-semibold leading-5 text-slate-700">{value}</p>
    </div>
  )
}

function CompactJobAttributePill({ value }) {
  if (!value) return null

  return (
    <span className="inline-flex min-h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold leading-4 text-slate-700">
      {value}
    </span>
  )
}

function JobActionButton({ icon, label, className, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold whitespace-nowrap transition ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

function PromotionPurchaseModal({ job, plans, isLoadingPlans, submitting, onClose, onSubmit }) {
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?._id || '')
  const [durationDays, setDurationDays] = useState(String(plans[0]?.min_duration_days || 1))

  if (!job) return null

  const selectedPlan = plans.find((plan) => plan._id === selectedPlanId) || plans[0] || null
  const minDays = Number(selectedPlan?.min_duration_days || 1)
  const maxDays = Number(selectedPlan?.max_duration_days || 90)
  const dailyPrice = Number(selectedPlan?.daily_price || 0)
  const totalAmount = Math.max(minDays, Number(durationDays || minDays)) * dailyPrice

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Mua quảng cáo</p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{job.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{job.location || 'Chưa có địa điểm'} • {job.level || 'Chưa có cấp bậc'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit({
                plan_id: selectedPlan?._id,
                duration_days: Number(durationDays || minDays),
              })
            }}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Gói quảng cáo</span>
              <select
                value={selectedPlan?._id || ''}
                onChange={(event) => {
                  const nextPlan = plans.find((plan) => plan._id === event.target.value)
                  setSelectedPlanId(event.target.value)
                  setDurationDays(String(nextPlan?.min_duration_days || 1))
                }}
                disabled={isLoadingPlans || submitting}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-[15px] font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              >
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Số ngày quảng cáo</span>
                <input
                  type="number"
                  min={minDays}
                  max={maxDays}
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  disabled={isLoadingPlans || submitting}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-[15px] font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>

            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              Số tiền sẽ trừ trực tiếp từ ví của tài khoản employer sau khi mua thành công.
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoadingPlans || !selectedPlan || submitting}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận mua'}
              </button>
            </div>
          </form>

          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-base font-bold text-slate-900">Tóm tắt gói mua</h4>
            {isLoadingPlans ? (
              <p className="mt-3 text-sm font-medium text-slate-500">Đang tải bảng giá...</p>
            ) : selectedPlan ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold text-slate-500">Loại gói</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedPlan.name}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold text-slate-500">Đơn giá mỗi ngày</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{formatMoney(selectedPlan.daily_price, selectedPlan.currency)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold text-slate-500">Thời lượng hợp lệ</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedPlan.min_duration_days} - {selectedPlan.max_duration_days} ngày</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Tổng thanh toán</p>
                  <p className="mt-1 text-lg font-extrabold text-emerald-700">{formatMoney(totalAmount, selectedPlan.currency)}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-500">Chưa có plan khả dụng.</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function ApplicantPreviewModal({ job, applications, isLoading, error, onClose, onOpenDetail }) {
  if (!job) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Danh sách hồ sơ</p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{job.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{Number(job.applicantsCount || 0)} ứng viên từ company applications API</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="max-h-[calc(85vh-90px)] overflow-y-auto px-5 py-4">
          {isLoading && <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">Đang tải danh sách ứng viên...</div>}

          {!isLoading && error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {!isLoading && !error && applications.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">
              Job này hiện chưa có hồ sơ nào từ backend.
            </div>
          )}

          {!isLoading && !error && applications.length > 0 && (
            <div className="space-y-3">
              {applications.map((application) => (
                <article key={application.applicationId || application.id} className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold ${application.tone}`}>
                          {application.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{application.name}</p>
                          <p className="truncate text-sm text-slate-500">{application.email || 'Không có email trong snapshot'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {application.statusLabel}
                      </span>
                      <span className="text-xs text-slate-400">{formatCompactTime(application.updatedAt || application.appliedAt)}</span>
                      <button
                        type="button"
                        onClick={() => onOpenDetail(application.applicationId)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-blue-600"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BlockedReasonModal({ jobTitle, reason, isLoading, onClose }) {
  if (!jobTitle) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Lý do admin chặn</p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{jobTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-5 py-4">
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">
              Đang tải lý do chặn...
            </div>
          ) : (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold leading-6 text-rose-700">
              {reason}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EmployerJobList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [jobs, setJobs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState(statusOptions[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultJobsPerPage)
  const [pagination, setPagination] = useState({ page: 1, limit: defaultJobsPerPage, total: 0, total_pages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [highlightId, setHighlightId] = useState(location.state?.createdJobId ?? location.state?.updatedJobId ?? null)
  const [toast, setToast] = useState(location.state?.toast ?? null)
  const [statusUpdatingId, setStatusUpdatingId] = useState('')
  const [previewJob, setPreviewJob] = useState(null)
  const [previewApplications, setPreviewApplications] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [reasonModal, setReasonModal] = useState({ open: false, jobTitle: '', reason: '', loading: false })
  const [promotionPlans, setPromotionPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [plansError, setPlansError] = useState('')
  const [activePromotionsByJobId, setActivePromotionsByJobId] = useState({})
  const [promotionModalJob, setPromotionModalJob] = useState(null)
  const [promotionSubmitting, setPromotionSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await loadEmployerJobsList({
          page: currentPage,
          limit: pageSize,
          status: statusApiMap[status],
          keyword,
        })
        if (!active) return
        setJobs(data.jobs)
        setPagination(data.pagination)
      } catch (loadError) {
        if (!active) return
        setJobs([])
        setPagination({ page: 1, limit: pageSize, total: 0, total_pages: 1 })
        setError(loadError.message || 'Không thể tải danh sách job từ backend.')
      } finally {
        if (active) setIsLoading(false)
      }
    }, keyword.trim() ? 350 : 0)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [currentPage, keyword, pageSize, status])

  useEffect(() => {
    setHighlightId(location.state?.createdJobId ?? location.state?.updatedJobId ?? location.state?.focusJobId ?? null)
  }, [location.state])

  useEffect(() => {
    if (!location.state?.toast) return
    setToast(location.state.toast)

    const { toast: _toast, ...nextState } = location.state
    navigate(location.pathname, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (!highlightId) return undefined
    const timeoutId = window.setTimeout(() => setHighlightId(null), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [highlightId])

  useEffect(() => {
    let active = true

    getCompanyPromotionPlans()
      .then((data) => {
        if (!active) return
        setPromotionPlans(Array.isArray(data?.plans) ? data.plans : [])
        setPlansError('')
      })
      .catch((loadError) => {
        if (!active) return
        setPromotionPlans([])
        setPlansError(loadError.message || 'Kh?ng th? t?i danh s?ch g?i qu?ng c?o.')
      })
      .finally(() => {
        if (active) setPlansLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    getCompanyJobPromotions({
      status: 'active',
      page: 1,
      limit: 100,
    })
      .then((data) => {
        if (!active) return
        const nextMap = {}
        ;(data.items || []).forEach((item) => {
          if (item?.job_id) {
            nextMap[item.job_id] = item
          }
        })
        setActivePromotionsByJobId(nextMap)
      })
      .catch(() => {
        if (active) setActivePromotionsByJobId({})
      })

    return () => {
      active = false
    }
  }, [jobs])

  const currentJobs = jobs
  const statCards = useMemo(() => buildStatCards({ jobs, pagination }), [jobs, pagination])
  const totalJobs = Number(pagination.total || 0)
  const totalPages = Math.max(1, Number(pagination.total_pages || 1))
  const paginationItems = useMemo(() => buildPaginationItems(currentPage, totalPages), [currentPage, totalPages])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleDeleteJob = (job) => {
    setToast({ type: 'info', message: `Backend hiện chưa có API xoá job "${job.title}".` })
  }

  const handleEditJob = (job) => {
    navigate('/employer-post-job', { state: { editJobId: job.backendId || job.id } })
  }

  const handleOpenPromotionPurchase = (job) => {
    const blockedReason = getPromotionBlockedReason(job, promotionPlans, plansLoading, plansError)
    if (blockedReason) {
      setToast({ type: 'error', message: blockedReason })
      return
    }
    setPromotionModalJob(job)
  }

  const handleSubmitPromotionPurchase = async (payload) => {
    if (!promotionModalJob?.backendId) return

    const blockedReason = getPromotionBlockedReason(promotionModalJob, promotionPlans, plansLoading, plansError)
    if (blockedReason) {
      setToast({ type: 'error', message: blockedReason })
      return
    }

    setPromotionSubmitting(true)
    try {
      const result = await purchaseCompanyJobPromotion(promotionModalJob.backendId, payload)
      const promotion = result?.promotion

      if (promotion?.job_id) {
        setActivePromotionsByJobId((current) => ({
          ...current,
          [promotion.job_id]: promotion,
        }))
      }

      setPromotionModalJob(null)
      setToast({
        type: 'success',
        message: `Đã mua quảng cáo cho job "${promotionModalJob.title}".`,
      })

      if (promotion?._id) {
        navigate(`/employer-job-promotions/${promotion._id}`)
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể mua quảng cáo cho job.' })
    } finally {
      setPromotionSubmitting(false)
    }
  }

  const handleJobStatusChange = async (job, nextStatus) => {
    if (!job?.backendId || !nextStatus || nextStatus === job.rawStatus) return

    setStatusUpdatingId(job.id)
    try {
      const updatedJob = await updateEmployerJobStatus(job.backendId, nextStatus)
      const nextModerationStatus = updatedJob?.moderation_status || job.moderationStatus
      setJobs((prev) =>
        prev.map((item) =>
          item.id === job.id
            ? {
                ...item,
                rawStatus: nextStatus,
                status: reverseStatusMap[nextStatus] || item.status,
                moderationStatus: nextModerationStatus || item.moderationStatus,
              }
            : item,
        ),
      )
      setToast({ type: 'success', message: `Đã cập nhật trạng thái job "${job.title}".` })
    } catch (updateError) {
      setToast({ type: 'error', message: updateError.message || 'Không thể cập nhật trạng thái job.' })
    } finally {
      setStatusUpdatingId('')
    }
  }

  const handleOpenPreview = async (job) => {
    setPreviewJob(job)
    setPreviewApplications([])
    setPreviewError('')
    setPreviewLoading(true)

    try {
      const data = await loadEmployerJobApplications({
        jobId: job.backendId || job.id,
        page: 1,
        limit: 20,
      })
      setPreviewApplications(data.applications || [])
    } catch (loadError) {
      setPreviewError(loadError.message || 'Không thể tải danh sách ứng viên.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleOpenBlockedReason = async (job) => {
    if (!job) return

    if (job.blockedReason) {
      setReasonModal({
        open: true,
        jobTitle: job.title,
        reason: job.blockedReason,
        loading: false,
      })
      return
    }

    setReasonModal({
      open: true,
      jobTitle: job.title,
      reason: '',
      loading: true,
    })
    try {
      const response = await getCompanyJob(job.backendId || job.id)
      const blockedReason =
        response?.data?.blocked_reason ||
        response?.blocked_reason ||
        response?.data?.job?.blocked_reason ||
        ''

      setReasonModal({
        open: true,
        jobTitle: job.title,
        reason: blockedReason || 'Admin chưa nhập lý do chặn cho job này.',
        loading: false,
      })

      if (blockedReason) {
        setJobs((prev) =>
          prev.map((item) =>
            item.id === job.id
              ? {
                  ...item,
                  blockedReason,
                }
              : item,
          ),
        )
      }
    } catch {
      setReasonModal({
        open: true,
        jobTitle: job.title,
        reason: 'Không tải được lý do từ backend. Admin có thể chưa nhập lý do chặn cho job này.',
        loading: false,
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardSidebar activeKey="job-list" />
      <ApplicantPreviewModal
        job={previewJob}
        applications={previewApplications}
        isLoading={previewLoading}
        error={previewError}
        onClose={() => setPreviewJob(null)}
        onOpenDetail={(applicationId) => navigate(`/employer-received-cv/${applicationId}`)}
      />
      <BlockedReasonModal
        jobTitle={reasonModal.open ? reasonModal.jobTitle : ''}
        reason={reasonModal.reason}
        isLoading={reasonModal.loading}
        onClose={() => setReasonModal({ open: false, jobTitle: '', reason: '', loading: false })}
      />
      <PromotionPurchaseModal
        job={promotionModalJob}
        plans={promotionPlans}
        isLoadingPlans={plansLoading}
        submitting={promotionSubmitting}
        onClose={() => setPromotionModalJob(null)}
        onSubmit={handleSubmitPromotionPurchase}
      />

      <main className="dashboard-copy-font min-h-screen bg-[#F9FAFB] lg:ml-64">
        <EmployerTopBar />

        <div className="space-y-4 px-4 py-5 lg:space-y-5 lg:px-6 lg:py-8">
          {error && (
            <section className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm">
              {error}
            </section>
          )}

          <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900 sm:text-[32px] lg:text-[36px]">Danh sách công việc</h1>
              <p className="mt-1.5 text-sm text-slate-500">Quản lý trạng thái job và xem hồ sơ ứng viên thật từ backend.</p>
            </div>

            <Link
              to="/employer-post-job"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">add_circle</span>
              Tạo job mới
            </Link>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {statCards.map((card) => (
              <article key={card.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg lg:h-11 lg:w-11 ${card.iconTone}`}>
                  <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:mt-4 lg:text-xs">{card.title}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 lg:mt-1.5 lg:text-3xl">{card.value}</p>
              </article>
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_220px_280px]">
              <label className="relative block">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Tìm kiếm tên công việc..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-12 pr-4 text-[15px] outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="relative">
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value)
                    setCurrentPage(1)
                  }}
                  className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-4 text-[15px] outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                >
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">expand_more</span>
              </div>

              <label className="flex h-11 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                <span className="shrink-0 whitespace-nowrap">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value))
                    setCurrentPage(1)
                  }}
                  className="h-full w-[170px] shrink-0 bg-transparent px-2 text-left text-sm font-semibold text-slate-700 outline-none"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}/trang
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-2.5">
            {isLoading && (
              <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-400 shadow-sm">
                Đang tải danh sách job từ backend...
              </div>
            )}

            {!isLoading && currentJobs.length === 0 && (
              <section className="rounded-lg border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
                <div className="mx-auto flex max-w-md flex-col items-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <span className="material-symbols-outlined text-[28px]">work_off</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">Không tìm thấy công việc phù hợp</p>
                  <p className="mt-2 text-sm text-slate-500">API employer jobs hiện chỉ hỗ trợ lọc theo keyword và trạng thái, nên các bộ lọc khác đã được bỏ.</p>
                </div>
              </section>
            )}

            {currentJobs.map((job) => {
              const isNew = highlightId === job.id
              const moderationState = getJobModerationState(job)
              const activePromotion = activePromotionsByJobId[job.backendId || job.id]

              return (
                <article
                  key={job.id}
                  className={`rounded-lg border px-4 py-4 shadow-sm transition lg:px-5 ${
                    moderationState.isBlocked
                      ? 'border-rose-200 bg-rose-50/35 hover:border-rose-300'
                      : isNew
                        ? 'border-blue-200 bg-white shadow-blue-100/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-[17px] font-extrabold tracking-tight text-slate-900 sm:text-[18px]">{job.title}</h3>
                            {isNew && (
                              <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-blue-700">
                                Mới
                              </span>
                            )}
                            {activePromotion && (
                              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                                Đang được quảng cáo
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <CompactJobAttributePill value={job.department} />
                            <CompactJobAttributePill value={job.type} />
                            <CompactJobAttributePill value={job.location} />
                          </div>
                        </div>

                        <div className="flex w-full flex-row flex-wrap items-center gap-2 sm:w-auto sm:flex-col sm:items-end">
                          <div className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[11px] font-semibold ${moderationState.tone}`}>
                            <span className={`material-symbols-outlined rounded-md text-[14px] ${moderationState.iconTone}`}>{moderationState.icon}</span>
                            {moderationState.label}
                          </div>
                          <div className={`inline-flex rounded-lg border px-3 py-1 text-[11px] font-semibold ${getJobStatusClass(job.status)}`}>
                            Tuyển dụng: {job.status}
                          </div>
                        </div>
                      </div>

                      {moderationState.isBlocked && (
                        <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-[12px] font-semibold leading-5 text-rose-700 sm:flex-row sm:items-center sm:justify-between">
                          <span>{moderationState.description}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenBlockedReason(job)}
                            className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-700 transition hover:bg-rose-100"
                          >
                            <span className="material-symbols-outlined mr-1 text-[14px]">info</span>
                            Xem lý do
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                        <CompactMetaBlock label="Ngày đăng" value={formatDate(job.postedAt)} order="01" />
                        <CompactMetaBlock label="Hạn chót" value={formatDate(job.deadline)} order="02" />
                        <CompactMetaBlock label="Ứng viên" value={`${Number(job.applicantsCount || 0)} hồ sơ`} order="03" />
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex -space-x-2">
                              {job.applicants.length > 0 ? (
                                job.applicants.slice(0, 3).map((applicant) => (
                                  <div
                                    key={`${job.id}-${applicant.applicationId || applicant.name}`}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold shadow-sm ${applicant.tone}`}
                                    title={applicant.name}
                                  >
                                    {applicant.initials}
                                  </div>
                                ))
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-bold text-slate-500 shadow-sm">
                                  0
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-slate-500">Hồ sơ gần nhất</p>
                              <p className="mt-1 truncate text-[13px] font-semibold text-slate-700">
                                {job.latestApplication ? job.latestApplication.name : 'Chưa có ứng viên'}
                              </p>
                              <p className="mt-0.5 text-[12px] text-slate-500">
                                {job.latestApplication
                                  ? `${job.latestApplication.statusLabel} • ${formatCompactTime(job.latestApplication.updatedAt || job.latestApplication.appliedAt)}`
                                  : 'Khi có hồ sơ mới, hệ thống sẽ hiển thị ở đây.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 lg:flex lg:min-w-[520px] lg:flex-nowrap">
                            <JobActionButton
                              icon="groups"
                              label="Danh sách hồ sơ"
                              onClick={() => handleOpenPreview(job)}
                              className="border-blue-100 bg-blue-50 text-blue-700 hover:border-blue-200 hover:bg-blue-100 lg:flex-1"
                            />
                            <JobActionButton
                              icon="edit"
                              label="Chỉnh sửa"
                              onClick={() => handleEditJob(job)}
                              className="border-amber-100 bg-amber-50 text-amber-700 hover:border-amber-200 hover:bg-amber-100 lg:flex-1"
                            />
                            <JobActionButton
                              icon={activePromotion ? 'rocket_launch' : 'local_fire_department'}
                              label={activePromotion ? 'Xem quảng cáo' : 'Mua quảng cáo'}
                              onClick={() => {
                                if (activePromotion?._id) {
                                  navigate(`/employer-job-promotions/${activePromotion._id}`)
                                  return
                                }
                                handleOpenPromotionPurchase(job)
                              }}
                              className="border-violet-100 bg-violet-50 text-violet-700 hover:border-violet-200 hover:bg-violet-100 lg:flex-1"
                            />
                            <JobActionButton
                              icon="delete"
                              label="Xóa"
                              onClick={() => handleDeleteJob(job)}
                              className="border-rose-100 bg-rose-50 text-rose-700 hover:border-rose-200 hover:bg-rose-100 lg:flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside className="w-full xl:w-[220px]">
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[12px] font-semibold text-slate-500">Cập nhật trạng thái</p>
                          {statusUpdatingId === job.id && <span className="text-[11px] font-medium text-blue-600">Đang lưu...</span>}
                        </div>

                        {moderationState.isBlocked && (
                          <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold leading-4 text-rose-700">
                            Quyền hiển thị đang bị admin khóa. Các nút dưới đây chỉ đổi trạng thái tuyển dụng nội bộ.
                          </div>
                        )}

                        {activePromotion ? (
                          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold leading-4 text-emerald-700">
                            Gói {getPromotionTypeLabel(activePromotion.type)} đang chạy đến {formatDate(activePromotion.ends_at)}.
                          </div>
                        ) : null}

                        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                          {editableJobStatuses.map((item) => {
                            const active = (job.rawStatus || 'draft') === item.value

                            return (
                              <button
                                key={item.value}
                                type="button"
                                disabled={statusUpdatingId === job.id || job.rawStatus === 'expired' || active}
                                onClick={() => handleJobStatusChange(job, item.value)}
                                className={`inline-flex h-9 items-center justify-between rounded-lg border px-3 text-[13px] font-semibold transition ${
                                  active
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                                } disabled:cursor-not-allowed disabled:opacity-100`}
                              >
                                <span>{item.label}</span>
                                {active && <span className="material-symbols-outlined text-[16px]">check</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </aside>
                  </div>
                </article>
              )
            })}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm lg:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Tổng số công việc: {totalJobs}</p>

              <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-10 min-w-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {paginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm font-semibold text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-10 min-w-[44px] rounded-lg border px-3 text-sm font-semibold transition ${
                        currentPage === item
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-10 min-w-[88px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
