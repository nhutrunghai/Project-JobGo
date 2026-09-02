import { Link, useLocation } from 'react-router-dom'

const sectionTabs = [
  { key: 'job-list', icon: 'checklist', label: 'Danh sách job', to: '/employer-job-list' },
  { key: 'post-job', icon: 'add_circle', label: 'Đăng tin mới', to: '/employer-post-job' },
  { key: 'job-promotions', icon: 'rocket_launch', label: 'Quảng cáo', to: '/employer-job-promotions' },
  { key: 'received-cv', icon: 'description', label: 'Hồ sơ đã nhận', to: '/employer-received-cv' },
]

export default function EmployerSectionTabs({ className = '' }) {
  const location = useLocation()

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="material-symbols-outlined text-[#2563EB]">grid_view</span>
        {sectionTabs.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={`rounded-full px-3 py-1.5 transition ${
              location.pathname === item.to ? 'bg-blue-50 text-[#2563EB]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
