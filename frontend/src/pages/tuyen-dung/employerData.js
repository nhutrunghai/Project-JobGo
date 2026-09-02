export const statusOptions = ['Tất cả trạng thái', 'Đang hoạt động', 'Bản nháp', 'Tạm dừng', 'Đã đóng', 'Hết hạn']

export function formatDate(dateString) {
  if (!dateString) return '--/--/----'
  const date = new Date(dateString)
  if (!Number.isNaN(date.getTime())) return date.toLocaleDateString('vi-VN')
  const [year, month, day] = String(dateString).split('-')
  return year && month && day ? `${day}/${month}/${year}` : '--/--/----'
}
