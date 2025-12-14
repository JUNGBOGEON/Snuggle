import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// 구독 여부 확인
export async function checkSubscription(targetId: string): Promise<boolean> {
  const token = await getAuthToken()
  if (!token) return false

  const response = await fetch(`${API_URL}/api/subscribe/check?targetId=${targetId}`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) return false
  const data = await response.json()
  return data.subscribed
}

// 구독 토글
export async function toggleSubscription(targetId: string): Promise<{ subscribed: boolean }> {
  const token = await getAuthToken()
  if (!token) throw new Error('로그인이 필요합니다')

  const response = await fetch(`${API_URL}/api/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ targetId })
  })

  if (!response.ok) {
    throw new Error('구독 처리에 실패했습니다')
  }

  return response.json()
}
export interface Subscription {
  sub_id: string // 구독하는 사람 (나)
  subed_id: string // 구독 당하는 사람 (상대방)
}

// 구독 수 가져오기 (구독중, 구독자)
export async function getSubscriptionCounts(userId: string) {
  const supabase = createClient()

  // 내가 구독하는 수 (Following)
  const { count: followingCount, error: followingError } = await supabase
    .from('subscribe')
    .select('*', { count: 'exact', head: true })
    .eq('sub_id', userId)

  // 나를 구독하는 수 (Followers)
  const { count: followersCount, error: followersError } = await supabase
    .from('subscribe')
    .select('*', { count: 'exact', head: true })
    .eq('subed_id', userId)

  if (followingError || followersError) {
    console.error('Failed to fetch subscription counts:', followingError || followersError)
    throw new Error('Failed to fetch subscription counts')
  }

  return {
    following: followingCount || 0,
    followers: followersCount || 0,
  }
}

// 내가 구독한 유저 ID 목록 가져오기
export async function getSubscribedUserIds(userId: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscribe')
    .select('subed_id')
    .eq('sub_id', userId)

  if (error) {
    console.error('Failed to fetch subscribed user IDs:', error)
    return []
  }

  return data.map((row) => row.subed_id)
}
