'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserMenuProps {
  user: User
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const nickname = user.user_metadata?.name ||
                   user.user_metadata?.nickname ||
                   user.user_metadata?.full_name ||
                   '사용자'
  const profileImage = user.user_metadata?.avatar_url ||
                       user.user_metadata?.picture
  const email = user.email || user.user_metadata?.email || ''

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt={nickname}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-medium text-white dark:bg-white dark:text-black">
            {nickname.charAt(0)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 min-w-72 rounded-2xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-zinc-900">
          {/* 프로필 정보 */}
          <div className="flex items-center gap-3">
            {profileImage ? (
              <img
                src={profileImage}
                alt={nickname}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-medium text-white dark:bg-white dark:text-black">
                {nickname.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-black dark:text-white">
                {nickname}
              </p>
              {email && (
                <p className="text-sm text-black/50 dark:text-white/50">
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
              href="/account"
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
