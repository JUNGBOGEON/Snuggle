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
  blog_id: string
  blog: {
    name: string
    thumbnail_url: string | null
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

  if (response.status === 404) {
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
export async function getFeedPosts(userId: string, limit = 14): Promise<PostListItem[]> {
  const supabase = createClient()

  // 1. 내가 구독한 사람들의 ID (subed_id) 가져오기
  const { data: subscribed, error: subError } = await supabase
    .from('subscribe')
    .select('subed_id')
    .eq('sub_id', userId)

  if (subError) {
    console.error('Failed to fetch subscriptions for feed:', subError)
    throw new Error('Failed to fetch feed')
  }

  // 구독한 사람이 없으면 빈 배열 반환
  if (!subscribed || subscribed.length === 0) {
    return []
  }

  const subscribedUserIds = subscribed.map((row) => row.subed_id)

  // 2. 해당 유저들의 블로그 ID 가져오기
  // posts 테이블에는 blog_id만 있고 user_id가 있긴 하지만, 블로그 정보도 같이 조인해야 함
  // user_id로 직접 쿼리 가능

  const { data: posts, error: postError } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      content,
      thumbnail_url,
      created_at,
      blog_id,
      blog:blogs (
        name,
        thumbnail_url,
        user_id
        ),
      user_id
    `)
    .in('user_id', subscribedUserIds)  // 구독한 유저들의 글만 필터링
    .eq('published', true)             // 공개된 글만
    .order('created_at', { ascending: false })
    .limit(limit)

  if (postError) {
    console.error('Failed to fetch feed posts:', postError)
    throw new Error('Failed to fetch feed posts')
  }

  // 타입 변환 (user_id 검증 로직은 쿼리에서 처리했으므로 생략 가능하나 안전을 위해)
  return posts.map((post: any) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    thumbnail_url: post.thumbnail_url,
    created_at: post.created_at,
    blog_id: post.blog_id,
    blog: post.blog ? {
      name: post.blog.name || '',
      thumbnail_url: post.blog.thumbnail_url || null,
    } : null,
    // 필요하다면 user_id 등 추가 정보 포함 가능
  }))
}
