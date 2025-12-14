const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// 계정 탈퇴
export async function deleteAccount(token: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/api/profile`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to delete account')
    }

    return response.json()
}

// 블로그 소프트 삭제
export async function deleteBlog(token: string, blogId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/api/profile/blog/${blogId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to delete blog')
    }

    return response.json()
}

// 블로그 복구
export async function restoreBlog(token: string, blogId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/api/profile/blog/${blogId}/restore`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to restore blog')
    }

    return response.json()
}

export interface DeletedBlog {
    id: string
    name: string
    description: string | null
    thumbnail_url: string | null
    deleted_at: string
}

// 삭제된 블로그 목록 조회
export async function getDeletedBlogs(token: string): Promise<DeletedBlog[]> {
    const response = await fetch(`${API_BASE}/api/profile/blogs/deleted`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to get deleted blogs')
    }

    return response.json()
}

// 계정 삭제 상태 확인
export interface AccountStatus {
    isDeleted: boolean
    deletedAt: string | null
}

export async function getAccountStatus(token: string): Promise<AccountStatus> {
    const response = await fetch(`${API_BASE}/api/profile/status`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        throw new Error('Failed to get account status')
    }

    return response.json()
}

// 계정 복구
export async function restoreAccount(token: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/api/profile/restore`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to restore account')
    }

    return response.json()
}
