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

/**
 * CSS를 특정 컨테이너 내부에만 적용되도록 스코핑
 * 모든 선택자 앞에 containerSelector를 붙임
 */
export function scopeCSS(css: string, containerSelector: string): string {
  if (!css.trim()) return ''

  // 먼저 위험한 패턴 제거
  let scoped = sanitizeCSS(css)

  // CSS 규칙 파싱 및 스코핑
  // @media, @keyframes 등의 at-rule 처리
  scoped = scoped.replace(
    /([^{}@]+)(\{[^{}]*\})/g,
    (match, selectors: string, body: string) => {
      // at-rule 내부가 아닌 일반 선택자만 처리
      const scopedSelectors = selectors
        .split(',')
        .map((selector: string) => {
          const trimmed = selector.trim()
          if (!trimmed) return ''

          // body, html, :root 등 전역 선택자는 컨테이너로 대체
          if (/^(body|html|:root)$/i.test(trimmed)) {
            return containerSelector
          }

          // * 선택자는 컨테이너 하위로
          if (trimmed === '*') {
            return `${containerSelector} *`
          }

          // 이미 스코핑된 경우 건너뛰기
          if (trimmed.startsWith(containerSelector)) {
            return trimmed
          }

          // 일반 선택자에 컨테이너 프리픽스 추가
          return `${containerSelector} ${trimmed}`
        })
        .filter(Boolean)
        .join(', ')

      return `${scopedSelectors}${body}`
    }
  )

  // @media 쿼리 내부도 처리
  scoped = scoped.replace(
    /@media[^{]+\{([\s\S]*?)\}\s*\}/g,
    (match, content: string) => {
      const mediaQuery = match.substring(0, match.indexOf('{') + 1)
      const scopedContent = content.replace(
        /([^{}]+)(\{[^{}]*\})/g,
        (innerMatch, selectors: string, body: string) => {
          const scopedSelectors = selectors
            .split(',')
            .map((selector: string) => {
              const trimmed = selector.trim()
              if (!trimmed) return ''
              if (/^(body|html|:root)$/i.test(trimmed)) return containerSelector
              if (trimmed === '*') return `${containerSelector} *`
              if (trimmed.startsWith(containerSelector)) return trimmed
              return `${containerSelector} ${trimmed}`
            })
            .filter(Boolean)
            .join(', ')
          return `${scopedSelectors}${body}`
        }
      )
      return `${mediaQuery}${scopedContent}}`
    }
  )

  return scoped
}

// 날짜 포맷 함수
export function formatPreviewDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}
