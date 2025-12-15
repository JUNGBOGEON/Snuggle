import { createClient } from '@/lib/supabase/client'

// API URL은 클라이언트 사이드에서 프록시(/api)를 타거나, 백엔드 URL을 직접 타야 함.
// 여기서는 백엔드가 4000번 포트이므로 직접 지정하거나 환경변수 사용
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
}

export interface Comment {
    id: string
    post_id: string
    user_id: string
    blog_id: string | null
    comment_text: string
    created_at: string
    parent_id: string | null
    profiles: {
        id: string
        nickname: string | null
        profile_image_url: string | null
    }
    blog: {
        id: string
        name: string
        thumbnail_url: string | null
    } | null
}

export interface CommentsResponse {
    comments: Comment[]
    totalCount: number
}

// 댓글 목록 조회 (루트 댓글 기준 페이지네이션)
export async function getComments(postId: string, limit = 20, offset = 0): Promise<CommentsResponse> {
    const token = await getAuthToken()
    const headers: Record<string, string> = {}

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/api/comments/${postId}?limit=${limit}&offset=${offset}`, {
        headers,
        cache: 'no-store' // 항상 최신 댓글
    })

    if (!response.ok) {
        throw new Error('Failed to fetch comments')
    }

    return response.json()
}

// 댓글 작성
export async function createComment(postId: string, text: string, parentId?: string, blogId?: string): Promise<Comment> {
    const token = await getAuthToken()

    if (!token) {
        throw new Error('로그인이 필요합니다')
    }

    const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            post_id: postId,
            comment_text: text,
            parent_id: parentId,
            blog_id: blogId
        }),
    })

    if (!response.ok) {
        throw new Error('댓글 작성에 실패했습니다')
    }

    return response.json()
}

// 댓글 삭제
export async function deleteComment(commentId: string): Promise<void> {
    const token = await getAuthToken()

    if (!token) {
        throw new Error('로그인이 필요합니다')
    }

    const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        throw new Error('댓글 삭제에 실패했습니다')
    }
}
