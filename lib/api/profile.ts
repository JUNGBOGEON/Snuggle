import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// 프로필 동기화 (카카오 프로필 정보를 DB에 저장)
export async function syncProfile(): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    return
  }

  try {
    await fetch(`${API_URL}/api/profile/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (err) {
    console.error('Failed to sync profile:', err)
  }
}
