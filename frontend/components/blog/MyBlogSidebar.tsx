'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import ProfileImage from '@/components/common/ProfileImage'
import KakaoLoginButton from '@/components/auth/KakaoLoginButton'

interface Blog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

export default function MyBlogSidebar() {
  const { user, isLoading: isUserLoading } = useUserStore()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isUserLoading) return

    if (!user) {
      setLoading(false)
      return
    }

    const fetchBlog = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('blogs')
        .select('id, name, description, thumbnail_url')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setBlog(data)
      }
      setLoading(false)
    }

    fetchBlog()
  }, [user, isUserLoading])

  // 유저 로딩 중이거나 블로그 로딩 중
  if (isUserLoading || loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <div className="h-5 w-20 rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 h-4 w-full rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-4 w-2/3 rounded bg-black/10 dark:bg-white/10" />
      </div>
    )
  }

  // 비로그인 상태
  if (!user) {
    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h3 className="font-semibold text-black dark:text-white">내 블로그</h3>
        <p className="mt-2 text-sm text-black/50 dark:text-white/50">
          로그인하고 나만의 블로그를 시작하세요
        </p>
        <div className="mt-4">
          <KakaoLoginButton />
        </div>
      </div>
    )
  }

  // 블로그가 있는 경우
  const kakaoProfileImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  if (blog) {
    const profileImage = blog.thumbnail_url || kakaoProfileImage

    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex items-center gap-3">
          <ProfileImage
            src={profileImage}
            alt={blog.name}
            fallback={blog.name}
            size="md"
            rounded="xl"
          />
          <div>
            <h3 className="font-semibold text-black dark:text-white">
              {blog.name}
            </h3>
            {blog.description && (
              <p className="text-sm text-black/50 dark:text-white/50">
                {blog.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <a
            href={`/blog/${blog.id}`}
            className="font-medium text-black hover:text-black/70 dark:text-white dark:hover:text-white/70"
          >
            내 블로그
          </a>
          <span className="text-black/30 dark:text-white/30">|</span>
          <a
            href="/write"
            className="font-medium text-black hover:text-black/70 dark:text-white dark:hover:text-white/70"
          >
            글쓰기
          </a>
          <span className="text-black/30 dark:text-white/30">|</span>
          <a
            href={`/blog/${blog.id}/settings`}
            className="font-medium text-black hover:text-black/70 dark:text-white dark:hover:text-white/70"
          >
            관리
          </a>
        </div>
      </div>
    )
  }

  // 블로그가 없는 경우
  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <h3 className="font-semibold text-black dark:text-white">내 블로그</h3>
      <p className="mt-2 text-sm text-black/50 dark:text-white/50">
        아직 블로그가 없습니다
      </p>
      <a
        href="/create-blog"
        className="mt-4 block w-full rounded-lg bg-black py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        블로그 만들기
      </a>
    </div>
  )
}
