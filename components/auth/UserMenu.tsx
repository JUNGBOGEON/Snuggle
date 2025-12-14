'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import ProfileImage from '@/components/common/ProfileImage'

export default function UserMenu() {
  const { user } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const nickname = user?.user_metadata?.name ||
    user?.user_metadata?.nickname ||
    user?.user_metadata?.full_name ||
    '사용자'
  const profileImage = user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture
  const email = user?.email || user?.user_metadata?.email || ''

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (!user) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center"
      >
        <ProfileImage
          src={profileImage}
          alt={nickname}
          fallback={nickname}
          size="sm"
          rounded="full"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-max min-w-56 rounded-2xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          {/* 프로필 정보 */}
          <div className="flex items-center gap-3">
            <ProfileImage
              src={profileImage}
              alt={nickname}
              fallback={nickname}
              size="md"
              rounded="full"
              className="shrink-0"
            />
            <div>
              <p className="text-base font-semibold text-black dark:text-white">
                {nickname}
              </p>
              {email && (
                <p className="whitespace-nowrap text-sm text-black/50 dark:text-white/50">
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="my-4 border-t border-black/10 dark:border-white/10" />

          {/* 메뉴 */}
          <div className="space-y-1">
            <a
              href="/setting"
              className="block rounded-lg px-3 py-2 text-sm text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
            >
              계정 관리
            </a>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
