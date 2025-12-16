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

// 계정 탈퇴 (Soft Delete)
export async function deleteAccount(): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '계정 탈퇴에 실패했습니다')
  }
}

// 계정 복구
export async function restoreAccount(): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const res = await fetch(`${API_URL}/api/profile/restore`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || '계정 복구에 실패했습니다')
  }
}
