'use client'

import { useState, useEffect } from 'react'
import SubscriptionButton from '@/components/common/SubscriptionButton'
import { createClient } from '@/lib/supabase/client'
import { getVisitorCount } from '@/lib/api/blogs'

interface Blog {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
}

interface BlogProfileSidebarProps {
  blog: Blog
  postCount: number
  isOwner: boolean
}

export default function BlogProfileSidebar({
  blog,
  postCount,
  isOwner,
}: BlogProfileSidebarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [visitorCount, setVisitorCount] = useState(0)

  // 프로필 이미지 가져오기 (thumbnail_url 우선, 없으면 profile_image_url)
  useEffect(() => {
    const fetchImage = async () => {
      if (blog.thumbnail_url && blog.thumbnail_url.trim()) {
        setImageUrl(blog.thumbnail_url)
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('profile_image_url')
          .eq('id', blog.user_id)
          .single()

        if (data?.profile_image_url) {
          setImageUrl(data.profile_image_url.replace('http://', 'https://'))
        }
      } catch {
        // ignore
      }
      setLoading(false)
    }

    fetchImage()
  }, [blog.thumbnail_url, blog.user_id])

  // 방문자 수 가져오기
  useEffect(() => {
    getVisitorCount(blog.id).then(data => {
      setVisitorCount(data.today)
    })
  }, [blog.id])

  const createdDate = new Date(blog.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="sticky top-10 space-y-6">
      {/* 프로필 카드 */}
      <div className="rounded-2xl border border-[var(--blog-border)] bg-[var(--blog-card-bg)] p-6">
        {/* 블로그 썸네일 */}
        <div className="flex flex-col items-center">
          <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[var(--blog-muted)]/10">
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--blog-muted)]/20 border-t-[var(--blog-muted)]" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={blog.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.error('[BlogProfileSidebar] Image load error:', imageUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : null}
          </div>

          <h1 className="mt-4 text-xl font-bold text-[var(--blog-fg)]">
            {blog.name}
          </h1>

          <div className="mt-2 text-center">
            <SubscriptionButton targetId={blog.user_id} className="text-xs px-3 py-1.5" variant="blog" />
          </div>

          {blog.description && (
            <p className="mt-3 text-center text-sm text-[var(--blog-muted)]">
              {blog.description}
            </p>
          )}
        </div>

        {/* 통계 */}
        <div className="mt-6 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--blog-fg)]">
              {postCount}
            </p>
            <p className="text-xs text-[var(--blog-muted)]">게시글</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--blog-fg)]">0</p>
            <p className="text-xs text-[var(--blog-muted)]">구독자</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--blog-fg)]">{visitorCount}</p>
            <p className="text-xs text-[var(--blog-muted)]">방문자</p>
          </div>
        </div>

        {/* 소유자 전용 버튼 */}
        {isOwner && (
          <div className="mt-6 space-y-2">
            <a
              href={`/blog/${blog.id}/settings`}
              className="block w-full rounded-lg border border-[var(--blog-border)] py-2.5 text-center text-sm font-medium text-[var(--blog-fg)] transition-colors hover:bg-[var(--blog-fg)]/5"
            >
              블로그 설정
            </a>
          </div>
        )}
      </div>

      {/* 블로그 정보 */}
      <div className="rounded-2xl border border-[var(--blog-border)] bg-[var(--blog-card-bg)] p-6">
        <h3 className="text-sm font-semibold text-[var(--blog-fg)]">
          블로그 정보
        </h3>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--blog-muted)]">개설일</span>
            <span className="text-[var(--blog-fg)]">{createdDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--blog-muted)]">총 게시글</span>
            <span className="text-[var(--blog-fg)]">{postCount}개</span>
          </div>
        </div>
      </div>
    </div>
  )
}
