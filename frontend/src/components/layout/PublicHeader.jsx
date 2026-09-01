import { Link } from 'react-router-dom'
import JobCategoryNavItem from '../JobCategoryNavItem.jsx'
import NotificationBell from '../NotificationBell.jsx'
import UserProfileMenu from './UserProfileMenu.jsx'
import { PUBLIC_NAV_ITEMS } from '../../constants/navigation.js'

const compactActionClass = 'flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 sm:h-10 sm:w-10'

export default function PublicHeader({
  session,
  activeNav = '',
  activeAccountPath = '',
  containerClassName = 'max-w-[1440px] px-4 sm:px-6',
}) {
  const {
    isAuthenticated,
    profileName,
    profileHandle,
    profileAvatar,
    logout,
  } = session

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className={`mx-auto flex items-center justify-between py-2 ${containerClassName}`}>
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" className="flex min-w-0 items-center text-lg font-bold tracking-tight text-[#2b59ff] sm:text-xl">
            <span className="material-symbols-outlined mr-1 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>code</span>
            MYCODER
          </Link>
          <div className="hidden items-center gap-4 text-[13.5px] font-medium text-slate-600 lg:flex">
            {PUBLIC_NAV_ITEMS.map((item) => (
              item.path === '/search-jobs' ? (
                <JobCategoryNavItem key={item.path} item={item} active={activeNav === item.path} />
              ) : (
                <Link
                  key={item.path}
                  className={`nav-link-animate flex items-center gap-1.5 ${activeNav === item.path ? 'font-semibold text-[#2b59ff]' : ''}`}
                  to={item.path}
                >
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  {item.label}
                </Link>
              )
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <NotificationBell className={compactActionClass} />
              <Link to="/messages" aria-label="Tin nhắn" className={compactActionClass}>
                <span className="material-symbols-outlined">chat</span>
              </Link>
              <UserProfileMenu
                profileName={profileName}
                profileHandle={profileHandle}
                profileAvatar={profileAvatar}
                activePath={activeAccountPath}
                onLogout={logout}
              />
            </>
          ) : (
            <>
              <Link to="/login" className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-sky-200 hover:text-sky-800 sm:h-10 sm:px-4 sm:text-sm">
                Đăng nhập
              </Link>
              <Link to="/register" className="inline-flex h-9 items-center justify-center rounded-full bg-[#2b59ff] px-3 text-xs font-bold text-white transition hover:bg-[#1f4bf1] sm:h-10 sm:px-4 sm:text-sm">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
        {PUBLIC_NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-bold transition ${
              activeNav === item.path
                ? 'bg-blue-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
