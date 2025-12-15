import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export interface Post {
  id: string
  blog_id: string
  user_id: string
  title: string
  content: string
  category_id: string | null
  published: boolean
  is_private?: boolean
  is_allow_comment?: boolean // 추가
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export interface PostWithDetails extends Post {
  blog: {
    id: string
    user_id: string
    name: string
    thumbnail_url: string | null
  }
  category: {
    id: string
    name: string
  } | null
  profile: {
    id: string
    nickname: string | null
    profile_image_url: string | null
  } | null
}

export interface PostListItem {
  id: string
  title: string
  content: string
  thumbnail_url: string | null
  created_at: string
  is_private?: boolean
  blog_id: string
  blog: {
    name: string
    thumbnail_url: string | null
    profile_image_url: string | null
  } | null
}

// 전체 게시글 목록 (공개글만)
export async function getPosts(limit = 20, offset = 0): Promise<PostListItem[]> {
  const response = await fetch(`${API_URL}/api/posts?limit=${limit}&offset=${offset}`)

  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }

  return response.json()
}

// 블로그별 게시글 목록
export async function getBlogPosts(blogId: string, showAll = false): Promise<Post[]> {
  const token = await getAuthToken()
  const headers: Record<string, string> = {}

  if (token && showAll) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(
    `${API_URL}/api/posts/blog/${blogId}?showAll=${showAll}`,
    { headers }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch blog posts')
  }

  return response.json()
}

// 게시글 상세 조회
export async function getPost(id: string): Promise<PostWithDetails | null> {
  const token = await getAuthToken()
  const headers: Record<string, string> = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/api/posts/${id}`, { headers })
  if (response.status === 404 || response.status === 403) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to fetch post')
  }

  return response.json()
}

// 게시글 생성
export async function createPost(data: {
  blog_id: string
  title: string
  content: string
  category_ids?: string[]
  published?: boolean
  is_private?: boolean
  is_allow_comment?: boolean
  thumbnail_url?: string | null
}): Promise<Post> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create post')
  }

  return response.json()
}

// 게시글 수정
export async function updatePost(
  id: string,
  data: {
    title?: string
    content?: string
    category_ids?: string[]
    published?: boolean
    is_private?: boolean
    is_allow_comment?: boolean
    thumbnail_url?: string | null
  }
): Promise<Post> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update post')
  }

  return response.json()
}

// 게시글 삭제
export async function deletePost(id: string): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete post')
  }
}

// 내가 구독한 블로그의 게시글 (피드)
export async function getFeedPosts(limit = 14): Promise<PostListItem[]> {
  const token = await getAuthToken()

  if (!token) {
    return []
  }

  const response = await fetch(`${API_URL}/api/posts/feed?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch feed')
  }

  return response.json()
}


