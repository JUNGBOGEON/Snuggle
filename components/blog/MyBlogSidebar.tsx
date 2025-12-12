'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import CreateBlogModal from './CreateBlogModal'

interface Blog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

interface MyBlogSidebarProps {
  user: User | null
}

export default function MyBlogSidebar({ user }: MyBlogSidebarProps) {
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
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
  }, [user])

  const handleBlogCreated = (newBlog: Blog) => {
    setBlog(newBlog)
    setIsModalOpen(false)
  }

  // 비로그인 상태
  if (!user) {
    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h3 className="font-semibold text-black dark:text-white">내 블로그</h3>
        <p className="mt-2 text-sm text-black/50 dark:text-white/50">
          로그인하고 나만의 블로그를 시작하세요
        </p>
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
  if (blog) {
    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <div className="flex items-center gap-3">
          {blog.thumbnail_url ? (
            <img
              src={blog.thumbnail_url}
              alt={blog.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-lg font-bold text-white dark:bg-white dark:text-black">
              {blog.name.charAt(0)}
            </div>
          )}
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

        <div className="mt-5 space-y-2">
          <a
            href={`/blog/${blog.id}`}
            className="block w-full rounded-lg border border-black/10 py-2 text-center text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
          >
            블로그 보기
          </a>
          <a
            href="/write"
            className="block w-full rounded-lg bg-black py-2 text-center text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            새 글 작성
          </a>
        </div>
      </div>
    )
  }

  // 블로그가 없는 경우
  return (
    <>
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h3 className="font-semibold text-black dark:text-white">내 블로그</h3>
        <p className="mt-2 text-sm text-black/50 dark:text-white/50">
          아직 블로그가 없습니다
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          블로그 만들기
        </button>
      </div>

      <CreateBlogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBlogCreated={handleBlogCreated}
        userId={user.id}
      />
    </>
  )
}
