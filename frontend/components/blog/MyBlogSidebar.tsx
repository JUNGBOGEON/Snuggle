'use client'

import { useEffect, useState, useRef } from 'react'
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

const SELECTED_BLOG_KEY = 'snuggle_selected_blog_id'

export default function MyBlogSidebar() {
  const { user } = useUserStore()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      const supabase = createClient()

      const { data, error } = await supabase
        .from('blogs')
        .select('id, name, description, thumbnail_url')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        setBlogs(data)

        // localStorage에서 이전 선택 복원
        const savedBlogId = localStorage.getItem(SELECTED_BLOG_KEY)
        const savedBlog = data.find(b => b.id === savedBlogId)
        setSelectedBlog(savedBlog || data[0])
      }
      setLoading(false)
    }

    fetchBlogs()
  }, [user])

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectBlog = (blog: Blog) => {
    setSelectedBlog(blog)
    localStorage.setItem(SELECTED_BLOG_KEY, blog.id)
    setIsDropdownOpen(false)
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

  // 로딩 상태
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <div className="h-5 w-20 rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-4 h-4 w-full rounded bg-black/10 dark:bg-white/10" />
        <div className="mt-2 h-4 w-2/3 rounded bg-black/10 dark:bg-white/10" />
      </div>
    )
  }

  // 블로그가 있는 경우
  const kakaoProfileImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  if (selectedBlog) {
    const profileImage = selectedBlog.thumbnail_url || kakaoProfileImage
    const hasMultipleBlogs = blogs.length > 1

    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        {/* 블로그 선택기 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => hasMultipleBlogs && setIsDropdownOpen(!isDropdownOpen)}
            className={`flex w-full items-center gap-3 ${hasMultipleBlogs ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <ProfileImage
              src={profileImage}
              alt={selectedBlog.name}
              fallback={selectedBlog.name}
              size="md"
              rounded="xl"
            />
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-black dark:text-white">
                {selectedBlog.name}
              </h3>
              {selectedBlog.description && (
                <p className="text-sm text-black/50 dark:text-white/50 line-clamp-1">
                  {selectedBlog.description}
                </p>
              )}
            </div>
            {hasMultipleBlogs && (
              <svg
                className={`h-4 w-4 text-black/40 transition-transform dark:text-white/40 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {/* 드롭다운 메뉴 */}
          {isDropdownOpen && hasMultipleBlogs && (
            <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border border-black/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
              {blogs.map((blog) => (
                <button
                  key={blog.id}
                  onClick={() => handleSelectBlog(blog)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <ProfileImage
                    src={blog.thumbnail_url || kakaoProfileImage}
                    alt={blog.name}
                    fallback={blog.name}
                    size="sm"
                    rounded="xl"
                  />
                  <span className="flex-1 text-sm font-medium text-black dark:text-white">
                    {blog.name}
                  </span>
                  {blog.id === selectedBlog.id && (
                    <svg className="h-4 w-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-black/10 dark:border-white/10" />
              <a
                href="/account"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                새 블로그 만들기
              </a>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 text-sm">
          <a
            href={`/blog/${selectedBlog.id}`}
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
            href={`/blog/${selectedBlog.id}/settings`}
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
        href="/account"
        className="mt-4 block w-full rounded-lg bg-black py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        블로그 만들기
      </a>
    </div>
  )
}
