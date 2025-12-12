'use client'

import { createClient } from '@/lib/supabase/client'

export default function KakaoLoginButton() {
  const handleKakaoLogin = async () => {
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

    console.log('Redirect URL:', `${siteUrl}/auth/callback`) // 디버깅용

    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={handleKakaoLogin}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#000000D9] transition-colors hover:bg-[#FDD835]"
    >
      <KakaoIcon />
      카카오로 시작하기
    </button>
  )
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0.5C4.029 0.5 0 3.627 0 7.452C0 9.862 1.559 11.99 3.931 13.186L2.933 16.779C2.844 17.096 3.213 17.346 3.486 17.163L7.873 14.257C8.242 14.302 8.618 14.325 9 14.325C13.971 14.325 18 11.198 18 7.373C18 3.548 13.971 0.5 9 0.5Z"
        fill="#000000D9"
      />
    </svg>
  )
}
