import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import EmployerTopBar from '../../components/EmployerTopBar.jsx'
import Toast from '../../components/Toast.jsx'
import { loadEmployerApplicationDetail, updateEmployerApplicationStatus } from '../../data/apiClient.js'
import { toSafeImageUrl, toSafeResourceUrl } from '../../utils/safeUrl.js'

const statusOptions = [
  { value: 'reviewing', label: 'Đang xem xét' },
  { value: 'shortlisted', label: 'Tiềm năng' },
  { value: 'interviewing', label: 'Phỏng vấn' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'hired', label: 'Đã nhận' },
]

const allowedTransitions = {
  submitted: ['reviewing', 'shortlisted', 'interviewing', 'rejected', 'hired'],
  reviewing: ['shortlisted', 'interviewing', 'rejected', 'hired'],
  shortlisted: ['interviewing', 'rejected', 'hired'],
  interviewing: ['rejected', 'hired'],
  rejected: [],
  hired: [],
  withdrawn: [],
}

const statusTone = {
  submitted: 'border-violet-100 bg-violet-50 text-violet-700',
  reviewing: 'border-blue-100 bg-blue-50 text-blue-700',
  shortlisted: 'border-cyan-100 bg-cyan-50 text-cyan-700',
  interviewing: 'border-amber-100 bg-amber-50 text-amber-700',
  rejected: 'border-rose-100 bg-rose-50 text-rose-700',
  hired: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-600',
}

function Badge({ children, tone }) {
  return <span className={`inline-flex rounded-lg border px-3 py-1 text-sm font-semibold ${tone}`}>{children}</span>
}

function formatDateTime(value) {
  if (!value) return 'Chưa có dữ liệu'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu'
  return date.toLocaleString('vi-VN')
}

function getCandidateName(detail) {
  return detail?.resumeSnapshot?.full_name || detail?.candidate?.full_name || 'Ứng viên chưa đặt tên'
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'UV'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase()
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-blue-600">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 break-words text-sm font-bold text-slate-800">{value || 'Chưa có dữ liệu'}</p>
    </div>
  )
}

