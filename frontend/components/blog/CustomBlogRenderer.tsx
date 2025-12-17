'use client'

import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { useBlogSkin } from './BlogSkinProvider'
import {
  renderCustomSkinPage,
  renderTemplate,
  TemplateContext,
  PostItem,
  formatDate,
} from '@/lib/utils/templateRenderer'

interface BlogData {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

interface PostData {
  id: string
  title: string
  content?: string
  excerpt?: string
  thumbnail_url?: string | null
  created_at: string
  view_count?: number
  like_count?: number
  blog_id: string
  category?: {
    id: string
    name: string
  }
}

interface CustomBlogRendererProps {
  blog: BlogData
  postCount: number
  subscriberCount?: number
  visitorCount?: number
  posts?: PostData[]
  post?: PostData
  categories?: { id: string; name: string }[]
  pageType: 'list' | 'detail'
  isOwner?: boolean
  children: React.ReactNode
}

// DOMPurify 허용 태그
const ALLOWED_TAGS: string[] = [
  'div', 'span', 'p', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u',
  'header', 'footer', 'nav', 'main', 'aside', 'article', 'section',
  'figure', 'figcaption', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'button', 'input', 'form', 'label', 'select', 'option', 'textarea',
]

// DOMPurify 허용 속성
const ALLOWED_ATTR: string[] = [
  'class', 'id', 'href', 'src', 'alt', 'title', 'style',
  'data-post-id', 'data-blog-id', 'data-category-id',
  'target', 'rel', 'type', 'name', 'value', 'placeholder',
  'width', 'height', 'loading',
]

// CSS 정제 - 위험한 CSS 속성 제거
function sanitizeCSS(css: string): string {
  // expression(), javascript:, behavior: 등 위험한 패턴 제거
  const dangerousPatterns = [
    /expression\s*\(/gi,
    /javascript\s*:/gi,
    /behavior\s*:/gi,
    /@import\s+url\s*\(/gi,
    /binding\s*:/gi,
  ]

  let sanitized = css
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '/* blocked */')
  }

  return sanitized
}

// HTML 정제
function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // SSR에서는 빈 문자열 반환 (클라이언트에서 렌더링)
    return ''
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  })
}

