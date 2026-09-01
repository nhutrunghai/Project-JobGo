import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminLayout from '../../components/AdminLayout.jsx'
import {
  getAdminCompanies,
  getAdminDashboardSummary,
  getAdminJobs,
  getAdminUsers,
} from '../../api/adminService.js'
import { queryKeys } from '../../lib/queryKeys.js'

const metricToneMap = {
  slate: 'border-slate-200 bg-white text-slate-900',
  indigo: 'border-indigo-100 bg-indigo-50 text-indigo-950',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-950',
  amber: 'border-amber-100 bg-amber-50 text-amber-950',
}

const statusLabelMap = {
  draft: 'B\u1ea3n nh\u00e1p',
  open: '\u0110ang tuy\u1ec3n',
  paused: 'T\u1ea1m d\u1eebng',
  closed: '\u0110\u00e3 \u0111\u00f3ng',
  expired: 'H\u1ebft h\u1ea1n',
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '--'
  return new Intl.NumberFormat('vi-VN').format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return 'Ch\u01b0a c\u00f3'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Ch\u01b0a c\u00f3'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function percent(part, total) {
  if (!total) return 0
  return Math.min(100, Math.round((Number(part || 0) / Number(total)) * 100))
}

function MiniTrend({ values, color = '#4f46e5' }) {
  const points = values.map((value, index) => {
    const x = 8 + index * (104 / Math.max(values.length - 1, 1))
    const y = 42 - (Number(value) / Math.max(...values, 1)) * 28
    return `${x},${y}`
  })

  return (
    <svg viewBox="0 0 120 48" className="h-12 w-full" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" points={points.join(' ')} />
      <line x1="8" y1="42" x2="112" y2="42" stroke="#e2e8f0" strokeWidth="1" />
    </svg>
  )
}

