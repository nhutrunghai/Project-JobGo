import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/layout/PublicHeader.jsx'
import useCurrentUser from '../hooks/useCurrentUser.js'
import { loadPortalMock } from '../data/mockClient.js'
import { toSafeImageUrl } from '../utils/safeUrl.js'

export default function Discussions() {
  const session = useCurrentUser()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Tất cả')
  const [forumPosts, setForumPosts] = useState([])
  const [filterOptions, setFilterOptions] = useState(['Tất cả'])

  useEffect(() => {
    const loadData = async () => {
      try {
        const mock = await loadPortalMock()
        setForumPosts(mock?.discussions?.forumPosts || [])
        setFilterOptions(mock?.discussions?.filterOptions || ['Tất cả'])
      } catch {
        setForumPosts([])
      }
    }

    loadData()
  }, [])

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return forumPosts.filter((post) => {
      const filterOk = filter === 'Tất cả' || (post.tags || []).includes(filter)
      if (!q) return filterOk
      return filterOk && `${post.author} ${post.content} ${(post.tags || []).join(' ')}`.toLowerCase().includes(q)
    })
  }, [query, filter, forumPosts])

  return (
    <div className="min-h-screen bg-[#f2f5fa] text-slate-900">
      <PublicHeader session={session} activeNav="/discussions" containerClassName="max-w-[1180px] px-4 sm:px-5" />

      <main className="mx-auto max-w-[1180px] px-4 py-4 sm:px-5">
        <header className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="text-[21px] font-extrabold leading-tight text-slate-900 sm:text-[22px]">Diễn đàn bài viết</h1>
            <p className="mt-1 text-sm text-slate-500">
              <Link to="/" className="font-semibold text-blue-600">Trang chủ</Link> {'>'} Bài viết
            </p>
          </div>
          <div className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-600 sm:w-auto">
            {filteredPosts.length} bài viết
          </div>
        </header>

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
            <input
              className="h-10 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-[14px] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="Tìm bài viết trong diễn đàn..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-[14px] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {filterOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-3">
          {filteredPosts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <img src={toSafeImageUrl(post.avatar)} alt={post.author} className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-slate-900">{post.author}</p>
                  <p className="text-[12px] text-slate-500">{post.role} - {post.time}</p>
                </div>
              </div>
              <p className="text-[14px] leading-6 text-slate-700">{post.content}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(post.tags || []).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">#{tag}</span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Like: {post.likes ?? 0}</span>
                <span>Comments: {post.comments ?? 0}</span>
                <span>Shares: {post.shares ?? 0}</span>
              </div>
            </article>
          ))}
          {filteredPosts.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Không có bài viết phù hợp.</p>}
        </section>
      </main>
    </div>
  )
}
