import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import UserAvatar from '../UserAvatar.jsx'
import { USER_MENU_ITEMS } from '../../constants/navigation.js'

export default function UserProfileMenu({ profileName, profileHandle, profileAvatar, activePath = '', onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Mở menu tài khoản"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="block h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-slate-200 transition hover:ring-2 hover:ring-blue-100"
      >
        <UserAvatar src={profileAvatar} name={profileName} className="h-full w-full" textClassName="text-xs" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[60] w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.28)]">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-bold text-slate-800">{profileName}</p>
            <p className="truncate text-xs text-slate-400">{profileHandle}</p>
          </div>
          <div className="pt-2">
            {USER_MENU_ITEMS.map((item) => {
              const active = activePath === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100'
                      : 'font-medium text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Đăng xuất
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
