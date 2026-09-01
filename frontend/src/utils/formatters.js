const VI_LOCALE = 'vi-VN'

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateVi(value, { fallback = 'Chưa có' } = {}) {
  const date = parseDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(VI_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTimeVi(value, { fallback = 'Chưa có' } = {}) {
  const date = parseDate(value)
  if (!date) return fallback
  return new Intl.DateTimeFormat(VI_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatCurrencyVi(value, currency = 'VND') {
  const normalizedCurrency = currency || 'VND'
  return new Intl.NumberFormat(VI_LOCALE, {
    style: 'currency',
    currency: normalizedCurrency,
    maximumFractionDigits: normalizedCurrency === 'VND' ? 0 : 2,
  }).format(Number(value || 0))
}

export function compactId(value, { prefix = 8, suffix = 6, fallback = 'Chưa có' } = {}) {
  if (!value) return fallback
  const normalized = String(value)
  if (normalized.length <= prefix + suffix) return normalized
  return `${normalized.slice(0, prefix)}...${normalized.slice(-suffix)}`
}

export function toIsoString(value) {
  const date = parseDate(value)
  return date ? date.toISOString() : undefined
}
