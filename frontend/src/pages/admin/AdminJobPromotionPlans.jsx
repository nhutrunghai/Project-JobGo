import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import Toast from '../../components/Toast.jsx'
import {
  createAdminJobPromotionPlan,
  deleteAdminJobPromotionPlan,
  getAdminJobPromotionPlans,
  updateAdminJobPromotionPlan,
} from '../../api/adminService.js'

const emptyForm = {
  code: '', name: '', description: '', daily_price: '50000', currency: 'VND',
  min_duration_days: '1', max_duration_days: '30', default_priority: '100',
  sort_order: '0', is_active: true,
}

const money = (value, currency = 'VND') => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency, maximumFractionDigits: currency === 'VND' ? 0 : 2,
}).format(Number(value || 0))

export default function AdminJobPromotionPlans() {
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const loadPlans = async () => {
    setLoading(true)
    try {
      const data = await getAdminJobPromotionPlans()
      setPlans(data?.plans || data?.data?.plans || [])
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể tải danh sách gói quảng cáo.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlans() }, [])

  const editPlan = (plan) => {
    setEditingId(plan._id)
    setForm({
      code: plan.code, name: plan.name, description: plan.description || '',
      daily_price: String(plan.daily_price), currency: plan.currency,
      min_duration_days: String(plan.min_duration_days), max_duration_days: String(plan.max_duration_days),
      default_priority: String(plan.default_priority), sort_order: String(plan.sort_order || 0),
      is_active: plan.is_active !== false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      type: 'homepage_featured',
      daily_price: Number(form.daily_price), min_duration_days: Number(form.min_duration_days),
      max_duration_days: Number(form.max_duration_days), default_priority: Number(form.default_priority),
      sort_order: Number(form.sort_order),
    }
    try {
      if (editingId) await updateAdminJobPromotionPlan(editingId, payload)
      else await createAdminJobPromotionPlan(payload)
      setToast({ type: 'success', message: editingId ? 'Đã cập nhật gói quảng cáo.' : 'Đã tạo gói quảng cáo.' })
      setEditingId('')
      setForm(emptyForm)
      await loadPlans()
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể lưu gói quảng cáo.' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (plan) => {
    if (!window.confirm(`Xóa gói “${plan.name}”? Gói đã từng sử dụng sẽ không thể xóa.`)) return
    try {
      await deleteAdminJobPromotionPlan(plan._id)
      setToast({ type: 'success', message: 'Đã xóa gói quảng cáo.' })
      await loadPlans()
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể xóa gói quảng cáo.' })
    }
  }

  const fieldClass = 'mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

  return (
    <AdminLayout title="Gói quảng cáo" subtitle="Cấu hình giá, thời lượng và độ ưu tiên. Các lượt quảng cáo sẽ lấy thông tin từ đây.">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="grid gap-5 2xl:grid-cols-[390px_minmax(0,1fr)]">
        <form onSubmit={submit} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm 2xl:sticky 2xl:top-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">{editingId ? 'Chỉnh sửa gói' : 'Tạo gói mới'}</h2>
            {editingId ? <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm) }} className="text-xs font-bold text-slate-500">Hủy sửa</button> : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
            <label className="text-xs font-bold text-slate-600">Mã gói<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="homepage-standard" className={fieldClass} /></label>
            <label className="text-xs font-bold text-slate-600">Tên gói<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} /></label>
            <label className="text-xs font-bold text-slate-600 sm:col-span-2 2xl:col-span-1">Mô tả<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" className={`${fieldClass} h-auto py-2`} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-600">Giá/ngày<input required min="0" type="number" value={form.daily_price} onChange={(e) => setForm({ ...form, daily_price: e.target.value })} className={fieldClass} /></label>
              <label className="text-xs font-bold text-slate-600">Tiền tệ<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={fieldClass}><option>VND</option><option>USD</option></select></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-600">Ngày tối thiểu<input required min="1" type="number" value={form.min_duration_days} onChange={(e) => setForm({ ...form, min_duration_days: e.target.value })} className={fieldClass} /></label>
              <label className="text-xs font-bold text-slate-600">Ngày tối đa<input required min="1" type="number" value={form.max_duration_days} onChange={(e) => setForm({ ...form, max_duration_days: e.target.value })} className={fieldClass} /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-600">Độ ưu tiên<input required min="0" type="number" value={form.default_priority} onChange={(e) => setForm({ ...form, default_priority: e.target.value })} className={fieldClass} /></label>
              <label className="text-xs font-bold text-slate-600">Thứ tự<input min="0" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={fieldClass} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Cho phép sử dụng gói</label>
          </div>
          <button disabled={saving} className="mt-4 h-11 w-full rounded-lg bg-blue-600 text-sm font-extrabold text-white disabled:opacity-60">{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo gói quảng cáo'}</button>
        </form>

        <section className="space-y-3">
          {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Đang tải gói quảng cáo...</div> : null}
          {!loading && !plans.length ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">Chưa có gói quảng cáo.</div> : null}
          {plans.map((plan) => (
            <article key={plan._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${plan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{plan.is_active ? 'Đang sử dụng' : 'Đã tắt'}</span></div>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-blue-600">{plan.code}</p>
                  <p className="mt-2 text-sm text-slate-500">{plan.description || 'Không có mô tả.'}</p>
                </div>
                <div className="flex gap-2"><button onClick={() => editPlan(plan)} className="h-9 rounded-md border border-slate-200 px-3 text-xs font-bold text-slate-700">Chỉnh sửa</button><button onClick={() => remove(plan)} className="h-9 rounded-md border border-rose-100 px-3 text-xs font-bold text-rose-600">Xóa</button></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[['Giá mỗi ngày', money(plan.daily_price, plan.currency)], ['Thời lượng', `${plan.min_duration_days}–${plan.max_duration_days} ngày`], ['Độ ưu tiên', plan.default_priority], ['Vị trí', 'Nổi bật trang chủ']].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-extrabold text-slate-800">{value}</p></div>)}
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminLayout>
  )
}
