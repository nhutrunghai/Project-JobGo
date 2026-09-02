import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Toast from '../../components/Toast.jsx'
import DashboardSidebar from '../../components/DashboardSidebar.jsx'
import EmployerTopBar from '../../components/EmployerTopBar.jsx'
import RichTextContent from '../../components/RichTextContent.jsx'
import RichTextEditor from '../../components/RichTextEditor.jsx'
import { createCompanyJob, getCompanyJob, getJobCategories, updateCompanyJob } from '../../api/companyService.js'

const jobTypeOptions = [
  { value: 'full-time', label: 'Toàn thời gian', icon: 'business_center', tone: 'bg-blue-50 text-blue-600' },
  { value: 'part-time', label: 'Bán thời gian', icon: 'schedule', tone: 'bg-sky-50 text-sky-600' },
  { value: 'internship', label: 'Thực tập', icon: 'school', tone: 'bg-emerald-50 text-emerald-600' },
  { value: 'contract', label: 'Hợp đồng', icon: 'contract', tone: 'bg-amber-50 text-amber-600' },
  { value: 'remote', label: 'Remote', icon: 'laptop_mac', tone: 'bg-violet-50 text-violet-600' },
]

const levelOptions = [
  { value: 'intern', label: 'Intern' },
  { value: 'fresher', label: 'Fresher' },
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
]

const defaultSteps = [
  { id: 1, label: 'Thông tin chung' },
  { id: 2, label: 'Yêu cầu và quyền lợi' },
  { id: 3, label: 'Xem trước và đăng' },
]

const STANDARD_POSTING_OPTION = 'Đăng thường'

const emptyForm = {
  title: '',
  location: '',
  categoryIds: [],
  level: 'senior',
  jobType: 'full-time',
  quantity: '1',
  salaryMin: '',
  salaryMax: '',
  currency: 'VND',
  negotiable: false,
  description: '',
  requirements: '',
  benefits: '',
  skillsText: '',
  deadline: '',
  packageType: STANDARD_POSTING_OPTION,
}

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function normalizeLevel(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return levelOptions.some((item) => item.value === normalized) ? normalized : 'senior'
}

