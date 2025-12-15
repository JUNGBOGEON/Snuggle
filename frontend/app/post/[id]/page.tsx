'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPost, PostWithDetails } from '@/lib/api/posts'
import { createClient } from '@/lib/supabase/client'
import hljs from 'highlight.js'
import BlogSkinProvider from '@/components/blog/BlogSkinProvider'
import BlogHeader from '@/components/layout/BlogHeader'
import AccessDenied from '@/components/common/AccessDenied'
import PostActionMenu from '@/components/post/PostActionMenu'
import { useUserStore } from '@/lib/store/useUserStore'
import { useBlogStore } from '@/lib/store/useBlogStore'
import { deletePost, updatePost } from '@/lib/api/posts'
import { useModal } from '@/components/common/Modal'
import SubscriptionCard from '@/components/post/SubscriptionCard'
import PostActionToolbar from '@/components/post/PostActionToolbar'
import SubscriptionButton from '@/components/common/SubscriptionButton'
import RelatedPosts from '@/components/post/RelatedPosts'

// 게시글 컨텐츠 스타일
import '@/styles/post-content.css'
import '@/styles/highlight-theme.css'
import CommentSection from '@/components/post/comments/CommentSection'

export default function PostPage() {
    const params = useParams()
    const router = useRouter()
    const postId = params.id as string
    const contentRef = useRef<HTMLElement>(null)

    const [postData, setPostData] = useState<PostWithDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [isPrivateError, setIsPrivateError] = useState(false)
    const { user } = useUserStore()
    const { selectedBlog } = useBlogStore()
    const { showAlert } = useModal()

    // 페이지 진입/변경 시 스크롤 최상단 이동
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [postId])

    useEffect(() => {
        const fetchData = async () => {
            // 에러 상태 초기화
            setIsPrivateError(false)
            setNotFound(false)
            setLoading(true)

            // 게시글 정보 (백엔드 API 사용)
            // selectedBlog?.id를 전달하여 비공개 글 접근 권한 확인
            try {
                const data = await getPost(postId, selectedBlog?.id)
                if (!data) {
                    setNotFound(true)
                    setLoading(false)
                    return
                }
                setPostData(data)
            } catch (err: any) {
                if (err.message === 'Private' || err.message?.includes('Private')) {
                    setIsPrivateError(true)
                } else {
                    setNotFound(true)
                }
            }

            setLoading(false)
        }

        fetchData()
    }, [postId, selectedBlog?.id])

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
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
            </div>
        )
    }

    if (isPrivateError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">비공개글입니다.</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">작성자만 확인할 수 있는 게시글입니다.</p>
                    <a
                        href="/"
                        className="mt-6 inline-block rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        홈으로 돌아가기
                    </a>
                </div>
            </div>
        )
    }

    if (notFound || !postData || !postData.blog) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <AccessDenied />
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
            await showAlert('게시글이 삭제되었습니다.')
            router.push(`/blog/${postData?.blog.id}`)
        } catch (error) {
            console.error('Delete failed:', error)
            await showAlert('삭제에 실패했습니다.')
        }
    }

    const handleToggleVisibility = async () => {
        if (!postData) return
        const newPrivateState = !((postData as any).is_private)

        try {
            await updatePost(postId, {
                is_private: newPrivateState
            })
            setPostData({ ...postData, is_private: newPrivateState } as any)
            await showAlert(newPrivateState ? '비공개로 전환되었습니다.' : '공개로 전환되었습니다.')
        } catch (error) {
            console.error('Toggle visibility failed:', error)
            await showAlert('상태 변경에 실패했습니다.')
        }
    }

    // 작성자 확인 - user_id 일치 + 현재 선택된 블로그가 해당 게시글의 블로그인지 확인
    const isAuthor = user?.id === postData?.user_id && selectedBlog?.id === postData?.blog?.id

    return (
        <BlogSkinProvider blogId={postData.blog.id}>
            <div className="min-h-screen bg-[var(--blog-bg)]" style={{ fontFamily: 'var(--blog-font-sans, GMarketSans, sans-serif)', color: 'var(--blog-fg)' }}>
                {/* 블로그 테마 헤더 */}
                <BlogHeader blogName={postData.blog.name} blogId={postData.blog.id} />

                {/* 메인 컨텐츠 */}
                <main className="mx-auto max-w-3xl px-6 py-12">
                    {/* 비공개 표시 - is_private 체크 */}
                    {((postData as any).is_private) && (
                        <div className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'rgb(161, 98, 7)' }}>
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
                                <div className="h-10 w-10 rounded-full overflow-hidden bg-[var(--blog-fg)]/10">
                                    {(postData.blog.thumbnail_url || postData.profile?.profile_image_url) && (
                                        <img
                                            src={postData.blog.thumbnail_url || postData.profile?.profile_image_url || ''}
                                            alt={postData.blog.name}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--blog-fg)]">
                                        {postData.blog.name}
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

                    {/* 구분선 */}
                    <div className="my-12 h-px w-full bg-black/10 dark:bg-white/10" />

                    {/* 액션 툴바 + 구독 버튼 */}
                    <div className="flex items-center gap-3 mb-0">
                        <PostActionToolbar
                            postId={postData.id}
                            initialIsLiked={postData.is_liked}
                        />
                        <SubscriptionButton
                            targetId={postData.user_id}
                            variant="blog"
                            className="!px-4 !py-2 h-[42px]"
                        />
                    </div>

                    {/* 관련 글 (이전/다음) */}
                    <RelatedPosts
                        categoryName={postData.blog.name}
                        currentPost={postData}
                        prevPost={postData.prev_post}
                        nextPost={postData.next_post}
                    />

                    {/* 구분선 (하단 프로필 카드 위) - 이미 SubscriptionCard 내부에 테두리가 있으므로 상단 구분선 추가 */}
                    <div className="my-12 h-px w-full bg-black/10 dark:bg-white/10" />

                    {/* 구독 카드 */}
                    <SubscriptionCard
                        blogId={postData.blog.id}
                        blogName={postData.blog.name}
                        blogDescription={(postData.blog as any).description || null}
                        authorId={postData.user_id}
                        thumbnailUrl={postData.blog.thumbnail_url}
                        profileImageUrl={postData.profile?.profile_image_url || null}
                    />

                    {/* 댓글 섹션 */}
                    <CommentSection postId={postId} />

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
