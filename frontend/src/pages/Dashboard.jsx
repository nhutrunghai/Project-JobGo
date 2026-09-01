import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar.jsx'
import Toast from '../components/Toast.jsx'
import { getWallet } from '../api/walletService.js'
import { loadCandidateDashboardSnapshot } from '../data/apiClient.js'
import { queryKeys } from '../lib/queryKeys.js'

const overviewShells = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-cyan-600',
]

const actionTones = [
  'bg-blue-500 hover:bg-blue-600',
  'bg-emerald-500 hover:bg-emerald-600',
  'bg-amber-500 hover:bg-amber-600',
  'bg-rose-500 hover:bg-rose-600',
  'bg-slate-700 hover:bg-slate-800',
]

const fallbackDashboard = {
  overviewCards: [
    {
      key: 'active',
      badge: 'Đang ứng tuyển',
      value: '0',
      label: 'Công việc đang ứng tuyển',
      icon: 'work',
    },
    {
      key: 'done',
      badge: 'Được nhận',
      value: '0',
      label: 'Công việc được nhận',
      icon: 'check_circle',
    },
    {
      key: 'wallet',
      badge: 'Ví',
      value: '0 ₫',
      label: 'Số dư ví',
      icon: 'account_balance_wallet',
    },
  ],
  quickActions: [
    { label: 'Tìm việc', icon: 'search', to: '/search-jobs' },
    { label: 'Hồ sơ', icon: 'person', to: '/user/profile' },
    { label: 'Ví', icon: 'account_balance_wallet', to: '/wallet/top-up' },
    { label: 'Tin nhắn', icon: 'chat_bubble_outline', to: '/messages' },
  ],
  activities: [
    {
      title: 'Chưa có hoạt động gần đây',
      time: 'Vừa cập nhật',
      tone: 'text-slate-500',
    },
  ],
}

function getQuickActionPath(item) {
  if (item?.to) return item.to

  const label = String(item?.label || '').toLowerCase()
  const icon = String(item?.icon || '').toLowerCase()

  if (label.includes('tìm') || label.includes('việc') || icon === 'search') return '/search-jobs'
  if (label.includes('hồ') || label.includes('profile') || icon === 'person') return '/user/profile'
  if (label.includes('ví') || icon === 'account_balance_wallet') return '/wallet/top-up'
  if (label.includes('tin') || icon.includes('chat')) return '/messages'
  return '/dashboard'
}

function formatWalletBalance(balance) {
  return Number(balance || 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [toast, setToast] = useState(location.state?.toast ?? null)
  const candidateDashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.candidate,
    queryFn: loadCandidateDashboardSnapshot,
  })
  const walletQuery = useQuery({
    queryKey: queryKeys.wallet.details,
    queryFn: getWallet,
  })
  const overviewCards = useMemo(() => fallbackDashboard.overviewCards.map((card) => {
    if (card.key === 'active') {
      return { ...card, value: String(candidateDashboardQuery.data?.summary?.totalApplied || 0) }
    }
    if (card.key === 'done') {
      return { ...card, value: String(candidateDashboardQuery.data?.summary?.hired || 0) }
    }
    if (card.key === 'wallet') {
      return { ...card, value: formatWalletBalance(walletQuery.data?.balance) }
    }
    return card
  }), [candidateDashboardQuery.data, walletQuery.data])
  const quickActions = fallbackDashboard.quickActions
  const activities = candidateDashboardQuery.data?.recentActivities || fallbackDashboard.activities
  const dashboardError = candidateDashboardQuery.error || walletQuery.error

  useEffect(() => {
    if (!location.state?.toast) return

    const { toast: _toast, ...nextState } = location.state
    navigate(location.pathname, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    })
  }, [location.pathname, location.state, navigate])

  return (
    <div className="bg-[#f6f8fb] text-on-surface">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <DashboardSidebar activeKey="dashboard" />
      <main className="min-h-screen p-4 lg:ml-64 lg:p-5">
        <header className="mb-4 flex items-center gap-2">
          <Link to="/" className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100">
            <span className="material-symbols-outlined !text-[20px]">arrow_back</span>
          </Link>
          <h1 className="text-[26px] font-semibold text-slate-900 sm:text-[31px]">Trang chủ</h1>
        </header>
        {dashboardError ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {dashboardError.message || 'Không thể tải toàn bộ dữ liệu tổng quan.'}
          </div>
        ) : null}

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-[18px] font-semibold text-slate-900">Tổng quan hoạt động</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {overviewCards.map((card, index) => (
              <article key={card.key} className={`rounded-lg bg-gradient-to-br p-4 text-white ${overviewShells[index % overviewShells.length]}`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="material-symbols-outlined !text-[24px]">{card.icon}</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{card.badge}</span>
                </div>
                <p className="text-[30px] font-extrabold leading-none">{card.value}</p>
                <p className="mt-1 text-[14px] font-medium text-white/95">{card.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-[18px] font-semibold text-slate-900">Thao tác nhanh</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {quickActions.map((item, index) => (
              <Link
                key={item.label}
                to={getQuickActionPath(item)}
                className={`inline-flex items-center justify-center rounded-md px-3 py-2.5 text-[15px] font-semibold text-white transition ${item.tone || actionTones[index % actionTones.length]}`}
              >
                <span className="material-symbols-outlined mr-1 !text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-[18px] font-semibold text-slate-900">Hoạt động gần đây</h2>
          <div className="space-y-2">
            {activities.length ? (
              activities.map((item) => (
                <article key={item.title} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[14px] font-medium text-slate-700">{item.title}</p>
                  <span className={`text-[12px] font-semibold ${item.tone}`}>{item.time}</span>
                </article>
              ))
            ) : (
              <article className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3.5 py-5 text-center">
                <p className="text-[14px] font-medium text-slate-500">Không có hoạt động gì gần đây</p>
              </article>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