function normalizeJobType(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (jobTypeOptions.some((item) => item.value === normalized)) return normalized
  if (normalized.includes('remote')) return 'remote'
  return 'full-time'
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getRichTextPlainText(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function mapInitialForm(initialForm = {}) {
  return {
    ...emptyForm,
    title: initialForm.title || '',
    location: initialForm.location || '',
    categoryIds: Array.isArray(initialForm.category_ids) ? initialForm.category_ids.map(String) : [],
    level: normalizeLevel(initialForm.level),
    jobType: normalizeJobType(initialForm.job_type || initialForm.workMode),
    quantity: String(initialForm.openings || initialForm.quantity || 1),
    salaryMin: String(initialForm.salary?.min ?? initialForm.salaryMin ?? ''),
    salaryMax: String(initialForm.salary?.max ?? initialForm.salaryMax ?? ''),
    currency: initialForm.salary?.currency || initialForm.currency || 'VND',
    negotiable: Boolean(initialForm.salary?.is_negotiable ?? initialForm.negotiable),
    description: initialForm.description || '',
    requirements: initialForm.requirements || '',
    benefits: initialForm.benefits || '',
    skillsText: Array.isArray(initialForm.skills) ? initialForm.skills.join(', ') : initialForm.skillsText || '',
    deadline: toDateInput(initialForm.expired_at || initialForm.deadline),
    // A newly created job must never be pre-selected for a paid promotion.
    // Promotions are purchased separately after the job has been created.
    packageType: STANDARD_POSTING_OPTION,
  }
}

function mapJobToForm(job = {}, packageType = emptyForm.packageType) {
  return {
    ...emptyForm,
    title: job.title || '',
    location: job.location || '',
    categoryIds: Array.isArray(job.category_ids) ? job.category_ids.map(String) : [],
    level: normalizeLevel(job.level),
    jobType: normalizeJobType(job.job_type),
    quantity: String(job.quantity || 1),
    salaryMin: String(job.salary?.min ?? ''),
    salaryMax: String(job.salary?.max ?? ''),
    currency: job.salary?.currency || 'VND',
    negotiable: Boolean(job.salary?.is_negotiable),
    description: job.description || '',
    requirements: job.requirements || '',
    benefits: job.benefits || '',
    skillsText: Array.isArray(job.skills) ? job.skills.join(', ') : '',
    deadline: toDateInput(job.expired_at),
    packageType,
  }
}

function buildJobPayload(form, status) {
  const salary = {
    currency: form.currency,
    is_negotiable: Boolean(form.negotiable),
  }

  if (!form.negotiable) {
    salary.min = Number(form.salaryMin)
    salary.max = Number(form.salaryMax)
  }

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    requirements: form.requirements.trim(),
    benefits: form.benefits.trim(),
    salary,
    location: form.location.trim(),
    job_type: form.jobType,
    level: form.level,
    status,
    category_ids: form.categoryIds,
    skills: splitList(form.skillsText),
    quantity: Number(form.quantity || 1),
    expired_at: new Date(form.deadline).toISOString(),
  }
}

function validateForm(form) {
  if (!form.title.trim()) return 'Vui lòng nhập tiêu đề công việc.'
  if (!form.location.trim()) return 'Vui lòng nhập địa điểm.'
  if (!Array.isArray(form.categoryIds) || form.categoryIds.length < 1) return 'Vui lòng chọn ít nhất một danh mục.'
  if (form.categoryIds.length > 5) return 'Chỉ được chọn tối đa 5 danh mục.'
  if (!splitList(form.skillsText).length) return 'Vui lòng nhập ít nhất một kỹ năng.'
  if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 1) return 'Số lượng tuyển phải lớn hơn 0.'
  if (!form.negotiable) {
    if (form.salaryMin === '' || form.salaryMax === '') return 'Vui lòng nhập khoảng lương hoặc bật thỏa thuận.'
    if (Number(form.salaryMax) < Number(form.salaryMin)) return 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.'
  }
  if (!form.deadline || new Date(form.deadline).getTime() <= Date.now()) return 'Hạn ứng tuyển phải là ngày trong tương lai.'
  if (getRichTextPlainText(form.description).length < 2) return 'Mô tả công việc cần ít nhất 2 ký tự.'
  if (getRichTextPlainText(form.requirements).length < 2) return 'Yêu cầu công việc cần ít nhất 2 ký tự.'
  if (getRichTextPlainText(form.benefits).length < 2) return 'Quyền lợi cần ít nhất 2 ký tự.'
  return ''
}

function FieldLabel({ icon, label }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="material-symbols-outlined flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[16px] text-slate-500">
        {icon}
      </span>
      {label}
    </div>
  )
}

function SectionBlock({ title, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <h2 className="mb-4 text-base font-bold text-slate-900 lg:text-lg">{title}</h2>
      {children}
    </section>
  )
}

function DetailSection({ title, icon, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[18px] text-blue-600">
          {icon}
        </span>
        <h3 className="text-base font-bold text-slate-900 lg:text-lg">{title}</h3>
      </div>
      <div className="space-y-2 text-sm leading-6 text-slate-600">{children}</div>
    </section>
  )
}

