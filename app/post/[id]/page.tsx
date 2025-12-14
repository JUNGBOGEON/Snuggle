'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPost, PostWithDetails } from '@/lib/api/posts'
import hljs from 'highlight.js'
import BlogSkinProvider from '@/components/blog/BlogSkinProvider'
import AccessDenied from '@/components/common/AccessDenied'
import PostActionMenu from '@/components/post/PostActionMenu'
import { useUserStore } from '@/lib/store/useUserStore'
import { deletePost, updatePost } from '@/lib/api/posts'

// 게시글 컨텐츠 스타일
import '@/styles/post-content.css'
import '@/styles/highlight-theme.css'

export default function PostPage() {
    const params = useParams()
    const router = useRouter()
    const postId = params.id as string
    const contentRef = useRef<HTMLElement>(null)

    const [postData, setPostData] = useState<PostWithDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const { user } = useUserStore() // 유저 스토어 사용 (최상위 호출)

    useEffect(() => {
        const fetchData = async () => {
            // 게시글 정보 (백엔드 API 사용)
            try {
                const data = await getPost(postId)
                if (!data) {
                    setNotFound(true)
                    setLoading(false)
                    return
                }
                setPostData(data)
            } catch (err) {
                console.error('Failed to load post:', err)
                setNotFound(true)
            }

            setLoading(false)
        }

        fetchData()
    }, [postId])

    // 코드블록 하이라이팅 적용
    useEffect(() => {
        if (postData && contentRef.current) {
            contentRef.current.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block as HTMLElement)
            })
        }
    }, [postData])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        })
    }


    if (loading) {
        return (
            <div
                className="flex min-h-screen items-center justify-center"
                style={{ background: 'var(--background)' }}
            >
                <div
                    className="h-8 w-8 animate-spin rounded-full border-2"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--foreground) 20%, transparent)',
                        borderTopColor: 'var(--foreground)'
                    }}
                />
            </div>
        )
    }

    if (notFound || !postData || !postData.blog) {
        return (
            <div
                className="flex min-h-screen flex-col items-center justify-center"
                style={{ background: 'var(--background)', color: 'var(--foreground)' }}
            >
                <h1 className="text-2xl font-bold">
                    게시글을 찾을 수 없습니다
                </h1>
                <button
                    onClick={() => router.back()}
                    className="mt-4 opacity-50 hover:opacity-100"
                >
                    뒤로 가기
                </button>
            </div>
        )
    }



    const handleEdit = () => {
        // 수정 페이지로 이동
        router.push(`/write?id=${postId}`)
    }

    const handleDelete = async () => {
        try {
            await deletePost(postId)
            alert('게시글이 삭제되었습니다.')
            router.push(`/blog/${postData?.blog.id}`)
        } catch (error) {
            console.error('Delete failed:', error)
            alert('삭제에 실패했습니다.')
        }
    }

    const handleToggleVisibility = async () => {
        if (!postData) return
        const newPrivateState = !((postData as any).is_private)

        try {
            await updatePost(postId, {
                is_private: newPrivateState
            })
            // 상태 업데이트 (UI 반영)
            setPostData({ ...postData, is_private: newPrivateState } as any)
            alert(newPrivateState ? '비공개로 전환되었습니다.' : '공개로 전환되었습니다.')
        } catch (error) {
            console.error('Toggle visibility failed:', error)
            alert('상태 변경에 실패했습니다.')
        }
    }

    // 작성자 확인
    const isAuthor = user?.id === postData?.user_id

    return (
        <BlogSkinProvider blogId={postData.blog.id}>
            <div className="min-h-screen bg-[var(--blog-bg)]" style={{ fontFamily: 'var(--blog-font-sans, GMarketSans, sans-serif)', color: 'var(--blog-fg)' }}>
                {/* 헤더 */}
                <header className="border-b border-[var(--blog-border)]">
                    <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
                        <a href="/" className="text-lg font-bold text-[var(--blog-fg)]">
                            Snuggle
                        </a>
                    </div>
                </header>

                {/* 메인 컨텐츠 */}
                <main className="mx-auto max-w-3xl px-6 py-12">
                    {/* 비공개 표시 - is_private 체크 */}
                    {((postData as any).is_private) && (
                        <div className="mb-6 flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-3 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8a3 3 0 00-3-3H6a3 3 0 00-3 3v1m12-1a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3v-6" />
                            </svg>
                            <span className="text-sm font-medium">이 글은 비공개 상태입니다</span>
                        </div>
                    )}

                    {/* 카테고리 */}
                    {postData.category && (
                        <span className="inline-block rounded-full bg-[var(--blog-fg)]/5 px-3 py-1 text-sm text-[var(--blog-muted)]">
                            {postData.category.name}
                        </span>
                    )}

                    {/* 제목 */}
                    <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--blog-fg)] md:text-4xl">
                        {postData.title}
                    </h1>

                    {/* 메타 정보 */}
                    <div className="mt-6 flex items-center justify-between border-b border-[var(--blog-border)] pb-6">
                        <div className="flex items-center gap-4">
                            {/* 작성자 */}
                            <a
                                href={`/blog/${postData.blog.id}`}
                                className="flex items-center gap-3 transition-opacity hover:opacity-80"
                            >
                                {(postData.blog.thumbnail_url || postData.profile?.profile_image_url) ? (
                                    <img
                                        src={postData.blog.thumbnail_url || postData.profile?.profile_image_url || ''}
                                        alt={postData.profile?.nickname || postData.blog.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--blog-fg)]/10 text-sm font-bold text-[var(--blog-muted)]">
                                        {(postData.profile?.nickname || postData.blog.name).charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-[var(--blog-fg)]">
                                        {postData.profile?.nickname || postData.blog.name}
                                    </p>
                                    <p className="text-sm text-[var(--blog-muted)]">
                                        {formatDate(postData.created_at)}
                                    </p>
                                </div>
                            </a>
                        </div>

                        {/* 메뉴 버튼 */}
                        <PostActionMenu
                            isAuthor={isAuthor}
                            isPrivate={(postData as any).is_private}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleVisibility={handleToggleVisibility}
                        />
                    </div>

                    {/* 본문 */}
                    <article
                        ref={contentRef}
                        className="post-content mt-10 max-w-none"
                        dangerouslySetInnerHTML={{ __html: postData.content }}
                    />

                    {/* 하단 네비게이션 */}
                    <div className="mt-16 flex items-center justify-between border-t border-[var(--blog-border)] pt-8">
                        <a
                            href={`/blog/${postData.blog.id}`}
                            className="flex items-center gap-2 text-[var(--blog-muted)] transition-colors hover:text-[var(--blog-fg)]"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            목록으로
                        </a>
                    </div>
                </main>
            </div>
        </BlogSkinProvider>
    )
}
