'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { syncProfile } from '@/lib/api/profile'
import ThemeProvider from './ThemeProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  const { setUser } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // 초기 로딩 시 사용자 확인
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) syncProfile()
    }
    checkUser()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (event === 'SIGNED_IN' && session?.user) {
          syncProfile()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}
