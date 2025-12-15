'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBlogPosts, Post } from '@/lib/api/posts'

interface BlogPostListProps {
  blogId: string
  isOwner: boolean
}

export default function BlogPostList({ blogId, isOwner }: BlogPostListProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getBlogPosts(blogId, isOwner)
        setPosts(data)
      } catch (err) {
        console.error('Failed to load posts:', err)
      }
      setLoading(false)
    }

    fetchPosts()
  }, [blogId, isOwner])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getExcerpt = (content: string, maxLength: number = 150) => {
    // 코드블록, 이미지 제거
    const withoutCode = content.replace(/<pre[\s\S]*?<\/pre>/gi, '')
    const withoutImages = withoutCode.replace(/<img[^>]*>/gi, '')
    // 첫 번째 <p> 태그 내용만 추출
    const pMatch = withoutImages.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    let firstLine = ''
    if (pMatch) {
      firstLine = pMatch[1].replace(/<[^>]*>/g, '').trim()
    } else {
      firstLine = withoutImages.replace(/<[^>]*>/g, '').trim().split(/\n/)[0] || ''
    }
    if (firstLine.length <= maxLength) return firstLine
    return firstLine.slice(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-[var(--blog-border)] p-6"
          >
            <div className="h-6 w-3/4 rounded bg-[var(--blog-fg)]/10" />
            <div className="mt-3 h-4 w-full rounded bg-[var(--blog-fg)]/10" />
            <div className="mt-2 h-4 w-2/3 rounded bg-[var(--blog-fg)]/10" />
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-4xl">📝</div>
        <p className="mt-4 text-[var(--blog-muted)]">
          아직 작성된 글이 없습니다
        </p>
        {isOwner && (
          <Link
            href="/write"
            className="mt-4 rounded-full bg-[var(--blog-accent)] px-6 py-2.5 text-sm font-medium text-[var(--blog-bg)]"
          >
            첫 글 작성하기
          </Link>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-lg font-semibold text-[var(--blog-fg)]">
          게시글
        </h2>
        <span className="text-sm text-[var(--blog-muted)]">
          {posts.length}개
        </span>
      </div>

      <div className="divide-y divide-[var(--blog-border)] border-t border-[var(--blog-border)]">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="group block py-5 transition-colors hover:bg-[var(--blog-fg)]/[0.02]"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold text-[var(--blog-fg)] group-hover:opacity-80">
                    {post.title}
                  </h3>

                </div>
                <p className="mt-1.5 line-clamp-1 text-sm text-[var(--blog-muted)]">
                  {getExcerpt(post.content, 150)}
                </p>
                <p className="mt-2 text-xs text-[var(--blog-muted)]" style={{ opacity: 0.7 }}>
                  {formatDate(post.created_at)}
                </p>
              </div>
              {post.thumbnail_url && (
                <img
                  src={post.thumbnail_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
