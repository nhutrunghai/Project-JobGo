import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { adminLogout } from '../api/adminService.js'

const navItems = [
  { key: 'dashboard', label: 'Tổng quan', to: '/admin/dashboard', icon: 'dashboard' },
  { key: 'users', label: 'Người dùng', to: '/admin/users', icon: 'group' },
  { key: 'companies', label: 'Doanh nghiệp', to: '/admin/companies', icon: 'apartment' },
  { key: 'jobs', label: 'Tin tuyển dụng', to: '/admin/jobs', icon: 'work' },
  { key: 'job-categories', label: 'Danh mục việc làm', to: '/admin/job-categories', icon: 'category' },
  { key: 'job-promotions', label: 'Quảng cáo tuyển dụng', to: '/admin/job-promotions', icon: 'star' },
  { key: 'job-promotion-plans', label: 'Gói quảng cáo', to: '/admin/job-promotion-plans', icon: 'sell' },
  { key: 'wallet-transactions', label: 'Giao dịch ví', to: '/admin/wallet-transactions', icon: 'account_balance_wallet' },
  { key: 'sepay-config', label: 'Cấu hình SePay', to: '/admin/sepay-config', icon: 'settings_ethernet' },
  { key: 'rag-chat-config', label: 'Cấu hình RAG Chat', to: '/admin/rag-chat-config', icon: 'smart_toy' },
  { key: 'audit-logs', label: 'Nhật ký admin', to: '/admin/audit-logs', icon: 'history' },
]

export default function AdminLayout({ title, subtitle, children }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeItem = navItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) || navItems[0]

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await adminLogout()
    } finally {
      navigate('/admin/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[232px] flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform duration-200 lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:flex`}
      >
        <div className="border-b border-white/10 px-3.5 py-3.5">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-slate-100 ring-1 ring-white/10">
              <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
            </span>
            <span>
              <span className="block text-[12px] font-extrabold tracking-[0.17em] text-white">MYCODER</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                Bảng quản trị
              </span>
            </span>
          </Link>
        </div>

        <div className="px-2.5 py-3.5">
          <p className="mb-2.5 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Quản lý</p>
          <nav className="space-y-1 text-[12.5px]">
            {navItems.map((item) => {
              const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`group relative flex items-center gap-2 rounded-md px-2 py-2 font-semibold transition-colors ${
                    isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full ${
                      isActive ? 'bg-indigo-500' : 'bg-transparent'
                    }`}
                  />
                  <span
                    className={`flex h-[26px] w-[26px] items-center justify-center rounded-md ${
                      isActive ? 'bg-slate-100 text-indigo-600' : 'bg-white/5 text-slate-400 group-hover:text-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-2.5">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300">
                <span className="material-symbols-outlined text-[17px]">verified_user</span>
              </span>
              <span>
                <span className="block text-[12px] font-bold text-slate-100">Quản trị viên</span>
                <span className="block text-[10px] text-slate-500">Phiên được bảo vệ</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] text-[12px] font-extrabold text-slate-300 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-[232px]">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-[52px] items-center justify-between gap-3 px-3 py-2 sm:px-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  aria-label="Mo menu quan tri"
                  onClick={() => setMobileNavOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <span className="material-symbols-outlined text-[20px]">menu</span>
                </button>
                <span className="truncate text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">MYCODER Admin</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>Quản trị</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600">{activeItem.label}</span>
              </div>
              <h1 className="mt-0.5 text-[16px] font-extrabold tracking-tight text-slate-950 sm:truncate sm:text-[17px]">{title}</h1>
            </div>

            <div className="flex items-center justify-end gap-2 self-start sm:self-auto lg:min-w-[310px]">
              <label className="relative hidden flex-1 lg:block">
                <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[17px] text-slate-400">
                  search
                </span>
                <input
                  type="search"
                  className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-[12.5px] font-medium text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
                  placeholder="Tìm nhanh trong hệ thống..."
                />
              </label>
              <div className="hidden h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Đang hoạt động
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[18px]">notifications</span>
              </button>
            </div>
          </div>
        </header>

        <main className="px-3 py-3 sm:px-4 sm:py-4">
          {subtitle ? (
            <div className="mb-4 border-l-4 border-slate-300 pl-3">
              <p className="max-w-3xl text-[12.5px] font-medium leading-5 text-slate-500">{subtitle}</p>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}