export default function CustomBlogRenderer({
  blog,
  postCount,
  subscriberCount = 0,
  visitorCount = 0,
  posts = [],
  post,
  categories = [],
  pageType,
  isOwner = false,
  children,
}: CustomBlogRendererProps) {
  const { customSkin, isCustomSkinActive } = useBlogSkin()

  // 템플릿 컨텍스트 생성
  const templateContext = useMemo<TemplateContext>(() => {
    const ctx: TemplateContext = {
      blog_id: blog.id,
      blog_name: blog.name,
      blog_description: blog.description || '',
      profile_image: blog.thumbnail_url || '',
      post_count: postCount,
      subscriber_count: subscriberCount,
      visitor_count: visitorCount,
      current_year: new Date().getFullYear(),
      no_posts: posts.length === 0,
    }

    // 게시글 목록
    if (posts.length > 0) {
      ctx.posts = posts.map((p): PostItem => ({
        post_id: p.id,
        post_title: p.title,
        post_excerpt: p.excerpt || '',
        post_date: formatDate(p.created_at),
        thumbnail_url: p.thumbnail_url || undefined,
        view_count: p.view_count || 0,
        like_count: p.like_count || 0,
        blog_id: p.blog_id,
      }))
    }

    // 카테고리 목록
    if (categories.length > 0) {
      ctx.categories = categories.map((c) => ({
        category_id: c.id,
        category_name: c.name,
        blog_id: blog.id,
      }))
    }

    // 게시글 상세 (detail 페이지용)
    if (post) {
      ctx.post_id = post.id
      ctx.post_title = post.title
      ctx.post_content = post.content || ''
      ctx.post_excerpt = post.excerpt || ''
      ctx.post_date = formatDate(post.created_at)
      ctx.thumbnail_url = post.thumbnail_url || ''
      ctx.category_name = post.category?.name || ''
      ctx.view_count = post.view_count || 0
      ctx.like_count = post.like_count || 0
    }

    return ctx
  }, [blog, postCount, subscriberCount, visitorCount, posts, post, categories])

  // 커스텀 스킨 렌더링 결과
  const renderedContent = useMemo(() => {
    if (!isCustomSkinActive || !customSkin) {
      return null
    }

    // 통합 템플릿 모드 감지: html_header에만 내용이 있고 다른 섹션들이 비어있으면 통합 모드
    const isUnifiedMode = customSkin.html_header &&
      !customSkin.html_post_list &&
      !customSkin.html_sidebar &&
      !customSkin.html_footer

    if (isUnifiedMode) {
      // 통합 템플릿 모드: html_header를 전체 페이지로 렌더링
      const partials = {
        post_item: customSkin.html_post_item || `<article class="post-item">
  <a href="/post/{{post_id}}" class="post-link">
    <div class="post-content">
      <h3 class="post-title">{{post_title}}</h3>
      <p class="post-excerpt">{{post_excerpt}}</p>
      <div class="post-meta">
        <span class="post-date">{{post_date}}</span>
        <span class="meta-divider">·</span>
        <span class="post-views">{{view_count}} 조회</span>
        <span class="post-likes">{{like_count}} 좋아요</span>
      </div>
    </div>
    {{#if thumbnail_url}}
    <div class="post-thumbnail">
      <img src="{{thumbnail_url}}" alt="{{post_title}}">
    </div>
    {{/if}}
  </a>
</article>`,
      }

      const fullHtml = renderTemplate(customSkin.html_header, templateContext, partials)

      return {
        isUnifiedMode: true,
        fullHtml: sanitizeHTML(fullHtml),
        customCss: sanitizeCSS(customSkin.custom_css),
      }
    }

    // 기존 개별 섹션 모드
    const templates = {
      html_head: customSkin.html_head,
      html_header: customSkin.html_header,
      html_post_list: customSkin.html_post_list,
      html_post_item: customSkin.html_post_item,
      html_post_detail: customSkin.html_post_detail,
      html_sidebar: customSkin.html_sidebar,
      html_footer: customSkin.html_footer,
      custom_css: customSkin.custom_css,
    }

    const rendered = renderCustomSkinPage(templates, templateContext, pageType)

    // 모든 HTML과 CSS 정제
    return {
      isUnifiedMode: false,
      headerHtml: sanitizeHTML(rendered.headerHtml),
      contentHtml: sanitizeHTML(rendered.contentHtml),
      sidebarHtml: sanitizeHTML(rendered.sidebarHtml),
      footerHtml: sanitizeHTML(rendered.footerHtml),
      customCss: sanitizeCSS(rendered.customCss),
      useDefaultHeader: customSkin.use_default_header,
      useDefaultSidebar: customSkin.use_default_sidebar,
      useDefaultFooter: customSkin.use_default_footer,
    }
  }, [customSkin, isCustomSkinActive, templateContext, pageType])

  // 커스텀 스킨이 활성화되어 있지 않으면 기본 컴포넌트 렌더링
  if (!isCustomSkinActive || !customSkin || !renderedContent) {
    return <>{children}</>
  }

  // 통합 템플릿 모드: 전체 HTML을 하나로 렌더링 (DOMPurify로 정화됨)
  if (renderedContent.isUnifiedMode) {
    return (
      <div
        className="custom-skin-wrapper min-h-screen"
        style={{
          backgroundColor: 'var(--blog-bg, #ffffff)',
          color: 'var(--blog-fg, #000000)',
        }}
      >
        {/* CSS Grid 레이아웃 + 커스텀 CSS */}
        <style>{`
          .custom-skin-unified {
            display: grid;
            grid-template-columns: 1fr 320px;
            grid-template-rows: auto 1fr auto;
            grid-template-areas:
              "header header"
              "content sidebar"
              "footer footer";
            gap: 0 2rem;
            max-width: 1280px;
            margin: 0 auto;
            min-height: 100vh;
          }
          .custom-skin-unified .blog-header {
            grid-area: header;
            max-width: none;
            width: 100%;
          }
          .custom-skin-unified .blog-sidebar {
            grid-area: sidebar;
            width: 100%;
            padding-top: 2.5rem;
          }
          .custom-skin-unified .blog-footer {
            grid-area: footer;
          }
          .custom-skin-unified .post-list,
          .custom-skin-unified .post-detail {
            grid-area: content;
            padding: 2.5rem 1.5rem;
          }
          /* blog-main-layout이 있는 경우 flex 레이아웃 */
          .custom-skin-unified .blog-main-layout {
            grid-column: 1 / -1;
            grid-row: 2;
            display: flex;
            flex-direction: row;
            gap: 2rem;
            padding: 2.5rem 1.5rem;
          }
          .custom-skin-unified .blog-main-layout .blog-content-area {
            flex: 1;
            min-width: 0;
          }
          .custom-skin-unified .blog-main-layout .blog-sidebar {
            width: 320px;
            flex-shrink: 0;
            padding-top: 0;
          }
          ${renderedContent.customCss}
        `}</style>
        <div className="custom-skin-unified" dangerouslySetInnerHTML={{ __html: renderedContent.fullHtml || '' }} />
        {isOwner && (
          <div className="fixed bottom-6 right-6 z-50">
            <a href="/write" className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-110 dark:bg-white dark:text-black">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </a>
          </div>
        )}
      </div>
    )
  }

  // 기존 개별 섹션 모드 (DOMPurify로 정화됨)
  return (
    <div
      className="custom-skin-wrapper min-h-screen"
      style={{
        backgroundColor: 'var(--blog-bg, #ffffff)',
        color: 'var(--blog-fg, #000000)',
      }}
    >
      <style>{renderedContent.customCss}</style>
      {!renderedContent.useDefaultHeader && renderedContent.headerHtml && (
        <div className="custom-skin-header" dangerouslySetInnerHTML={{ __html: renderedContent.headerHtml }} />
      )}
      <div className="custom-skin-main mx-auto flex max-w-6xl gap-8 px-6 py-10">
        <main className="custom-skin-content flex-1">
          <div dangerouslySetInnerHTML={{ __html: renderedContent.contentHtml || '' }} />
        </main>
        {!renderedContent.useDefaultSidebar && renderedContent.sidebarHtml && (
          <aside className="custom-skin-sidebar w-80 shrink-0">
            <div dangerouslySetInnerHTML={{ __html: renderedContent.sidebarHtml }} />
          </aside>
        )}
      </div>
      {!renderedContent.useDefaultFooter && renderedContent.footerHtml && (
        <div className="custom-skin-footer" dangerouslySetInnerHTML={{ __html: renderedContent.footerHtml }} />
      )}
      {isOwner && (
        <div className="fixed bottom-6 right-6 z-50">
          <a href="/write" className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-110 dark:bg-white dark:text-black">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </a>
        </div>
      )}
    </div>
  )
}
