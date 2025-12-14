const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface BlogItem {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  profile_image_url: string | null
  created_at: string
}

// 신규 블로거 목록 (최근 생성된 블로그)
export async function getNewBlogs(limit = 3): Promise<BlogItem[]> {
  try {
    const response = await fetch(`${API_URL}/api/blogs/new?limit=${limit}`)

    if (!response.ok) {
      throw new Error('Failed to fetch new blogs')
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch new blogs:', error)
    return []
  }
}
