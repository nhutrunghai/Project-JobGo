import { useEffect, useMemo, useState } from 'react'
import DashboardSidebar from '../components/DashboardSidebar.jsx'
import Toast from '../components/Toast.jsx'
import { deleteUserUploadedCv, loadUserUploadedCvs, uploadUserResume } from '../data/apiClient.js'
import { toSafeResourceUrl } from '../utils/safeUrl.js'

function formatDateTime(value) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật'
  return date.toLocaleDateString('vi-VN')
}

function getStatusLabel(status) {
  switch (status) {
    case 'active':
      return 'Đang sử dụng'
    case 'archived':
      return 'Đã lưu trữ'
    default:
      return status || 'Chưa cập nhật'
  }
}

export default function UploadedCvs() {
  const [cvs, setCvs] = useState([])
  const [keyword, setKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewCv, setPreviewCv] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState('')
  const [uploadIsDefault, setUploadIsDefault] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState(null)

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await loadUserUploadedCvs()
      setCvs(data || [])
    } catch (loadError) {
      setError(loadError.message || 'Không thể tải danh sách CV.')
      setCvs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    return () => {
      if (uploadPreviewUrl) {
        URL.revokeObjectURL(uploadPreviewUrl)
      }
    }
  }, [uploadPreviewUrl])

  const filteredCvs = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return cvs
    return cvs.filter((item) =>
      `${item.title} ${item.fileType} ${getStatusLabel(item.status)}`.toLowerCase().includes(q),
    )
  }, [cvs, keyword])

  const stats = useMemo(() => {
    const total = cvs.length
    const defaultCount = cvs.filter((item) => item.isDefault).length
    const activeCount = cvs.filter((item) => item.status === 'active').length
    const archivedCount = cvs.filter((item) => item.status === 'archived').length
    return { total, defaultCount, activeCount, archivedCount }
  }, [cvs])

  const handleDelete = async (cv) => {
    setDeletingId(cv.id)
    setError('')
    try {
      await deleteUserUploadedCv(cv.id)
      setCvs((current) => current.filter((item) => item.id !== cv.id))
      setDeleteTarget(null)
      setToast({ type: 'success', message: 'Xóa CV thành công.' })
    } catch (deleteError) {
      const message = deleteError.message || 'Không thể xóa CV.'
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      setDeletingId('')
    }
  }

  const resetUploadForm = () => {
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl)
    }
    setUploadTitle('')
    setUploadFile(null)
    setUploadPreviewUrl('')
    setUploadIsDefault(false)
    setUploadProgress(0)
  }

  const closeUploadModal = () => {
    if (isUploading) return
    setUploadOpen(false)
    resetUploadForm()
  }

  const handleSelectUploadFile = (event) => {
    const file = event.target.files?.[0] || null
    if (uploadPreviewUrl) {
      URL.revokeObjectURL(uploadPreviewUrl)
    }
    setUploadFile(file)
    setUploadProgress(0)

    if (!file) {
      setUploadPreviewUrl('')
      return
    }

    setUploadPreviewUrl(URL.createObjectURL(file))
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    setIsUploading(true)
    setError('')
    setUploadProgress(0)

    try {
      const createdCv = await uploadUserResume({
        title: uploadTitle,
        file: uploadFile,
        isDefault: uploadIsDefault,
        onProgress: setUploadProgress,
      })
      setCvs((current) => [
        createdCv,
        ...current.map((item) => (createdCv.isDefault ? { ...item, isDefault: false } : item)),
      ])
      setToast({ type: 'success', message: 'Upload CV thành công.' })
      setUploadOpen(false)
      resetUploadForm()
    } catch (uploadError) {
      setToast({ type: 'error', message: uploadError.message || 'Không thể upload CV.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="bg-[#f7f9fc] text-on-surface">
      <DashboardSidebar activeKey="uploaded-cvs" />
      <main className="lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm">
              <span className="material-symbols-outlined text-[18px]">description</span>
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold leading-none tracking-tight text-slate-900">Thư viện CV</h1>
              <p className="mt-1 text-sm text-slate-500">Danh sách CV đã lưu từ API /user/resumes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Upload CV
          </button>
        </header>

        <div className="p-5">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Tổng CV', value: stats.total, icon: 'folder_open', tone: 'bg-blue-100 text-blue-600' },
              { label: 'CV mặc định', value: stats.defaultCount, icon: 'star', tone: 'bg-amber-100 text-amber-600' },
              { label: 'Đang sử dụng', value: stats.activeCount, icon: 'task_alt', tone: 'bg-emerald-100 text-emerald-600' },
              { label: 'Đã lưu trữ', value: stats.archivedCount, icon: 'inventory_2', tone: 'bg-violet-100 text-violet-600' },
            ].map((card) => (
              <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[15px] font-semibold text-slate-700">{card.label}</p>
                    <p className="mt-1.5 text-[30px] font-extrabold leading-none text-slate-900">{card.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}>
                    <span className="material-symbols-outlined text-[22px]">{card.icon}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">CV đã tải lên</h2>
                  <p className="mt-1 text-sm text-slate-500">Hiển thị các trường backend đang cung cấp.</p>
                </div>
                <div className="relative w-full lg:w-[360px]">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-slate-400">search</span>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="Tìm theo tên CV..."
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-5 mt-5 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-4 p-5">
              {isLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                  Đang tải danh sách CV...
                </div>
              )}

              {!isLoading && filteredCvs.map((cv) => (
                <article key={cv.id} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[18px] font-bold text-slate-900">{cv.title}</h3>
                        {cv.isDefault && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">CV mặc định</span>}
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{getStatusLabel(cv.status)}</span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Định dạng</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{cv.fileType}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Tạo lúc</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{formatDateTime(cv.createdAt)}</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Cập nhật</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{formatDateTime(cv.updatedAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid min-w-[220px] grid-cols-2 gap-3 xl:w-[250px] xl:grid-cols-1">
                      {cv.cvUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewCv(cv)}
                          className="col-span-2 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 xl:col-span-1"
                        >
                          Xem CV
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="col-span-2 inline-flex h-11 items-center justify-center rounded-lg bg-slate-200 px-4 text-sm font-bold text-slate-500 xl:col-span-1"
                        >
                          Chưa có file
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cv)}
                        disabled={deletingId === cv.id}
                        className="col-span-2 inline-flex h-11 items-center justify-center rounded-lg border border-rose-200 bg-white px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 xl:col-span-1"
                      >
                        {deletingId === cv.id ? 'Đang xóa...' : 'Xóa CV'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {!isLoading && filteredCvs.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    {keyword.trim() ? 'Không tìm thấy CV phù hợp với từ khóa hiện tại.' : 'Bạn chưa tải CV nào lên.'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Khi có API upload hoặc màn tạo CV hoàn chỉnh, danh sách sẽ hiển thị tại đây.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {previewCv && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{previewCv.title}</p>
                <p className="text-xs text-slate-500">{previewCv.fileType} · Preview CV</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={toSafeResourceUrl(previewCv.cvUrl) || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              title={`Preview ${previewCv.title}`}
              src={toSafeResourceUrl(previewCv.cvUrl) || undefined}
              sandbox="allow-same-origin allow-downloads"
              className="min-h-0 flex-1 border-0 bg-slate-100"
            />
          </div>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <form onSubmit={handleUpload} className="mx-auto grid h-full max-w-6xl grid-cols-1 overflow-hidden rounded-xl bg-white shadow-2xl lg:grid-cols-[420px_1fr]">
            <div className="flex min-h-0 flex-col border-r border-slate-200">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">Upload CV mới</h2>
                <p className="mt-1 text-sm text-slate-500">Chọn file, kiểm tra preview rồi lưu vào thư viện CV.</p>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Tên CV</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    value={uploadTitle}
                    onChange={(event) => setUploadTitle(event.target.value)}
                    placeholder="Ví dụ: CV Backend Node.js"
                    disabled={isUploading}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">File CV</span>
                  <input
                    className="mt-2 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleSelectUploadFile}
                    disabled={isUploading}
                  />
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={uploadIsDefault}
                    onChange={(event) => setUploadIsDefault(event.target.checked)}
                    disabled={isUploading}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">Đặt làm CV mặc định</span>
                </label>

                {uploadFile && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">File đã chọn</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">{uploadFile.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}

                {isUploading && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Đang upload</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 p-4">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={isUploading}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? 'Đang upload...' : 'Upload CV'}
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-col bg-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-bold text-slate-900">Preview file</p>
                <button
                  type="button"
                  onClick={closeUploadModal}
                  disabled={isUploading}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              {uploadPreviewUrl ? (
              <iframe
                title="Preview CV upload"
                src={toSafeResourceUrl(uploadPreviewUrl) || undefined}
                sandbox="allow-same-origin allow-downloads"
                className="min-h-0 flex-1 border-0 bg-white"
              />
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-center">
                  <div>
                    <span className="material-symbols-outlined text-[44px] text-slate-300">description</span>
                    <p className="mt-2 text-sm font-semibold text-slate-600">Chưa chọn file CV</p>
                    <p className="mt-1 text-sm text-slate-400">PDF có thể preview trực tiếp; DOC/DOCX tùy trình duyệt hỗ trợ.</p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <span className="material-symbols-outlined text-[22px]">delete</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900">Xóa CV khỏi hệ thống?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  CV <span className="font-semibold text-slate-900">"{deleteTarget.title}"</span> sẽ bị xóa khỏi thư viện của bạn. Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                disabled={deletingId === deleteTarget.id}
                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === deleteTarget.id ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

