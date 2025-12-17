'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPost, incrementViewCount, PostWithDetails } from '@/lib/api/posts'
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
import CommentSection from '@/components/post/comments/CommentSection'

import '@/styles/post-content.css'
import '@/styles/highlight-theme.css'

export default function PostPage() {
    const params = useParams()
    const router = useRouter()
    const postId = params.id as string
    const contentRef = useRef<HTMLDivElement>(null)

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
        return null
    }

    if (isPrivateError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--blog-bg)]">
                <div className="text-center px-6">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--blog-fg)]/5">
                        <svg className="h-8 w-8 text-[var(--blog-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-medium text-[var(--blog-fg)]">비공개 글입니다</h2>
                    <p className="mt-2 text-sm text-[var(--blog-muted)]">작성자만 확인할 수 있습니다</p>
                    <a href="/" className="mt-6 inline-block text-sm text-[var(--blog-fg)] underline underline-offset-4 hover:no-underline">
                        홈으로 돌아가기
                    </a>
                </div>
            </div>
        )
    }

    if (notFound || !postData || !postData.blog) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--blog-bg)]">
                <AccessDenied />
            </div>
        )
    }

    const handleEdit = () => router.push(`/write?id=${postId}`)

    const handleDelete = async () => {
        try {
            await deletePost(postId)
            await showAlert('게시글이 삭제되었습니다.')
            router.push(`/blog/${postData?.blog.id}`)
        } catch {
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
        } catch {
            await showAlert('상태 변경에 실패했습니다.')
        }
    }

    const isAuthor = user?.id === postData?.user_id && selectedBlog?.id === postData?.blog?.id

    return (
        <BlogSkinProvider blogId={postData.blog.id}>
            <div className="min-h-screen bg-[var(--blog-bg)]">
                <BlogHeader blogName={postData.blog.name} blogId={postData.blog.id} />

                <main className="mx-auto max-w-[680px] px-5 pb-20 pt-10">
                    {/* 헤더 */}
                    <header className="mb-10">
                        {/* 카테고리 */}
                        {postData.categories && postData.categories.length > 0 && (
                            <div className="mb-4 text-sm text-[var(--blog-accent)]">
                                {postData.categories.map((cat, i) => (
                                    <span key={cat.id}>
                                        {cat.name}
                                        {i < postData.categories!.length - 1 && <span className="mx-1 text-[var(--blog-border)]">/</span>}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* 제목 */}
                        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[var(--blog-fg)] sm:text-4xl">
                            {postData.title}
                        </h1>

                        {/* 메타 정보 */}
                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <a href={`/blog/${postData.blog.id}`}>
                                    <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--blog-fg)]/5">
                                        {(postData.blog.thumbnail_url || postData.profile?.profile_image_url) ? (
                                            <img
                                                src={postData.blog.thumbnail_url || postData.profile?.profile_image_url || ''}
                                                alt={postData.blog.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--blog-muted)]">
                                                {postData.blog.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </a>
                                <div className="text-sm">
                                    <a href={`/blog/${postData.blog.id}`} className="font-medium text-[var(--blog-fg)] hover:underline">
                                        {postData.blog.name}
                                    </a>
                                    <div className="text-[var(--blog-muted)]">
                                        {formatDate(postData.created_at)}
                                        {(postData as any).view_count > 0 && (
                                            <span> · 조회 {(postData as any).view_count?.toLocaleString()}</span>
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
                            <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--blog-muted)]">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                비공개
                            </div>
                        )}
                    </header>

                    {/* 본문 */}
                    <article
                        ref={contentRef}
                        className="post-content"
                        dangerouslySetInnerHTML={{ __html: postData.content }}
                    />

                    {/* 태그 */}
                    {postData.categories && postData.categories.length > 0 && (
                        <div className="mt-12 flex flex-wrap gap-2">
                            {postData.categories.map((cat) => (
                                <span
                                    key={cat.id}
                                    className="rounded-full bg-[var(--blog-fg)]/5 px-3 py-1 text-sm text-[var(--blog-muted)]"
                                >
                                    #{cat.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* 좋아요/공유 */}
                    <PostActions
                        postId={postData.id}
                        initialLikeCount={(postData as any).like_count || 0}
                        initialIsLiked={(postData as any).is_liked || false}
                    />

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
                    <CommentSection
                        postId={postId}
                        allowComments={(postData as any).is_allow_comment !== false}
                    />
                </main>
            </div>
        </BlogSkinProvider>
    )
}
