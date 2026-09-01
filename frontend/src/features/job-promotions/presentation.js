export const PROMOTION_STATUS_LABELS = {
  scheduled: 'Đã lên lịch',
  active: 'Đang hiển thị',
  expired: 'Đã hết hạn',
  cancelled: 'Đã hủy',
}

export const PROMOTION_STATUS_TONES = {
  scheduled: 'border-blue-200 bg-blue-50 text-blue-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  expired: 'border-amber-200 bg-amber-50 text-amber-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
}

export const PROMOTION_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  ...Object.entries(PROMOTION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export function getPromotionDurationDays(promotion) {
  const startsAt = new Date(promotion?.starts_at || 0)
  const endsAt = new Date(promotion?.ends_at || 0)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return 0
  return Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / 86400000))
}

export function getPromotionTypeLabel(value) {
  if (value === 'homepage_featured') return 'Quảng cáo trang chủ'
  return value || 'Quảng cáo'
}
