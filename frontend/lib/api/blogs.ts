import { createClient } from '@/lib/supabase/client'

export interface BlogItem {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  profile_image_url: string | null
  created_at: string
}

export interface MyBlog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export interface DeletedBlog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
  deleted_at: string
}

// 신규 블로거 목록 (최근 생성된 블로그)
export async function getNewBlogs(limit = 3): Promise<BlogItem[]> {
  const supabase = createClient()

  // 블로그 목록 가져오기
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select('id, name, description, thumbnail_url, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch new blogs:', error)
    return []
  }

  if (!blogs || blogs.length === 0) {
    return []
  }

  // 프로필 정보 가져오기
  const userIds = blogs.map((b) => b.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, profile_image_url')
    .in('id', userIds)

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p.profile_image_url])
  )

  return blogs.map((blog) => ({
    id: blog.id,
    name: blog.name,
    description: blog.description,
    thumbnail_url: blog.thumbnail_url,
    profile_image_url: profileMap.get(blog.user_id) || null,
    created_at: blog.created_at,
  }))
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// ... (interfaces)

// 내 블로그 목록 조회
export async function getMyBlogs(): Promise<MyBlog[]> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/blogs/my`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    console.error('Failed to fetch my blogs')
    throw new Error('Failed to fetch my blogs')
  }

  return response.json()
}

// 삭제된 블로그 목록 조회
export async function getDeletedBlogs(): Promise<DeletedBlog[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('blogs')
    .select('id, name, description, thumbnail_url, created_at, deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch deleted blogs:', error)
    throw new Error('Failed to fetch deleted blogs')
  }

  return data || []
}

// 블로그 생성
export async function createBlog(blogData: { name: string; description?: string }): Promise<MyBlog> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('blogs')
    .insert({
      user_id: user.id,
      name: blogData.name,
      description: blogData.description || null,
    })
    .select('id, name, description, thumbnail_url, created_at, updated_at')
    .single()

  if (error) {
    console.error('Failed to create blog:', error)
    throw new Error(error.message || 'Failed to create blog')
  }

  return data
}

// 블로그 삭제 (Soft Delete)
export async function deleteBlog(id: string): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('blogs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to delete blog:', error)
    throw new Error(error.message || 'Failed to delete blog')
  }
}

// 블로그 복구
export async function restoreBlog(id: string): Promise<MyBlog> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('blogs')
    .update({ deleted_at: null })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, description, thumbnail_url, created_at, updated_at')
    .single()

  if (error) {
    console.error('Failed to restore blog:', error)
    throw new Error(error.message || 'Failed to restore blog')
  }

  return data
}
