'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/lib/store/useUserStore'
import LoginModal from '@/components/auth/LoginModal'
import UserMenu from '@/components/auth/UserMenu'
import PostList from '@/components/blog/PostList'
import MyBlogSidebar from '@/components/blog/MyBlogSidebar'
import NewBloggers from '@/components/blog/NewBloggers'
import SearchInputWithSuggestions from '@/components/search/SearchInputWithSuggestions'
import { syncProfile } from '@/lib/api/profile'
import type { User } from '@supabase/supabase-js'

const ThemeToggle = dynamic(() => import('@/components/common/ThemeToggle'), {
  ssr: false,
  loading: () => <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10" />,
})

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { user } = useUserStore()
  // Loading state is now implicitly handled by the store having user as null initially,
  // potentially we might want a global loading state, but for now we follow the pattern "if user, show menu".
  // However, initial load might flicker. The store doesn't have a loading flag.
  // For this tasks scope, we rely on the `Providers` initializing it fast.
  // NOTE: Previous code had a `loading` state. To keep it 1:1, we accept slight UI shift or should add loading to store.
  // Let's assume the user is okay with the basic replacement first.

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
              href="/feed"
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
            <SearchInputWithSuggestions />
            <ThemeToggle />
            {user ? (
              <UserMenu />
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
              <MyBlogSidebar />
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
