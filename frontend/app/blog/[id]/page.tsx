'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import BlogProfileSidebar from '@/components/blog/BlogProfileSidebar'
import BlogPostList from '@/components/blog/BlogPostList'
import BlogSkinProvider, { useBlogSkin } from '@/components/blog/BlogSkinProvider'
import BlogLayout from '@/components/blog/BlogLayout'
import BlogHeader from '@/components/layout/BlogHeader'
import CustomBlogRenderer from '@/components/blog/CustomBlogRenderer'
import { trackBlogVisit } from '@/lib/api/blogs'

interface Blog {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
}

interface Post {
  id: string
  title: string
  content?: string
  excerpt?: string
  thumbnail_url?: string | null
  created_at: string
  view_count?: number
  like_count?: number
  blog_id: string
}

interface BlogContentProps {
  blog: Blog
  postCount: number
  posts: Post[]
  subscriberCount: number
  isOwner: boolean
}

function BlogContent({ blog, postCount, posts, subscriberCount, isOwner }: BlogContentProps) {
  const { layoutConfig, isCustomSkinActive } = useBlogSkin()

  // 기본 컴포넌트 렌더링 (커스텀 스킨 비활성화 시)
  const defaultContent = (
    <div className="min-h-screen bg-[var(--blog-bg)]" style={{ color: 'var(--blog-fg)' }}>
      {/* 블로그 테마 헤더 */}
      <BlogHeader blogName={blog.name} blogId={blog.id} />

      {/* 작성 버튼 (소유자만) */}
      {isOwner && (
        <div className="mx-auto flex max-w-6xl justify-end px-6 py-4">
          <a
            href="/write"
            className="rounded-full px-4 py-2 text-sm font-medium hover:opacity-90"
            style={{
              backgroundColor: 'var(--blog-accent)',
              color: 'var(--blog-bg)',
            }}
          >
            새 글 작성
          </a>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <BlogLayout
          layout={layoutConfig.layout}
          sidebar={
            <BlogProfileSidebar
              blog={blog}
              postCount={postCount}
              isOwner={isOwner}
            />
          }
        >
          <BlogPostList blogId={blog.id} isOwner={isOwner} />
        </BlogLayout>
      </main>
    </div>
  )

  return (
    <CustomBlogRenderer
      blog={blog}
      postCount={postCount}
      subscriberCount={subscriberCount}
      posts={posts}
      pageType="list"
      isOwner={isOwner}
    >
      {defaultContent}
    </CustomBlogRenderer>
  )
}

export default function BlogPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const blogId = params.id as string

  // 미리보기 모드 확인 (커스텀 스킨 에디터에서 사용)
  const isPreviewMode = searchParams.get('preview') === 'true'

  const [blog, setBlog] = useState<Blog | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [postCount, setPostCount] = useState(0)
  const [posts, setPosts] = useState<Post[]>([])
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const visitTrackedRef = useRef(false)

  // 방문자 추적 (한 번만 실행, 미리보기 모드에서는 추적 안함)
  useEffect(() => {
    if (visitTrackedRef.current || isPreviewMode) return
    visitTrackedRef.current = true
    trackBlogVisit(blogId)
  }, [blogId, isPreviewMode])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      const { data: blogData, error: blogError } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .single()

      if (blogError || !blogData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setBlog(blogData)

      // 게시글 조회 (커스텀 스킨 템플릿 렌더링용)
      const { data: postsData, count } = await supabase
        .from('posts')
        .select('id, title, content, thumbnail_url, created_at, view_count, like_count, blog_id', { count: 'exact' })
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false })
        .limit(20)

      // excerpt 대신 content에서 추출
      const postsWithExcerpt = (postsData || []).map(p => ({
        ...p,
        excerpt: p.content ? p.content.replace(/<[^>]*>/g, '').substring(0, 100) : '',
      }))
      setPosts(postsWithExcerpt)
      setPostCount(count || 0)

      // 구독자 수 조회
      const { count: subCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blogId)

      setSubscriberCount(subCount || 0)

      setLoading(false)
    }

    fetchData()
  }, [blogId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      </div>
    )
  }

  if (notFound || !blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          블로그를 찾을 수 없습니다
        </h1>
        <a
          href="/"
          className="mt-4 text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
        >
          홈으로 돌아가기
        </a>
      </div>
    )
  }

  const isOwner = currentUser?.id === blog.user_id

  return (
    <BlogSkinProvider blogId={blogId} previewMode={isPreviewMode}>
      <BlogContent
        blog={blog}
        postCount={postCount}
        posts={posts}
        subscriberCount={subscriberCount}
        isOwner={isOwner}
      />
    </BlogSkinProvider>
  )
}
