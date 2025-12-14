import { createClient } from '@/lib/supabase/client'

// 구독 정보 타입
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
