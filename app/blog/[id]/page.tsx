'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import BlogProfileSidebar from '@/components/blog/BlogProfileSidebar'
import BlogPostList from '@/components/blog/BlogPostList'
import BlogSkinProvider from '@/components/blog/BlogSkinProvider'

interface Blog {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
}

interface Profile {
  id: string
  nickname: string | null
  profile_image_url: string | null
}

export default function BlogPage() {
  const params = useParams()
  const blogId = params.id as string

  const [blog, setBlog] = useState<Blog | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [postCount, setPostCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // 현재 로그인한 사용자
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // 블로그 정보
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

      // 프로필 정보
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, nickname, profile_image_url')
        .eq('id', blogData.user_id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // 게시글 수
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('blog_id', blogId)
        .eq('published', true)

      setPostCount(count || 0)
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
    <BlogSkinProvider blogId={blogId}>
      <div className="min-h-screen bg-[var(--blog-bg,white)] dark:bg-[var(--blog-dark-bg,black)]">
        {/* 헤더 */}
        <header className="border-b border-[var(--blog-border,rgba(0,0,0,0.1))] dark:border-[var(--blog-dark-border,rgba(255,255,255,0.1))]">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <a href="/" className="text-lg font-bold text-[var(--blog-fg,black)] dark:text-[var(--blog-dark-fg,white)]">
              Snuggle
            </a>
            {isOwner && (
              <a
                href="/write"
                className="rounded-full bg-[var(--blog-accent,black)] px-4 py-2 text-sm font-medium text-[var(--blog-bg,white)] dark:bg-[var(--blog-dark-accent,white)] dark:text-[var(--blog-dark-bg,black)]"
              >
                새 글 작성
              </a>
            )}
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex gap-10">
            {/* 왼쪽: 포스트 목록 */}
            <div className="flex-1">
              <BlogPostList blogId={blogId} isOwner={isOwner} />
            </div>

            {/* 오른쪽: 프로필 사이드바 */}
            <div className="w-80 shrink-0">
              <BlogProfileSidebar
                blog={blog}
                profile={profile}
                postCount={postCount}
                isOwner={isOwner}
              />
            </div>
          </div>
        </main>
      </div>
    </BlogSkinProvider>
  )
}