export default function EmployerCandidateDetail() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [nextStatus, setNextStatus] = useState('')
  const [previewCvOpen, setPreviewCvOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!applicationId) return

    let active = true
    setLoading(true)
    loadEmployerApplicationDetail(applicationId)
      .then((data) => {
        if (!active) return
        setDetail(data)
        setNextStatus((allowedTransitions[data.status] || [])[0] || '')
      })
      .catch((error) => {
        if (!active) return
        setToast({ type: 'error', message: error.message || 'Không thể tải hồ sơ ứng viên.' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [applicationId])

  const candidateName = getCandidateName(detail)
  const candidateAvatar = toSafeImageUrl(detail?.candidate?.avatar)
  const availableStatusOptions = useMemo(() => {
    if (!detail) return []
    const allowed = allowedTransitions[detail.status] || []
    return statusOptions.filter((item) => allowed.includes(item.value))
  }, [detail])

  const handleStatusUpdate = async () => {
    if (!applicationId || !nextStatus || !detail) return

    setUpdatingStatus(true)
    try {
      await updateEmployerApplicationStatus(applicationId, nextStatus)
      const fresh = await loadEmployerApplicationDetail(applicationId)
      setDetail(fresh)
      setNextStatus((allowedTransitions[fresh.status] || [])[0] || '')
      setToast({ type: 'success', message: 'Đã cập nhật trạng thái ứng viên.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể cập nhật trạng thái.' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="dashboard-copy-font min-h-screen bg-[#F9FAFB] text-slate-900">
      <DashboardSidebar activeKey="received-cv" />
      <main className="min-h-screen bg-[#F9FAFB] lg:ml-64">
        <EmployerTopBar />
        <div className="px-4 py-5 lg:px-6 lg:py-7">
        <Toast toast={toast} onClose={() => setToast(null)} />

        <section className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Hồ sơ đã nhận</p>
            <h1 className="mt-1 text-[34px] font-extrabold tracking-tight text-slate-950">Chi tiết ứng viên</h1>
            <p className="mt-2 text-sm text-slate-500">Xem hồ sơ, CV và cập nhật trạng thái tuyển dụng.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <span className="material-symbols-outlined mr-2 text-[18px]">arrow_back</span>
              Quay lại
            </button>
            <Link
              to="/employer-received-cv"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Danh sách hồ sơ
            </Link>
          </div>
        </section>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
            Đang tải dữ liệu ứng viên...
          </div>
        ) : !detail ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-8 text-center text-sm font-semibold text-rose-700 shadow-sm">
            Không tìm thấy hồ sơ ứng viên. Vui lòng kiểm tra lại liên kết hoặc quay lại danh sách.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="space-y-5">
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    {candidateAvatar ? (
                      <img
                        src={candidateAvatar}
                        alt={candidateName}
                        className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg font-extrabold text-blue-700">
                        {getInitials(candidateName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-[26px] font-extrabold tracking-tight text-slate-950">{candidateName}</h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Ứng tuyển vào <span className="font-semibold text-slate-800">{detail.job?.title || 'Không rõ vị trí'}</span>
                      </p>
                      <div className="mt-3">
                        <Badge tone={statusTone[detail.status] || 'border-slate-200 bg-slate-100 text-slate-600'}>
                          {detail.statusLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {detail.resumeSnapshot?.cv_url && (
                    <button
                      type="button"
                      onClick={() => setPreviewCvOpen(true)}
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <span className="material-symbols-outlined mr-2 text-[18px]">visibility</span>
                      Xem CV
                    </button>
                  )}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <InfoTile icon="mail" label="Email" value={detail.resumeSnapshot?.email} />
                  <InfoTile icon="call" label="Điện thoại" value={detail.resumeSnapshot?.phone} />
                  <InfoTile icon="event" label="Ngày nộp" value={formatDateTime(detail.appliedAt)} />
                  <InfoTile icon="update" label="Cập nhật gần nhất" value={formatDateTime(detail.updatedAt)} />
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900">Thư giới thiệu</h3>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {detail.coverLetter || 'Ứng viên chưa gửi thư giới thiệu cho hồ sơ này.'}
                </p>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900">Kỹ năng trong hồ sơ</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.isArray(detail.resumeSnapshot?.skills) && detail.resumeSnapshot.skills.length > 0 ? (
                    detail.resumeSnapshot.skills.map((skill) => (
                      <span key={skill} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Chưa có dữ liệu kỹ năng trong snapshot hồ sơ.</p>
                  )}
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900">File CV</h3>
                {detail.resumeSnapshot?.cv_url ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 break-all text-sm font-semibold text-slate-700">{detail.resumeSnapshot.cv_url}</p>
                    <button
                      type="button"
                      onClick={() => setPreviewCvOpen(true)}
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Preview
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Chưa có dữ liệu CV.</p>
                )}
              </article>
            </section>

            <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900">Cập nhật trạng thái</h3>
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Hiện tại</p>
                  <div className="mt-2">
                    <Badge tone={statusTone[detail.status] || 'border-slate-200 bg-slate-100 text-slate-600'}>
                      {detail.statusLabel}
                    </Badge>
                  </div>
                </div>

                {availableStatusOptions.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-slate-700">Trạng thái tiếp theo</span>
                      <select
                        value={nextStatus}
                        onChange={(event) => setNextStatus(event.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      >
                        {availableStatusOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus || !nextStatus}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingStatus ? 'Đang cập nhật...' : 'Lưu trạng thái'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Hồ sơ đang ở trạng thái kết thúc hoặc đã rút, không còn bước chuyển tiếp hợp lệ.
                  </div>
                )}
              </article>

              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900">Luồng trạng thái</h3>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Trạng thái chỉ được đi tiếp theo đúng thứ tự backend cho phép.</p>
                  <div className="flex flex-wrap gap-2">
                    {availableStatusOptions.length > 0 ? (
                      availableStatusOptions.map((item) => (
                        <span key={item.value} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {item.label}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        Không còn bước tiếp theo
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </aside>
          </div>
        )}
        </div>
      </main>

      {previewCvOpen && detail?.resumeSnapshot?.cv_url && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {candidateName} - {detail.job?.title || 'CV ứng tuyển'}
                </p>
                <p className="text-xs text-slate-500">CV ứng tuyển · Preview CV</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={toSafeResourceUrl(detail.resumeSnapshot.cv_url) || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Mở tab mới
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewCvOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <iframe
              title={`Preview CV ${candidateName}`}
              src={toSafeResourceUrl(detail.resumeSnapshot.cv_url) || undefined}
              sandbox="allow-same-origin allow-downloads"
              className="min-h-0 flex-1 border-0 bg-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  )
}
