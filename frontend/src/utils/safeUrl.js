function parseUrl(value) {
  const source = String(value || '').trim()
  if (!source) return null

  try {
    return new URL(source, window.location.origin)
  } catch {
    return null
  }
}

export function toSafeExternalUrl(value) {
  const url = parseUrl(value)
  if (!url || !['http:', 'https:', 'mailto:'].includes(url.protocol)) return ''
  return url.href
}

export function toSafeResourceUrl(value, { allowBlob = true } = {}) {
  const url = parseUrl(value)
  if (!url) return ''
  const allowedProtocols = allowBlob ? ['http:', 'https:', 'blob:'] : ['http:', 'https:']
  return allowedProtocols.includes(url.protocol) ? url.href : ''
}

export function toSafeImageUrl(value) {
  const source = String(value || '').trim()
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(source)) return source
  return toSafeResourceUrl(source)
}