function CategoryTreeNode({ category, depth = 0, selectedIds, onToggle }) {
  const checked = selectedIds.includes(category.id)
  const hasChildren = Array.isArray(category.children) && category.children.length > 0

  return (
    <div className={depth ? 'ml-4 border-l border-slate-200 pl-3' : ''}>
      <button
        type="button"
        onClick={() => onToggle(category.id)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
          checked
            ? 'border-blue-200 bg-blue-50 text-blue-700 ring-1 ring-blue-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/60'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {depth > 0 ? <span className="h-px w-3 bg-slate-300" /> : null}
          <span className="truncate">{category.label}</span>
          {hasChildren ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {category.children.length} danh mục con
            </span>
          ) : null}
        </span>
        <span className={`material-symbols-outlined text-[18px] ${checked ? 'text-blue-600' : 'text-slate-300'}`}>
          {checked ? 'check_circle' : 'radio_button_unchecked'}
        </span>
      </button>

      {hasChildren ? (
        <div className="mt-2 space-y-2">
          {category.children.map((child) => (
            <CategoryTreeNode key={child.id} category={child} depth={depth + 1} selectedIds={selectedIds} onToggle={onToggle} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SmallPreviewCard({ form, selectedJobType, selectedLevel, salaryLabel }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
      <h2 className="text-base font-bold text-slate-900 lg:text-lg">Xem trước nhanh</h2>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-950 lg:text-lg">{form.title || 'Tiêu đề công việc'}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                {selectedLevel.label}
              </span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {selectedJobType.label}
              </span>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {form.packageType}
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-rose-500">location_on</span>
            {form.location || 'Địa điểm'}
          </p>
          <p className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-amber-500">payments</span>
            {salaryLabel}
          </p>
          <p className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[17px] text-cyan-600">group_add</span>
            {form.quantity || 1} vị trí
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {splitList(form.skillsText).slice(0, 5).map((skill) => (
            <span key={skill} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function EmployerRecruitmentDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const editJobId = location.state?.editJobId || ''
  const isEditing = Boolean(editJobId)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [form, setForm] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [savingStatus, setSavingStatus] = useState('')
  const [toast, setToast] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [vietnamLocations, setVietnamLocations] = useState({ provinces: [], wards: [] })
  const [locationsLoading, setLocationsLoading] = useState(false)

  const ensureVietnamLocations = async () => {
    if (locationsLoading || vietnamLocations.provinces.length || vietnamLocations.wards.length) return
    setLocationsLoading(true)
    try {
      const module = await import('vietnam-address-database')
      const database = module.default || module
      const tables = Object.fromEntries(database.filter((item) => item.type === 'table').map((item) => [item.name, item.data]))
      setVietnamLocations({ provinces: tables.provinces || [], wards: tables.wards || [] })
    } catch {
      setVietnamLocations({ provinces: [], wards: [] })
    } finally {
      setLocationsLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const loadData = async () => {
      const categoriesResponse = await getJobCategories().catch(() => [])

      if (!active) return
      setCategoryOptions(Array.isArray(categoriesResponse) ? categoriesResponse : [])

      if (editJobId) {
        const response = await getCompanyJob(editJobId)
        if (!active) return
        setForm(mapJobToForm(response?.data || {}, STANDARD_POSTING_OPTION))
        return
      }

      setForm(mapInitialForm())
    }

    loadData().catch((error) => {
      if (!active) return
      setForm(mapInitialForm({}))
      setToast({ type: 'error', message: error.message || 'Không thể tải dữ liệu đăng job.' })
    })

    return () => {
      active = false
    }
  }, [editJobId])

  const selectedJobType = useMemo(() => jobTypeOptions.find((item) => item.value === form?.jobType) || jobTypeOptions[0], [form])
  const selectedLevel = useMemo(() => levelOptions.find((item) => item.value === form?.level) || levelOptions[0], [form])
  const categoryLabelMap = useMemo(() => new Map(categoryOptions.map((item) => [String(item._id || item.id), item.name || item.slug || 'Danh mục'])), [categoryOptions])
  const selectedCategoryLabels = useMemo(() => (form?.categoryIds || []).map((id) => categoryLabelMap.get(String(id)) || String(id)), [form?.categoryIds, categoryLabelMap])
  const categoryTree = useMemo(() => {
    const normalized = categoryOptions.map((item) => ({
      ...item,
      id: String(item._id || item.id),
      parentId: item.parent_id ? String(item.parent_id) : '',
      label: item.name || item.slug || 'Danh mục',
      children: [],
    }))
    const byId = new Map(normalized.map((item) => [item.id, item]))
    const roots = []

    normalized.forEach((item) => {
      const parent = item.parentId ? byId.get(item.parentId) : null
      if (parent) {
        parent.children.push(item)
      } else {
        roots.push(item)
      }
    })

    return roots
  }, [categoryOptions])
  const salaryLabel = useMemo(() => {
    if (!form) return ''
    if (form.negotiable) return 'Thỏa thuận'
    return `${Number(form.salaryMin || 0).toLocaleString('vi-VN')} - ${Number(form.salaryMax || 0).toLocaleString('vi-VN')} ${form.currency}`
  }, [form])

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }))
  const updateCategoryIds = (values) => updateForm({ categoryIds: values.slice(0, 5) })
  const toggleCategoryId = (categoryId) => {
    const currentIds = form?.categoryIds || []
    if (currentIds.includes(categoryId)) {
      updateCategoryIds(currentIds.filter((id) => id !== categoryId))
      return
    }
    if (currentIds.length >= 5) {
      setToast({ type: 'error', message: 'Chỉ được chọn tối đa 5 danh mục.' })
      return
    }
    updateCategoryIds([...currentIds, categoryId])
  }

  const goNext = () => setCurrentStep((step) => Math.min(3, step + 1))
  const goBack = () => setCurrentStep((step) => Math.max(1, step - 1))

  const submit = async (status) => {
    if (!form) return
    const validationMessage = validateForm(form)
    if (validationMessage) {
      setToast({ type: 'error', message: validationMessage })
      return
    }

    setLoading(true)
    setSavingStatus(status)
    try {
      const payload = buildJobPayload(form, status)
      if (isEditing) {
        const { status: _status, ...updatePayload } = payload
        await updateCompanyJob(editJobId, updatePayload)
      } else {
        await createCompanyJob(payload)
      }

      navigate('/employer-job-list', {
        state: {
          toast: {
            type: 'success',
            message: isEditing ? 'Đã cập nhật job.' : status === 'open' ? 'Đã đăng tin tuyển dụng.' : 'Đã lưu bản nháp.',
          },
        },
      })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể lưu job.' })
    } finally {
      setLoading(false)
      setSavingStatus('')
    }
  }

  if (!form) {
    return (
      <div className="dashboard-copy-font min-h-screen bg-[#F9FAFB] text-slate-900">
        <DashboardSidebar activeKey="post-job" />
        <main className="min-h-screen bg-[#F9FAFB] lg:ml-64">
          <EmployerTopBar />
          <div className="px-4 py-5 lg:px-6 lg:py-7">
            <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm">
              Đang tải dữ liệu...
            </div>
          </div>
        </main>
      </div>
    )
  }

  const renderStepOne = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-5">
      <div className="space-y-5">
        <SectionBlock title="Thông tin chung">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label>
              <FieldLabel icon="title" label="Tiêu đề công việc" />
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
                placeholder="Backend Developer"
              />
            </label>

            <label>
              <FieldLabel icon="location_on" label="Địa điểm" />
              <input
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={form.location}
                onFocus={ensureVietnamLocations}
                onChange={(event) => updateForm({ location: event.target.value })}
                placeholder="Chọn tỉnh/thành phố, phường/xã"
                list="vietnam-location-options"
              />
              <datalist id="vietnam-location-options">
                {vietnamLocations.provinces.map((item) => <option key={`province-${item.province_code}`} value={item.name} />)}
                {vietnamLocations.wards.map((item) => <option key={`ward-${item.ward_code}`} value={item.name} />)}
              </datalist>
            </label>
            <div>
              <FieldLabel icon="category" label="Danh mục" />
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className="min-h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm outline-none transition hover:border-blue-200 hover:bg-white hover:ring-2 hover:ring-blue-100"
              >
                {selectedCategoryLabels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategoryLabels.map((label) => (
                      <span key={label} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-semibold text-slate-400">Chọn danh mục nghề nghiệp</span>
                )}
              </button>
            </div>

            <label>
              <FieldLabel icon="military_tech" label="Cấp độ" />
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={form.level}
                onChange={(event) => updateForm({ level: event.target.value })}
              >
                {levelOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <FieldLabel icon="work" label="Hình thức làm việc" />
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={form.jobType}
                onChange={(event) => updateForm({ jobType: event.target.value })}
              >
                {jobTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <FieldLabel icon="group_add" label="Số lượng tuyển" />
              <input
                type="number"
                min="1"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={form.quantity}
                onChange={(event) => updateForm({ quantity: event.target.value })}
              />
            </label>

            <label>
              <FieldLabel icon="event" label="Hạn ứng tuyển" />
              <input
                type="date"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={form.deadline}
                onChange={(event) => updateForm({ deadline: event.target.value })}
              />
            </label>

          </div>
        </SectionBlock>

        <SectionBlock title="Lương">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <label>
              <FieldLabel icon="payments" label="Kiểu lương" />
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={form.negotiable ? 'negotiable' : 'range'}
                onChange={(event) => updateForm({ negotiable: event.target.value === 'negotiable' })}
              >
                <option value="range">Khoảng lương</option>
                <option value="negotiable">Lương thỏa thuận</option>
              </select>
            </label>

            {!form.negotiable ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_140px]">
                <label>
                  <FieldLabel icon="payments" label="Lương tối thiểu" />
                  <input
                    type="number"
                    min="0"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    value={form.salaryMin}
                    onChange={(event) => updateForm({ salaryMin: event.target.value })}
                  />
                </label>

                <label>
                  <FieldLabel icon="trending_up" label="Lương tối đa" />
                  <input
                    type="number"
                    min="0"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    value={form.salaryMax}
                    onChange={(event) => updateForm({ salaryMax: event.target.value })}
                  />
                </label>

                <label>
                  <FieldLabel icon="currency_exchange" label="Tiền tệ" />
                  <select
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    value={form.currency}
                    onChange={(event) => updateForm({ currency: event.target.value })}
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>
            ) : (
              <div className="flex min-h-[76px] items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                Tin tuyển dụng sẽ hiển thị mức lương là Thỏa thuận.
              </div>
            )}
          </div>
        </SectionBlock>

        <SectionBlock title="Kỹ năng">
          <label className="block">
            <FieldLabel icon="code" label="Kỹ năng yêu cầu" />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              value={form.skillsText}
              onChange={(event) => updateForm({ skillsText: event.target.value })}
              placeholder="ReactJS, NodeJS, MongoDB"
            />
          </label>
        </SectionBlock>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start xl:space-y-5">
        <SmallPreviewCard
          form={form}
          selectedJobType={selectedJobType}
          selectedLevel={selectedLevel}
          salaryLabel={salaryLabel}
        />

      </aside>
    </div>
  )

  const renderStepTwo = () => (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SectionBlock title="Nội dung tuyển dụng">
        <div className="space-y-4">
          <label className="block">
            <FieldLabel icon="article" label="Mô tả công việc" />
            <RichTextEditor
              value={form.description}
              onChange={(value) => updateForm({ description: value })}
              placeholder="Mô tả vai trò, phạm vi công việc và mục tiêu."
              label="Mô tả công việc"
            />
          </label>

          <label className="block">
            <FieldLabel icon="fact_check" label="Yêu cầu công việc" />
            <RichTextEditor
              value={form.requirements}
              onChange={(value) => updateForm({ requirements: value })}
              placeholder="Nêu rõ yêu cầu kỹ thuật, kinh nghiệm và kỹ năng."
              label="Yêu cầu công việc"
            />
          </label>

          <label className="block">
            <FieldLabel icon="redeem" label="Quyền lợi" />
            <RichTextEditor
              value={form.benefits}
              onChange={(value) => updateForm({ benefits: value })}
              placeholder="Lương tháng 13, BHXH, ngân sách học tập..."
              label="Quyền lợi"
            />
          </label>
        </div>
      </SectionBlock>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start xl:space-y-5">
        <SectionBlock title="Tóm tắt">
          <div className="space-y-3 text-sm text-slate-600">
            <p className="font-bold text-slate-900">{form.title || 'Tiêu đề công việc'}</p>
            <p>{selectedLevel.label} • {selectedJobType.label} • {form.location || 'Địa điểm'}</p>
            <p>{salaryLabel}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
              {splitList(form.skillsText).slice(0, 5).map((skill) => (
                <span key={skill} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </SectionBlock>
      </aside>
    </div>
  )

  const renderStepThree = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-950 px-4 py-5 text-white sm:px-5 lg:px-6 lg:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white">{form.packageType}</span>
                <span className="rounded-lg bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">Sẵn sàng đăng</span>
              </div>
              <h2 className="text-[24px] font-extrabold tracking-tight sm:text-[28px] lg:text-[32px]">{form.title || 'Tiêu đề công việc'}</h2>
              <p className="mt-3 text-sm text-slate-300">{selectedLevel.label} • {selectedJobType.label} • {form.location || 'Địa điểm'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Mức lương</p>
              <p className="mt-1 text-xl font-extrabold">{salaryLabel}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 md:grid-cols-4 lg:p-5">
          {[
            ['location_on', 'Địa điểm', form.location || 'Đang cập nhật'],
            ['group_add', 'Số lượng', `${form.quantity || 1} vị trí`],
            ['event', 'Hạn ứng tuyển', form.deadline || 'Chưa chọn'],
            ['category', 'Danh mục', selectedCategoryLabels.join(', ') || 'Chưa có'],
          ].map(([icon, label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="material-symbols-outlined text-[18px] text-blue-600">{icon}</span>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 bg-white p-4 lg:space-y-5 lg:p-5">
          <DetailSection title="Mô tả công việc" icon="article">
            <RichTextContent value={form.description} />
          </DetailSection>

          <DetailSection title="Yêu cầu công việc" icon="fact_check">
            <RichTextContent value={form.requirements} />
          </DetailSection>

          <DetailSection title="Quyền lợi" icon="redeem">
            <RichTextContent value={form.benefits} />
          </DetailSection>

          <DetailSection title="Kỹ năng" icon="code">
            <div className="flex flex-wrap gap-2">
              {splitList(form.skillsText).map((skill) => (
                <span key={skill} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                  {skill}
                </span>
              ))}
            </div>
          </DetailSection>
        </div>
      </article>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start xl:space-y-5">
        <SectionBlock title="Hoàn tất">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
              onClick={() => submit('open')}
            >
              {loading && savingStatus === 'open' ? 'Đang đăng...' : isEditing ? 'Cập nhật job' : 'Đăng tuyển'}
            </button>
            {!isEditing && (
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                disabled={loading}
                onClick={() => submit('draft')}
              >
                {loading && savingStatus === 'draft' ? 'Đang lưu...' : 'Lưu bản nháp'}
              </button>
            )}
          </div>
        </SectionBlock>
      </aside>
    </div>
  )

  return (
    <div className="dashboard-copy-font min-h-screen bg-[#F9FAFB] text-slate-900">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardSidebar activeKey="post-job" />

      <main className="min-h-screen bg-[#F9FAFB] lg:ml-64">
        <EmployerTopBar />
        <div className="px-4 py-5 lg:px-6 lg:py-7">
        <section className="mb-4 flex flex-col gap-4 lg:mb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Quản lý tuyển dụng</p>
            <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-950 sm:text-[32px] lg:text-[34px]">
              {isEditing ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Bước {currentStep}/{defaultSteps.length}: {defaultSteps.find((step) => step.id === currentStep)?.label || 'Thông tin chung'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
            {defaultSteps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`inline-flex h-11 items-center gap-3 rounded-lg border px-4 text-sm font-semibold transition sm:text-base ${
                  currentStep === step.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md text-sm ${
                    currentStep === step.id
                      ? 'bg-white/15 text-white'
                      : step.id === 1
                        ? 'bg-blue-50 text-blue-600'
                        : step.id === 2
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {step.id}
                </span>
                {step.label}
              </button>
            ))}
          </div>
        </section>

        {currentStep === 1 && renderStepOne()}
        {currentStep === 2 && renderStepTwo()}
        {currentStep === 3 && renderStepThree()}


        {categoryModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-600">Danh mục</p>
                  <h3 className="mt-1 text-lg font-extrabold text-slate-950">Chọn danh mục nghề nghiệp</h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">Chọn từ 1 đến 5 danh mục phù hợp với tin tuyển dụng.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto p-5">
                {selectedCategoryLabels.length ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {form.categoryIds.map((categoryId) => (
                      <button
                        key={categoryId}
                        type="button"
                        onClick={() => toggleCategoryId(categoryId)}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                      >
                        {categoryLabelMap.get(categoryId) || categoryId}
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {categoryTree.length ? (
                    categoryTree.map((category) => (
                      <CategoryTreeNode
                        key={category.id}
                        category={category}
                        selectedIds={form.categoryIds}
                        onToggle={toggleCategoryId}
                      />
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm font-semibold text-slate-400">
                      Chưa có danh mục khả dụng.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-500">Đã chọn {form.categoryIds.length}/5 danh mục</p>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white transition hover:bg-slate-800"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:mt-5">
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            disabled={currentStep === 1}
            onClick={goBack}
          >
            <span className="material-symbols-outlined mr-1 text-[18px]">chevron_left</span>
            Quay lại
          </button>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 sm:w-auto"
              onClick={() => navigate('/employer-job-list')}
            >
              Hủy
            </button>
            {currentStep < 3 && (
              <button
                type="button"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                onClick={goNext}
              >
                Tiếp tục
                <span className="material-symbols-outlined ml-1 text-[18px]">chevron_right</span>
              </button>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}
