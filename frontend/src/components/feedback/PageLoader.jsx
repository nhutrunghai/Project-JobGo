export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
      <div className="flex items-center gap-3 text-sm font-semibold">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        Đang tải...
      </div>
    </div>
  )
}
