import { useCallback, useEffect, useMemo, useState } from 'react'
import DashboardSidebar from './DashboardSidebar.jsx'
import { formatDateTimeVi as formatDateTime } from '../utils/formatters.js'
import Toast from './Toast.jsx'
import {
  emitUnreadNotificationCount,
  getUserNotificationUnreadCount,
  getUserNotifications,
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
} from '../api/notificationService.js'

const typeLabelMap = {
  job_application_submitted: 'Ứng tuyển',
  job_application_status_updated: 'Cập nhật hồ sơ',
  company_verification_updated: 'Xác minh công ty',
  wallet_topup_succeeded: 'Nạp ví',
  wallet_adjusted: 'Điều chỉnh ví',
}

export default function NotificationCenter({ title, activeKey }) {
  const [activeTab, setActiveTab] = useState('all')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, total_pages: 1 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState('')
  const [markingAll, setMarkingAll] = useState(false)
  const [toast, setToast] = useState(null)

  const loadNotifications = useCallback(async ({ page = pagination.page, limit = pagination.limit, tab = activeTab } = {}) => {
    const response = await getUserNotifications({
      page,
      limit,
      is_read: tab === 'unread' ? false : undefined,
    })
    const nextItems = response?.notifications || []
    const nextPagination = response?.pagination || { page, limit, total: nextItems.length, total_pages: 1 }
    setItems(nextItems)
    setPagination(nextPagination)
    return nextItems
  }, [activeTab, pagination.limit, pagination.page])

  const loadUnreadCount = useCallback(async () => {
    const count = await getUserNotificationUnreadCount()
    setUnreadCount(count)
    emitUnreadNotificationCount(count)
    return count
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([loadNotifications({ page: pagination.page, limit: pagination.limit, tab: activeTab }), loadUnreadCount()])
      .catch((error) => {
        if (active) setToast({ type: 'error', message: error.message || 'Không thể tải thông báo.' })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [activeTab, loadNotifications, loadUnreadCount, pagination.limit, pagination.page])

  useEffect(() => {
    setPagination((current) => ({ ...current, page: 1 }))
  }, [activeTab])

  const tabItems = useMemo(
    () => [
      { key: 'all', label: 'Tất cả', count: pagination.total || items.length, icon: 'notifications' },
      { key: 'unread', label: 'Chưa đọc', count: unreadCount, icon: 'mark_email_unread' },
    ],
    [items.length, pagination.total, unreadCount]
  )

  const handleMarkOne = async (notificationId) => {
    setMarkingId(notificationId)
    try {
      const updated = await markUserNotificationAsRead(notificationId)
      setItems((current) =>
        activeTab === 'unread'
          ? current.filter((item) => item._id !== notificationId)
          : current.map((item) =>
              item._id === notificationId
                ? { ...item, ...(updated || {}), is_read: true, read_at: updated?.read_at || new Date().toISOString() }
                : item
            )
      )
      const nextCount = Math.max(0, unreadCount - 1)
      setUnreadCount(nextCount)
      if (activeTab === 'unread') {
        setPagination((current) => ({
          ...current,
          total: Math.max(0, Number(current.total || 0) - 1),
          total_pages: Math.max(1, Math.ceil(Math.max(0, Number(current.total || 0) - 1) / Number(current.limit || 1))),
        }))
      }
      emitUnreadNotificationCount(nextCount)
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể đánh dấu đã đọc.' })
    } finally {
      setMarkingId('')
    }
  }

  const handleMarkAll = async () => {
    if (!unreadCount) return
    setMarkingAll(true)
    try {
      await markAllUserNotificationsAsRead()
      setItems((current) =>
        activeTab === 'unread'
          ? []
          : current.map((item) => ({
              ...item,
              is_read: true,
              read_at: item.read_at || new Date().toISOString(),
            }))
      )
      setUnreadCount(0)
      if (activeTab === 'unread') {
        setPagination((current) => ({ ...current, total: 0, total_pages: 1, page: 1 }))
      }
      emitUnreadNotificationCount(0)
      setToast({ type: 'success', message: 'Đã đánh dấu tất cả là đã đọc.' })
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Không thể đánh dấu tất cả là đã đọc.' })
    } finally {
      setMarkingAll(false)
    }
  }

  const canGoPrev = Number(pagination.page) > 1
  const canGoNext = Number(pagination.page) < Number(pagination.total_pages || 1)

  return (
    <div className="bg-[#f7f9fc] text-on-surface">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardSidebar activeKey={activeKey} />
      <main className="min-h-screen p-5 lg:ml-64">
        <header className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[21px] font-semibold leading-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-[13px] text-slate-500">{unreadCount} thông báo chưa đọc</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={!unreadCount || markingAll}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? 'Đang xử lý...' : 'Đánh dấu đọc tất cả'}
          </button>
        </header>

        <section className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center">
            {tabItems.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[14px] font-medium transition ${
                    active ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined !text-[17px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Đang tải thông báo...</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Không có thông báo nào.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <article
                  key={item._id}
                  className={`rounded-lg border px-3 py-3 ${item.is_read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{item.title || 'Thông báo'}</p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          {typeLabelMap[item.type] || item.type || 'Hệ thống'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.content || 'Không có nội dung.'}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(item.created_at)}</p>
                    </div>
                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={() => handleMarkOne(item._id)}
                        disabled={markingId === item._id}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-[12px] font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {markingId === item._id ? 'Đang lưu...' : 'Đánh dấu đã đọc'}
                      </button>
                    ) : (
                      <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-[12px] font-bold text-slate-400">
                        Đã đọc
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[12px] font-semibold text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span>Trang {pagination.page || 1}/{pagination.total_pages || 1} · Tổng {pagination.total || items.length} thông báo</span>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setPagination((current) => ({ ...current, page: Number(current.page || 1) - 1 }))}
              className="h-8 rounded-md border border-slate-200 bg-white px-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setPagination((current) => ({ ...current, page: Number(current.page || 1) + 1 }))}
              className="h-8 rounded-md border border-slate-200 bg-white px-3 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
