import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth error:', error.message)
      return NextResponse.redirect(`${siteUrl}/?error=${encodeURIComponent(error.message)}`)
    }

    // 카카오 프로필 이미지를 profiles 테이블에 저장
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const kakaoProfile = user.user_metadata
      const profileImageUrl = kakaoProfile?.avatar_url || kakaoProfile?.picture
      const nickname = kakaoProfile?.name || kakaoProfile?.full_name

      if (profileImageUrl || nickname) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            profile_image_url: profileImageUrl,
            nickname: nickname,
          }, {
            onConflict: 'id',
          })
      }
    }

    return NextResponse.redirect(`${siteUrl}${next}`)
  }

  return NextResponse.redirect(`${siteUrl}/?error=no_code`)
}