function MetricCard({ label, value, hint, icon, tone = 'slate', progress }) {
  return (
    <article className={`rounded-lg border p-3.5 shadow-sm ${metricToneMap[tone] || metricToneMap.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-55">{label}</p>
          <p className="mt-2 text-[28px] font-extrabold leading-none tracking-tight">{formatNumber(value)}</p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/70 text-slate-700 ring-1 ring-black/5">
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
      </div>
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
          <div className="h-full rounded-full bg-current opacity-55" style={{ width: `${progress ?? 48}%` }} />
        </div>
        <p className="mt-2 text-[11px] font-semibold opacity-60">{hint}</p>
      </div>
    </article>
  )
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex h-11 items-center justify-between gap-3 border-b border-slate-100 px-4">
        <h2 className="text-[13px] font-extrabold tracking-tight text-slate-950">{title}</h2>
        {action ? <div className="text-[12px] font-bold text-slate-500">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export default function AdminDashboard() {
  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard.admin.summary,
    queryFn: getAdminDashboardSummary,
  })
  const usersQuery = useQuery({
    queryKey: queryKeys.dashboard.admin.users,
    queryFn: () => getAdminUsers({ page: 1, limit: 5 }),
  })
  const companiesQuery = useQuery({
    queryKey: queryKeys.dashboard.admin.companies,
    queryFn: () => getAdminCompanies({ page: 1, limit: 5 }),
  })
  const jobsQuery = useQuery({
    queryKey: queryKeys.dashboard.admin.jobs,
    queryFn: () => getAdminJobs({ page: 1, limit: 6 }),
  })
  const blockedJobsQuery = useQuery({
    queryKey: queryKeys.dashboard.admin.blockedJobs,
    queryFn: () => getAdminJobs({ page: 1, limit: 4, moderation_status: 'blocked' }),
  })
  const summary = summaryQuery.data || null
  const users = usersQuery.data?.users ?? []
  const companies = companiesQuery.data?.companies ?? []
  const jobs = jobsQuery.data?.jobs ?? []
  const blockedJobs = blockedJobsQuery.data?.jobs ?? []
  const loading = [
    summaryQuery,
    usersQuery,
    companiesQuery,
    jobsQuery,
    blockedJobsQuery,
  ].some((query) => query.isPending || query.isFetching)

  const derived = useMemo(() => {
    const totalUsers = summary?.total_users || 0
    const totalCompanies = summary?.total_companies || 0
    const totalJobs = summary?.total_jobs || 0
    const openJobs = summary?.open_jobs || 0
    const unverifiedUsers = summary?.unverified_users || 0
    const unverifiedCompanies = summary?.unverified_companies || 0
    const totalApplications = summary?.total_applications || 0

    return {
      health: Math.max(0, 100 - Math.round((percent(unverifiedUsers, totalUsers) + percent(unverifiedCompanies, totalCompanies)) / 2)),
      openJobRate: percent(openJobs, totalJobs),
      userVerifyRate: 100 - percent(unverifiedUsers, totalUsers),
      companyVerifyRate: 100 - percent(unverifiedCompanies, totalCompanies),
      trend: [
        Math.max(1, Math.round(totalUsers * 0.38)),
        Math.max(2, Math.round(totalCompanies * 1.8)),
        Math.max(3, Math.round(totalJobs * 0.45)),
        Math.max(4, Math.round(totalApplications * 8 + 8)),
        Math.max(5, Math.round(openJobs * 0.62 + 12)),
        Math.max(6, Math.round(totalJobs * 0.7 + 18)),
      ],
    }
  }, [summary])

  return (
    <AdminLayout
      title={'T\u1ed5ng quan'}
      subtitle={'T\u1ed5ng quan v\u1eadn h\u00e0nh h\u1ec7 th\u1ed1ng t\u1eeb d\u1eef li\u1ec7u ng\u01b0\u1eddi d\u00f9ng, doanh nghi\u1ec7p, tin tuy\u1ec3n d\u1ee5ng v\u00e0 h\u1ed3 s\u01a1 \u1ee9ng tuy\u1ec3n.'}
    >
      <section className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">{'Trung t\u00e2m \u0111i\u1ec1u h\u00e0nh'}</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{'B\u1ea3ng \u0111i\u1ec1u h\u00e0nh qu\u1ea3n tr\u1ecb'}</h2>
              <p className="mt-2 max-w-2xl text-[13px] font-medium leading-5 text-slate-400">
                {'Theo d\u00f5i ng\u01b0\u1eddi d\u00f9ng, doanh nghi\u1ec7p, tin tuy\u1ec3n d\u1ee5ng v\u00e0 h\u00e0ng \u0111\u1ee3i ki\u1ec3m duy\u1ec7t trong m\u1ed9t m\u00e0n h\u00ecnh.'}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{'S\u1ee9c kh\u1ecfe h\u1ec7 th\u1ed1ng'}</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-300">{derived.health}%</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-white/[0.04] p-3 ring-1 ring-white/10">
              <p className="text-[11px] font-semibold text-slate-400">{'T\u1ef7 l\u1ec7 tin \u0111ang tuy\u1ec3n'}</p>
              <p className="mt-1 text-xl font-extrabold">{derived.openJobRate}%</p>
            </div>
            <div className="rounded-md bg-white/[0.04] p-3 ring-1 ring-white/10">
              <p className="text-[11px] font-semibold text-slate-400">{'Ng\u01b0\u1eddi d\u00f9ng \u0111\u00e3 x\u00e1c minh'}</p>
              <p className="mt-1 text-xl font-extrabold">{derived.userVerifyRate}%</p>
            </div>
            <div className="rounded-md bg-white/[0.04] p-3 ring-1 ring-white/10">
              <p className="text-[11px] font-semibold text-slate-400">{'Doanh nghi\u1ec7p \u0111\u00e3 x\u00e1c minh'}</p>
              <p className="mt-1 text-xl font-extrabold">{derived.companyVerifyRate}%</p>
            </div>
          </div>
        </div>

        <Panel title={'T\u00edn hi\u1ec7u v\u1eadn h\u00e0nh'} action={loading ? '\u0110ang t\u1ea3i' : 'Tr\u1ef1c ti\u1ebfp'}>
          <MiniTrend values={derived.trend} />
          <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="font-bold text-slate-500">{'\u1ee8ng tuy\u1ec3n'}</p>
              <p className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(summary?.total_applications)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="font-bold text-slate-500">{'Tin b\u1ecb ch\u1eb7n'}</p>
              <p className="mt-1 text-lg font-extrabold text-slate-950">{formatNumber(blockedJobs.length)}</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard label={'Ng\u01b0\u1eddi d\u00f9ng'} value={summary?.total_users} hint={`${formatNumber(summary?.unverified_users)} ch\u01b0a x\u00e1c minh`} icon="group" tone="indigo" progress={derived.userVerifyRate} />
        <MetricCard label={'Doanh nghi\u1ec7p'} value={summary?.total_companies} hint={`${formatNumber(summary?.unverified_companies)} c\u1ea7n duy\u1ec7t`} icon="apartment" tone="emerald" progress={derived.companyVerifyRate} />
        <MetricCard label={'Tin tuy\u1ec3n d\u1ee5ng'} value={summary?.total_jobs} hint={`${formatNumber(summary?.open_jobs)} \u0111ang m\u1edf`} icon="work" tone="amber" progress={derived.openJobRate} />
        <MetricCard label={'H\u1ed3 s\u01a1 \u1ee9ng tuy\u1ec3n'} value={summary?.total_applications} hint={'T\u1ed5ng h\u1ed3 s\u01a1 \u0111\u00e3 ghi nh\u1eadn'} icon="assignment_ind" tone="slate" progress={Math.min(100, (summary?.total_applications || 0) * 12)} />
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <Panel title={'Tin tuy\u1ec3n d\u1ee5ng m\u1edbi nh\u1ea5t'} action={`${jobs.length} b\u1ea3n ghi`}>
          <div className="overflow-hidden rounded-md border border-slate-100">
            <div className="hidden grid-cols-[minmax(0,1.2fr)_150px_110px_90px] bg-slate-50 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400 md:grid">
              <span>{'Tin tuy\u1ec3n d\u1ee5ng'}</span>
              <span>{'Doanh nghi\u1ec7p'}</span>
              <span>{'Tr\u1ea1ng th\u00e1i'}</span>
              <span>{'C\u1eadp nh\u1eadt'}</span>
            </div>
            {jobs.map((job) => (
              <div key={job._id} className="border-t border-slate-100 px-3 py-2.5 text-[12px] md:grid md:grid-cols-[minmax(0,1.2fr)_150px_110px_90px] md:items-center md:gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{job.title}</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                    {job.level || 'Ch\u01b0a c\u00f3 c\u1ea5p b\u1eadc'} {'\u00b7'} {job.location || 'Ch\u01b0a c\u00f3 \u0111\u1ecba \u0111i\u1ec3m'}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0 md:contents">
                  <p className="truncate font-semibold text-slate-600">{job.company?.company_name || 'Ch\u01b0a c\u00f3 doanh nghi\u1ec7p'}</p>
                  <span className="w-fit rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                    {statusLabelMap[job.status] || job.status || 'Ch\u01b0a r\u00f5'}
                  </span>
                  <p className="font-semibold text-slate-500">{formatDate(job.updated_at)}</p>
                </div>
              </div>
            ))}
            {!jobs.length ? <div className="px-3 py-6 text-center text-[13px] font-semibold text-slate-400">{'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u tin tuy\u1ec3n d\u1ee5ng.'}</div> : null}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title={'H\u00e0ng \u0111\u1ee3i ki\u1ec3m duy\u1ec7t'} action={blockedJobs.length ? 'C\u1ea7n xem' : '\u1ed4n \u0111\u1ecbnh'}>
            <div className="space-y-2">
              {blockedJobs.map((job) => (
                <div key={job._id} className="rounded-md border border-rose-100 bg-rose-50/60 p-3">
                  <p className="truncate text-[13px] font-extrabold text-slate-950">{job.title}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold text-rose-700">{job.blocked_reason || '\u0110\u00e3 b\u1ecb ch\u1eb7n b\u1edfi qu\u1ea3n tr\u1ecb vi\u00ean'}</p>
                </div>
              ))}
              {!blockedJobs.length ? (
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-[12px] font-bold text-emerald-800">
                  {'Kh\u00f4ng c\u00f3 tin b\u1ecb ch\u1eb7n trong danh s\u00e1ch m\u1edbi nh\u1ea5t.'}
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title={'Doanh nghi\u1ec7p m\u1edbi'}>
            <div className="space-y-2">
              {companies.slice(0, 4).map((company) => (
                <div key={company._id} className="flex flex-col gap-2 rounded-md border border-slate-100 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-extrabold text-slate-950">{company.company_name}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{formatDate(company.updated_at || company.created_at)}</p>
                  </div>
                  <span className={`w-fit rounded-full px-2 py-1 text-[10px] font-extrabold ${company.verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {company.verified ? '\u0110\u00e3 x\u00e1c minh' : 'Ch\u1edd duy\u1ec7t'}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section className="mt-3">
        <Panel title={'Ng\u01b0\u1eddi d\u00f9ng c\u1eadp nh\u1eadt g\u1ea7n \u0111\u00e2y'} action={`${users.length} ng\u01b0\u1eddi d\u00f9ng`}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
            {users.map((user) => (
              <div key={user._id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[12px] font-extrabold text-slate-700 ring-1 ring-slate-200">
                    {(user.fullName || user.email || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-extrabold text-slate-950">{user.fullName || user.username || 'Ng\u01b0\u1eddi d\u00f9ng'}</p>
                    <p className="truncate text-[11px] font-medium text-slate-500">{user.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </AdminLayout>
  )
}
