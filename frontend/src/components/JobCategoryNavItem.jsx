import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobCategories } from '../api/companyService.js'

function buildCategoryTree(categories = []) {
  const normalized = categories.map((item) => ({
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
    if (parent) parent.children.push(item)
    else roots.push(item)
  })

  return roots
}

function categorySearchLink(category) {
  const params = new URLSearchParams({
    category_id: category.id,
    category_name: category.label,
  })
  return `/search-jobs?${params.toString()}`
}

function CategoryTreeLink({ category, depth = 0 }) {
  const children = Array.isArray(category.children) ? category.children : []

  return (
    <div className={depth ? 'ml-4 border-l border-slate-200 pl-3' : ''}>
      <Link
        to={categorySearchLink(category)}
        className="group flex min-w-0 items-start justify-between gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
      >
        <span className="min-w-0 whitespace-normal break-words leading-5">{category.label}</span>
        <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-slate-300 transition group-hover:text-blue-600">arrow_forward</span>
      </Link>

      {children.length ? (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <CategoryTreeLink key={child.id} category={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function JobCategoryDropdown({ categories, isLoading }) {
  const [activeRootId, setActiveRootId] = useState('')
  const activeRoot = categories.find((category) => category.id === activeRootId) || categories[0]
  const rootChildren = Array.isArray(activeRoot?.children) ? activeRoot.children : []

  return (
    <div className="invisible absolute left-0 top-full z-50 w-[820px] max-w-[calc(100vw-2rem)] translate-y-2 pt-4 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] ring-1 ring-slate-950/5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[13px] font-extrabold text-slate-900">Danh mục việc làm</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Chọn nhanh theo nhóm ngành và kỹ năng.</p>
          </div>
          <Link to="/search-jobs" className="shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-[12px] font-bold text-blue-700 transition hover:bg-blue-100">
            Xem tất cả
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-[240px_1fr] gap-0 p-4">
            <div className="space-y-2 border-r border-slate-100 pr-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
            <div className="grid grid-cols-2 gap-3 pl-4">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          </div>
        ) : categories.length ? (
          <div className="grid max-h-[520px] grid-cols-[250px_1fr]">
            <div className="max-h-[520px] overflow-y-auto border-r border-slate-100 bg-slate-50/70 p-3">
              <div className="space-y-1">
                {categories.map((category) => {
                  const isActive = activeRoot?.id === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onMouseEnter={() => setActiveRootId(category.id)}
                      onFocus={() => setActiveRootId(category.id)}
                      className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-bold transition ${
                        isActive ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-700 hover:bg-white hover:text-blue-700'
                      }`}
                    >
                      <span className="min-w-0 whitespace-normal break-words leading-5">{category.label}</span>
                      <span className="material-symbols-outlined shrink-0 text-[17px]">chevron_right</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-4">
              <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-blue-600">Nhóm danh mục</p>
                  <h3 className="mt-1 whitespace-normal break-words text-base font-extrabold text-slate-950">{activeRoot?.label}</h3>
                </div>
                {activeRoot ? (
                  <Link to={categorySearchLink(activeRoot)} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-blue-700 shadow-sm transition hover:bg-blue-600 hover:text-white">
                    Xem nhóm này
                  </Link>
                ) : null}
              </div>

              {rootChildren.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {rootChildren.map((child) => (
                    <CategoryTreeLink key={child.id} category={child} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-500">
                  Danh mục này chưa có danh mục con.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500">Chưa có danh mục việc làm.</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobCategoryNavItem({ item, active = false }) {
  const [jobCategories, setJobCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const categoryTree = useMemo(() => buildCategoryTree(jobCategories), [jobCategories])

  useEffect(() => {
    let mounted = true

    getJobCategories()
      .then((categories) => {
        if (mounted) setJobCategories(Array.isArray(categories) ? categories : [])
      })
      .catch(() => {
        if (mounted) setJobCategories([])
      })
      .finally(() => {
        if (mounted) setIsLoadingCategories(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="group relative">
      <Link className={`nav-link-animate flex items-center gap-1.5 ${active ? 'font-semibold text-[#2b59ff]' : ''}`} to={item.path}>
        <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
        {item.label}
        <span className="material-symbols-outlined text-[16px] text-slate-400 transition group-hover:rotate-180 group-hover:text-blue-600">expand_more</span>
      </Link>
      <JobCategoryDropdown categories={categoryTree} isLoading={isLoadingCategories} />
    </div>
  )
}
