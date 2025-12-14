import { fetchWithAuth } from './client'

export interface SubscriptionCounts {
  followers: number
  following: number
}

export async function getSubscriptionCounts(userId: string): Promise<SubscriptionCounts> {
  return await fetchWithAuth(`/subscribe/counts?userId=${userId}`)
}

export async function getSubscribedUserIds(userId: string): Promise<string[]> {
  try {
    const result = await fetchWithAuth(`/subscribe/following?userId=${userId}`)
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error('Failed to get subscribed user IDs:', error)
    return []
  }
}
