'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPost, incrementViewCount, PostWithDetails } from '@/lib/api/posts'
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
import PostActions from '@/components/post/PostActions'
import RelatedPosts from '@/components/post/RelatedPosts'

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

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [postId])

    useEffect(() => {
        const fetchData = async () => {
            setIsPrivateError(false)
            setNotFound(false)
            setLoading(true)

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

    const viewCountRef = useRef(false)
    useEffect(() => {
        if (viewCountRef.current) return
        viewCountRef.current = true

        incrementViewCount(postId).catch(err => console.error('View count error:', err))
    }, [postId])

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
        })
    }

    if (loading) {
        return <></>
    }

    if (isPrivateError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <div className="text-center px-6">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
                        <svg className="h-10 w-10 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-black dark:text-white">비공개 글입니다</h2>
                    <p className="mt-2 text-sm text-black/50 dark:text-white/50">작성자만 확인할 수 있는 게시글입니다.</p>
                    <a
                        href="/"
                        className="mt-8 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
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
        router.push(`/write?id=${postId}`)
    }

    const handleDelete = async () => {
        try {
            await deletePost(postId)
            await showAlert('게시글이 삭제되었습니다.')
            router.push(`/blog/${postData?.blog.id}`)
        } catch (error) {
            await showAlert('삭제에 실패했습니다.')
        }
    }

    const handleToggleVisibility = async () => {
        if (!postData) return
        const newPrivateState = !((postData as any).is_private)

        try {
            await updatePost(postId, { is_private: newPrivateState })
            setPostData({ ...postData, is_private: newPrivateState } as any)
            await showAlert(newPrivateState ? '비공개로 전환되었습니다.' : '공개로 전환되었습니다.')
        } catch (error) {
            await showAlert('상태 변경에 실패했습니다.')
        }
    }

    const isAuthor = user?.id === postData?.user_id && selectedBlog?.id === postData?.blog?.id

    return (
        <BlogSkinProvider blogId={postData.blog.id}>
            <div className="min-h-screen bg-[var(--blog-bg)]">
                <BlogHeader blogName={postData.blog.name} blogId={postData.blog.id} />

                <main className="mx-auto max-w-[680px] px-6 pb-20 pt-12">
                    {/* 상단 메타 */}
                    <div className="mb-8">
                        {/* 카테고리 */}
                        {postData.categories && postData.categories.length > 0 && (
                            <div className="mb-4">
                                {postData.categories.map((cat, index) => (
                                    <span key={cat.id}>
                                        <span className="text-sm font-medium text-[var(--blog-accent)]">
                                            {cat.name}
                                        </span>
                                        {index < postData.categories!.length - 1 && (
                                            <span className="mx-1.5 text-[var(--blog-muted)]">/</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 제목 */}
                        <h1 className="text-[2.5rem] font-bold leading-[1.2] tracking-tight text-[var(--blog-fg)]">
                            {postData.title}
                        </h1>

                        {/* 작성자 정보 */}
                        <div className="mt-8 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <a href={`/blog/${postData.blog.id}`} className="shrink-0">
                                    <div className="h-11 w-11 overflow-hidden rounded-full bg-[var(--blog-fg)]/5">
                                        {(postData.blog.thumbnail_url || postData.profile?.profile_image_url) ? (
                                            <img
                                                src={postData.blog.thumbnail_url || postData.profile?.profile_image_url || ''}
                                                alt={postData.blog.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--blog-muted)]">
                                                {postData.blog.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </a>
                                <div>
                                    <a
                                        href={`/blog/${postData.blog.id}`}
                                        className="text-[15px] font-semibold text-[var(--blog-fg)] hover:underline"
                                    >
                                        {postData.blog.name}
                                    </a>
                                    <div className="flex items-center gap-2 text-sm text-[var(--blog-muted)]">
                                        <span>{formatDate(postData.created_at)}</span>
                                        {(postData as any).view_count > 0 && (
                                            <>
                                                <span>·</span>
                                                <span>조회 {(postData as any).view_count?.toLocaleString()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <PostActionMenu
                                isAuthor={isAuthor}
                                isPrivate={(postData as any).is_private}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleVisibility={handleToggleVisibility}
                            />
                        </div>

                        {/* 비공개 표시 */}
                        {(postData as any).is_private && (
                            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--blog-fg)]/5 px-4 py-2 text-sm text-[var(--blog-muted)]">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>비공개 글</span>
                            </div>
                        )}
                    </div>

                    {/* 본문 */}
                    <article
                        ref={contentRef}
                        className="post-content"
                        dangerouslySetInnerHTML={{ __html: postData.content }}
                    />

                    {/* 태그 (카테고리가 있으면 하단에도 표시) */}
                    {postData.categories && postData.categories.length > 0 && (
                        <div className="mt-12 flex flex-wrap gap-2">
                            {postData.categories.map((cat) => (
                                <span
                                    key={cat.id}
                                    className="rounded-full bg-[var(--blog-fg)]/5 px-4 py-1.5 text-sm text-[var(--blog-muted)]"
                                >
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 공감/공유 */}
                    <div className="mt-12 border-t border-[var(--blog-border)] pt-8">
                        <PostActions
                            postId={postData.id}
                            initialLikeCount={(postData as any).like_count || 0}
                            initialIsLiked={(postData as any).is_liked || false}
                        />
                    </div>

                    {/* 작성자 카드 */}
                    <SubscriptionCard
                        blogId={postData.blog.id}
                        blogName={postData.blog.name}
                        blogDescription={postData.blog.description || null}
                        authorId={postData.user_id}
                        thumbnailUrl={postData.blog.thumbnail_url}
                        profileImageUrl={postData.profile?.profile_image_url || null}
                    />

                    {/* 이전/다음 글 */}
                    <RelatedPosts
                        prevPost={postData.prev_post}
                        nextPost={postData.next_post}
                    />

                    {/* 댓글 */}
                    <CommentSection postId={postId} />
                </main>
            </div>
        </BlogSkinProvider>
    )
}
