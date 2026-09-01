import { useState } from 'react'
import { toSafeImageUrl } from '../utils/safeUrl.js'

function getInitials(value) {
  const words = String(value || 'U')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
  }

  return String(words[0] || 'U').slice(0, 2).toUpperCase()
}

export default function UserAvatar({ src, name, className = 'h-9 w-9', textClassName = 'text-sm' }) {
  const [failed, setFailed] = useState(false)
  const safeSrc = toSafeImageUrl(src)
  const shouldShowImage = Boolean(safeSrc) && !failed

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-600 ${className}`}>
      {shouldShowImage ? (
        <img src={safeSrc} alt={name || 'User'} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className={textClassName}>{getInitials(name)}</span>
      )}
    </div>
  )
}
