import DOMPurify from 'dompurify'

// DOMPurify 설정
export const ALLOWED_TAGS: string[] = [
  'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u',
  'header', 'footer', 'nav', 'main', 'aside', 'article', 'section',
  'figure', 'figcaption', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'button', 'svg', 'path',
]

export const ALLOWED_ATTR: string[] = [
  'class', 'id', 'href', 'src', 'alt', 'title', 'style',
  'data-post-id', 'data-blog-id', 'data-category-id',
  'target', 'rel', 'width', 'height', 'loading',
  'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd',
]

export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: true })
}

export function sanitizeCSS(css: string): string {
  const dangerousPatterns = [/expression\s*\(/gi, /javascript\s*:/gi, /behavior\s*:/gi, /@import\s+url\s*\(/gi]
  let sanitized = css
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '/* blocked */')
  }
  return sanitized
}

// 날짜 포맷 함수
export function formatPreviewDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}
