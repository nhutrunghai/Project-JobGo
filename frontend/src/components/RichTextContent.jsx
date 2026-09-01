import DOMPurify from 'dompurify'

function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function toSafeHtml(value) {
  const source = String(value || '')
  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(source)
  const html = looksLikeHtml
    ? source
    : escapeText(source).split(/\n{2,}/).map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('')

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: [],
  })
}

export default function RichTextContent({ value, className = '' }) {
  return (
    <div
      className={`rich-text-content text-sm leading-6 text-slate-600 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:font-bold [&_h3]:text-slate-800 [&_ul]:mb-3 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:mb-3 [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:mb-1 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 ${className}`}
      dangerouslySetInnerHTML={{ __html: toSafeHtml(value) }}
    />
  )
}
