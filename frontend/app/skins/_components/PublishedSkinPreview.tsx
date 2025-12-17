'use client'

import { PublishedSkin } from '@/lib/api/skins'
import { Post } from '@/lib/api/posts'
import { renderTemplate, TemplateContext } from '@/lib/utils/templateRenderer'
import { sanitizeHTML } from '@/lib/utils/sanitize'

interface PublishedSkinPreviewProps {
  publishedSkins: PublishedSkin[]
  selectedSkinId: string
  userBlog: { id: string; name: string; description: string | null } | null
  blogPosts: Post[]
  displayImage: string | null | undefined
  subscriberCount: number
  visitorCount: number
}

// 커뮤니티 스킨 미리보기 컴포넌트 (DOMPurify로 HTML 정제됨)
export default function PublishedSkinPreview({
  publishedSkins,
  selectedSkinId,
  userBlog,
  blogPosts,
  displayImage,
  subscriberCount,
  visitorCount,
}: PublishedSkinPreviewProps) {
  const publishedSkin = publishedSkins.find(s => s.id === selectedSkinId)

  if (!publishedSkin) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-neutral-500">스킨 데이터를 불러올 수 없습니다</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }

  const templateContext: TemplateContext = {
    blog_id: userBlog?.id || 'preview',
    blog_name: userBlog?.name || '내 블로그',
    blog_description: userBlog?.description || '',
    profile_image: displayImage || '',
    post_count: blogPosts.length,
    subscriber_count: subscriberCount,
    visitor_count: visitorCount,
    current_year: new Date().getFullYear(),
    no_posts: blogPosts.length === 0,
    posts: blogPosts.map((p) => ({
      post_id: p.id,
      post_title: p.title,
      post_excerpt: p.content ? p.content.replace(/<[^>]*>/g, '').substring(0, 100) : '',
      post_date: formatDate(p.created_at),
      thumbnail_url: p.thumbnail_url || undefined,
      view_count: p.view_count || 0,
      like_count: p.like_count || 0,
      blog_id: userBlog?.id || 'preview',
    })),
  }

  const partials = { post_item: publishedSkin.html_post_item || '' }
  const renderedHeader = renderTemplate(publishedSkin.html_header || '', templateContext, partials)
  const renderedPostList = renderTemplate(publishedSkin.html_post_list || '', templateContext, partials)
  const renderedSidebar = renderTemplate(publishedSkin.html_sidebar || '', templateContext, partials)
  const renderedFooter = renderTemplate(publishedSkin.html_footer || '', templateContext, partials)

  // DOMPurify sanitizeHTML로 XSS 방지 (lib/utils/sanitize.ts에서 ALLOWED_TAGS, ALLOWED_ATTR 설정)
  const fullHtml = sanitizeHTML(`
    ${renderedHeader}
    <main style="max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem;">
      <div style="display: flex; gap: 2rem;">
        <div style="flex: 1;">${renderedPostList}</div>
        <aside style="width: 280px; flex-shrink: 0;">${renderedSidebar}</aside>
      </div>
    </main>
    ${renderedFooter}
  `)

  return (
    <div
      className="h-[600px] overflow-auto"
      style={{
        '--blog-bg': '#ffffff',
        '--blog-fg': '#000000',
        '--blog-accent': '#000000',
        '--blog-muted': '#666666',
        '--blog-border': '#e5e5e5',
        '--blog-card-bg': '#fafafa',
        backgroundColor: 'var(--blog-bg)',
        color: 'var(--blog-fg)',
      } as React.CSSProperties}
    >
      <style>{publishedSkin.custom_css || ''}</style>
      {/* sanitizeHTML (DOMPurify)로 정제된 안전한 HTML */}
      <div className="custom-skin-wrapper" dangerouslySetInnerHTML={{ __html: fullHtml }} />
    </div>
  )
}
