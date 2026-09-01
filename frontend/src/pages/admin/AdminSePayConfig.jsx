import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import Toast from '../../components/Toast.jsx'
import {
  getAdminSePayConfig,
  getAdminSePayDiagnostics,
  rotateAdminSePaySecrets,
  testAdminSePayConnection,
  updateAdminSePayConfig,
} from '../../api/adminService.js'
import { compactId, formatDateTimeVi as formatDateTime } from '../../utils/formatters.js'

function StatCard({ label, value, tone = 'text-slate-950' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  )
}

const inputClassName =
  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100'

export default function AdminSePayConfig() {
  const [config, setConfig] = useState(null)
  const [diagnostics, setDiagnostics] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [recentLimit, setRecentLimit] = useState('10')
  const [configForm, setConfigForm] = useState({
    bank_account_id: '',
    bank_short_name: '',
    bank_account_number: '',
    bank_account_holder_name: '',
  })
  const [secretForm, setSecretForm] = useState({ api_token: '', webhook_secret: '' })
  const [loading, setLoading] = useState(true)
  const [diagLoading, setDiagLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState(null)

  const syncConfigForm = useCallback((data) => {
    setConfigForm({
      bank_account_id: data?.bank_account_id || '',
      bank_short_name: data?.bank_short_name || '',
      bank_account_number: data?.bank_account_number || '',
      bank_account_holder_name: data?.bank_account_holder_name || '',
    })
  }, [])

  const loadConfig = useCallback(async () => {
    const data = await getAdminSePayConfig()
    setConfig(data)
    syncConfigForm(data)
    return data
  }, [syncConfigForm])

  const loadDiagnostics = useCallback(async (limit = '10') => {
    const data = await getAdminSePayDiagnostics({ recentLimit: Number(limit || 10) })
    setDiagnostics(data)
    return data
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([loadConfig(), loadDiagnostics('10')])
      .catch((error) => {
        if (active) setToast({ type: 'error', message: error.message || 'Không thể tải cấu hình SePay.' })
      })
      .finally(() => {
        if (active) {
          setLoading(false)
          setDiagLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [loadConfig, loadDiagnostics])

  const stats = useMemo(() => {
    const summary = diagnostics?.order_summary?.by_status || {}
    return {
      pending: summary.pending || 0,
      paid: summary.paid || 0,
      failed: summary.failed || 0,
      stalePending: diagnostics?.order_summary?.pending_older_than_1h || 0,
    }
  }, [diagnostics])

  const handleSaveConfig = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const nextConfig = await updateAdminSePayConfig({
        bank_account_id: configForm.bank_account_id.trim() || null,
        bank_short_name: configForm.bank_short_name.trim() || undefined,
        bank_account_number: configForm.bank_account_number.trim() || null,
        bank_account_holder_name: configForm.bank_account_holder_name.trim() || null,
      })
      setConfig(nextConfig)
      syncConfigForm(nextConfig)
      setToast({ type: 'success', message: 'Đã cập nhật cấu hình SePay.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể cập nhật cấu hình SePay.' })
    } finally {
      setSaving(false)
    }
  }

  const handleRotateSecrets = async (event) => {
    event.preventDefault()
    const body = {}
    if (secretForm.api_token.trim()) body.api_token = secretForm.api_token.trim()
    if (secretForm.webhook_secret.trim()) body.webhook_secret = secretForm.webhook_secret.trim()
    if (!Object.keys(body).length) {
      setToast({ type: 'error', message: 'Hãy nhập ít nhất một secret cần xoay vòng.' })
      return
    }

    setRotating(true)
    try {
      const nextConfig = await rotateAdminSePaySecrets(body)
      setConfig(nextConfig)
      setSecretForm({ api_token: '', webhook_secret: '' })
      setToast({ type: 'success', message: 'Đã xoay vòng secret SePay.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể xoay vòng secret SePay.' })
    } finally {
      setRotating(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const result = await testAdminSePayConnection()
      setTestResult(result)
      setToast({ type: result?.connected ? 'success' : 'error', message: result?.message || (result?.connected ? 'Kết nối SePay thành công.' : 'Kết nối SePay thất bại.') })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể test kết nối SePay.' })
    } finally {
      setTesting(false)
    }
  }

  const handleReloadDiagnostics = async () => {
    setDiagLoading(true)
    try {
      await loadDiagnostics(recentLimit)
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể tải diagnostics SePay.' })
    } finally {
      setDiagLoading(false)
    }
  }

  return (
    <AdminLayout title="Cấu hình SePay" subtitle="Quản lý cấu hình vận hành SePay, cập nhật secret, kiểm tra kết nối và theo dõi chẩn đoán nạp tiền.">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <section className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chờ thanh toán" value={stats.pending} tone="text-amber-700" />
        <StatCard label="Đã thanh toán" value={stats.paid} tone="text-emerald-700" />
        <StatCard label="Th?t b?i" value={stats.failed} tone="text-rose-700" />
        <StatCard label="Chờ thanh toán quá 1h" value={stats.stalePending} tone="text-slate-950" />
      </section>

      <section className="mb-3 grid grid-cols-1 gap-3 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={handleSaveConfig} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-[14px] font-extrabold text-slate-950">Cấu hình vận hành</h2>
          <div className="mt-3 space-y-3">
            <label className="block"><span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">ID tài khoản ngân hàng</span><input value={configForm.bank_account_id} onChange={(event) => setConfigForm((current) => ({ ...current, bank_account_id: event.target.value }))} className={inputClassName} /></label>
            <label className="block"><span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Tên viết tắt ngân hàng</span><input value={configForm.bank_short_name} onChange={(event) => setConfigForm((current) => ({ ...current, bank_short_name: event.target.value }))} className={inputClassName} /></label>
            <label className="block"><span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Số tài khoản</span><input value={configForm.bank_account_number} onChange={(event) => setConfigForm((current) => ({ ...current, bank_account_number: event.target.value }))} className={inputClassName} /></label>
            <label className="block"><span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Chủ tài khoản</span><input value={configForm.bank_account_holder_name} onChange={(event) => setConfigForm((current) => ({ ...current, bank_account_holder_name: event.target.value }))} className={inputClassName} /></label>
            <button type="submit" disabled={saving || loading} className="flex h-10 w-full items-center justify-center rounded-md bg-slate-950 px-3 text-[13px] font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-3">
          <form onSubmit={handleRotateSecrets} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-extrabold text-slate-950">Cập nhật secret</h2>
                <p className="mt-1 text-[12px] font-medium text-slate-500">Chỉ nhập các secret cần thay đổi.</p>
              </div>
              <button type="button" onClick={handleTestConnection} disabled={testing || loading} className="h-9 rounded-md border border-indigo-200 bg-indigo-50 px-3 text-[12px] font-extrabold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50">{testing ? "Đang kiểm tra..." : "Kiểm tra kết nối"}</button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <label className="block"><span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">API token mới</span><input type="password" value={secretForm.api_token} onChange={(event) => setSecretForm((current) => ({ ...current, api_token: event.target.value }))} className={inputClassName} /></label>
              <label className="block"><span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Webhook secret mới</span><input type="password" value={secretForm.webhook_secret} onChange={(event) => setSecretForm((current) => ({ ...current, webhook_secret: event.target.value }))} className={inputClassName} /></label>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12px]"><p className="font-extrabold text-slate-900">API token</p><p className="mt-1 text-slate-500">{config?.api_token_preview || 'Chưa có'} · {config?.api_token_source || 'N/A'}</p></div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12px]"><p className="font-extrabold text-slate-900">Webhook secret</p><p className="mt-1 text-slate-500">{config?.webhook_secret_preview || 'Chưa có'} · {config?.webhook_secret_source || 'N/A'}</p></div>
            </div>

            {testResult ? (
              <div className={`mt-3 rounded-md border px-3 py-2 text-[12px] font-semibold ${testResult.connected ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700'}`}>
                {testResult.connected ? 'Kết nối thành công' : 'Kết nối thất bại'} · {testResult.reason || testResult.provider_status || 'Đã kiểm tra'} · {formatDateTime(testResult.checked_at)}
              </div>
            ) : null}

            <button type="submit" disabled={rotating || loading} className="mt-3 flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-[13px] font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{rotating ? "Đang cập nhật..." : "Cập nhật secret"}</button>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-extrabold text-slate-950">Chẩn đoán</h2>
                <p className="mt-1 text-[12px] font-medium text-slate-500">Tóm tắt order, webhook và tình trạng vận hành.</p>
              </div>
              <div className="flex items-center gap-2">
                <input value={recentLimit} onChange={(event) => setRecentLimit(event.target.value)} type="number" min="1" max="50" className="h-9 w-20 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none" />
                <button type="button" onClick={handleReloadDiagnostics} disabled={diagLoading} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{diagLoading ? 'Đang tải...' : 'Làm mới'}</button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12px] font-semibold text-slate-700">Nhà cung cấp: {config?.provider || "sepay"}</div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12px] font-semibold text-slate-700">Đường dẫn webhook: {config?.webhook_url || config?.webhook_path || "Chưa có"}</div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12px] font-semibold text-slate-700">Webhook 24h: {diagnostics?.order_summary?.webhook_received_last_24h || 0}</div>
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12px] font-semibold text-slate-700">Đã thanh toán 24h: {diagnostics?.order_summary?.paid_last_24h || 0}</div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[140px_110px_1fr_120px] bg-slate-50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                  <span>Mã order</span><span>Trạng thái</span><span>Mã giao dịch NCC</span><span>Cập nhật</span>
                </div>
                {(diagnostics?.recent_orders || []).map((order) => (
                  <div key={order._id || order.order_code} className="grid grid-cols-[140px_110px_1fr_120px] border-t border-slate-100 px-4 py-3 text-[12px] text-slate-700">
                    <span className="truncate font-extrabold">{order.order_code || compactId(order._id)}</span>
                    <span>{order.status || 'Chưa có'}</span>
                    <span className="truncate">{order.provider_transaction_id || 'Chưa có'}</span>
                    <span>{formatDateTime(order.updated_at)}</span>
                  </div>
                ))}
                {!diagLoading && !(diagnostics?.recent_orders || []).length ? <div className="px-4 py-8 text-center text-[13px] font-semibold text-slate-400">Không có đơn gần đây.</div> : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-[13px] font-extrabold text-slate-950">Webhook gần nhất</h3>
                <div className="mt-3 space-y-2 text-[12px] font-semibold text-slate-700">
                  <p>Mã order: {diagnostics?.latest_webhook_order?.order_code || 'Chưa có'}</p>
                  <p>Trạng thái: {diagnostics?.latest_webhook_order?.status || 'Chưa có'}</p>
                  <p>Mã giao dịch NCC: {diagnostics?.latest_webhook_order?.provider_transaction_id || "Chưa có"}</p>
                  <p>Thanh toán lúc: {formatDateTime(diagnostics?.latest_webhook_order?.paid_at)}</p>
                  <p>Cập nhật: {formatDateTime(diagnostics?.latest_webhook_order?.updated_at)}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </AdminLayout>
  )
}
