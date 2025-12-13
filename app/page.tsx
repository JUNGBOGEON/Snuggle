'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import LoginModal from '@/components/auth/LoginModal'
import UserMenu from '@/components/auth/UserMenu'
import PostList from '@/components/blog/PostList'
import MyBlogSidebar from '@/components/blog/MyBlogSidebar'
import NewBloggers from '@/components/blog/NewBloggers'
import { syncProfile } from '@/lib/api/profile'
import type { User } from '@supabase/supabase-js'

const ThemeToggle = dynamic(() => import('@/components/common/ThemeToggle'), {
  ssr: false,
  loading: () => <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10" />,
})

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // 현재 사용자 가져오기
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      // 로그인된 사용자가 있으면 프로필 동기화
      if (user) {
        syncProfile()
      }
    }

    getUser()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        // 로그인 시 프로필 동기화
        if (event === 'SIGNED_IN' && session?.user) {
          syncProfile()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="relative z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div className="relative flex items-center">
            <span className="text-xl font-bold text-black dark:text-white">
              Snuggle
            </span>
            {/* <img
              src="/icon.png"
              alt=""
              className="absolute -left-19 top-1/2 h-9 -translate-y-1/2 translate-x-1/2 object-contain"
            /> */}
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <a
              href="/"
              className="text-sm font-medium text-black dark:text-white"
            >
              홈
            </a>
            <a
              href="#"
              className="text-sm font-medium text-black/60 dark:text-white/60"
            >
              피드
            </a>
            <a
              href="/skins"
              className="text-sm font-medium text-black/60 dark:text-white/60"
            >
              스킨
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="검색"
              className="h-9 w-48 rounded-full border border-black/10 bg-transparent px-4 text-sm text-black placeholder-black/40 outline-none dark:border-white/10 dark:text-white dark:placeholder-white/40"
            />
            <ThemeToggle />
            {loading ? (
              <div className="h-9 w-20 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
            ) : user ? (
              <UserMenu user={user} />
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                시작하기
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Section */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* 왼쪽: 블로그 글 목록 */}
          <div className="flex-1 min-w-0">
            <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
              최신 글
            </h2>
            <PostList />
          </div>

          {/* 오른쪽: 내 블로그 사이드바 */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8">
              <MyBlogSidebar user={user} />
              <NewBloggers />
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  )
}
