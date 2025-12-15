import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  // 먼저 현재 사용자 확인 (서버 검증)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 세션 가져오기
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // 블로그가 현재 사용자의 것인지 확인
  const { data: blog } = await supabase
    .from('blogs')
    .select('id, user_id')
    .eq('id', data.blog_id)
    .single()

  if (!blog || blog.user_id !== user.id) {
    throw new Error('블로그 권한이 없습니다')
  }

  // 게시글 생성
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      blog_id: data.blog_id,
      user_id: user.id,
      title: data.title,
      content: data.content,
      category_id: data.category_ids?.[0] || null,
      published: data.published ?? true,
      is_private: data.is_private ?? false,
      is_allow_comment: data.is_allow_comment ?? true,
      thumbnail_url: data.thumbnail_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create post:', error)
    throw new Error(error.message || 'Failed to create post')
  }

  return post
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // 업데이트할 데이터 구성
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.category_ids !== undefined) updateData.category_id = data.category_ids[0] || null
  if (data.published !== undefined) updateData.published = data.published
  if (data.is_private !== undefined) updateData.is_private = data.is_private
  if (data.is_allow_comment !== undefined) updateData.is_allow_comment = data.is_allow_comment
  if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url

  const { data: post, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)  // 본인 글만 수정 가능
    .select()
    .single()

  if (error) {
    console.error('Failed to update post:', error)
    throw new Error(error.message || 'Failed to update post')
  }

  return post
}

// 게시글 삭제
export async function deletePost(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)  // 본인 글만 삭제 가능

  if (error) {
    console.error('Failed to delete post:', error)
    throw new Error(error.message || 'Failed to delete post')
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


