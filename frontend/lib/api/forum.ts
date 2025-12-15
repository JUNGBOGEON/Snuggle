import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
}

export interface ForumComment {
    id: string
    forum_id: string
    user_id: string
    blog_id: string
    content: string
    created_at: string
    blog: {
        name: string
        thumbnail_url: string | null
        profile_image_url: string | null
    } | null
}

export interface ForumPost {
    id: string
    title: string
    description: string
    user_id: string
    blog_id: string
    category?: string
    created_at: string
    updated_at: string
    blog: {
        name: string
        thumbnail_url: string | null
        profile_image_url: string | null
    } | null
    comment_count: number
    view_count: number
}

// 포럼 목록 조회
export async function getForums(limit = 12, offset = 0, category?: string, q?: string, searchType = 'title_content'): Promise<ForumPost[]> {
    const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
    })

    if (category && category !== '전체') {
        params.append('category', category)
    }

    if (q) {
        params.append('q', q)
        params.append('type', searchType)
    }

    const response = await fetch(`${API_URL}/api/forum?${params.toString()}`)

    if (!response.ok) {
        throw new Error('Failed to fetch forums')
    }

    return response.json()
}

// 포럼 상세 조회 (필요 시)
export async function getForum(id: string): Promise<ForumPost> {
    const response = await fetch(`${API_URL}/api/forum/${id}`)

    if (!response.ok) {
        throw new Error('Failed to fetch forum')
    }

    return response.json()
}

// 포럼 글 작성
export async function createForum(data: {
    title: string
    description: string
    blog_id: string
    category: string
}): Promise<ForumPost> {
    const token = await getAuthToken()

    if (!token) {
        throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_URL}/api/forum`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create forum')
    }

    return response.json()
}

// 댓글 목록 조회
export async function getForumComments(forumId: string): Promise<ForumComment[]> {
    const response = await fetch(`${API_URL}/api/forum/${forumId}/comments`)

    if (!response.ok) {
        throw new Error('Failed to fetch comments')
    }

    return response.json()
}

// 댓글 작성
export async function createForumComment(data: {
    forum_id: string
    blog_id: string
    content: string
}): Promise<ForumComment> {
    const token = await getAuthToken()

    if (!token) {
        throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_URL}/api/forum/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create comment')
    }

    return response.json()
}
