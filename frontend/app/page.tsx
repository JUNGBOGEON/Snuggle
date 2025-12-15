'use client'

import { useState } from 'react'
import PostList from '@/components/blog/PostList'
import MyBlogSidebar from '@/components/blog/MyBlogSidebar'
import NewBloggers from '@/components/blog/NewBloggers'

import PopularPostSlider from '@/components/home/PopularPostSlider'

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false) // Still used by LoginModal if invoked? UserMenu/LoginModal logic moved to Header?
  // Actually, LoginModal in page.tsx was triggered by button in header. 
  // Since Header is now global, we can remove LoginModal from here too unless triggered elsewhere.
  // But wait, the main page body has no login trigger.
  // So we can remove LoginModal related state and imports from here too.

  // Clean up imports and component body
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Main Section */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* 왼쪽: 블로그 글 목록 */}
          <div className="flex-1 min-w-0">
            <PopularPostSlider />
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
    </div>
  )
}
