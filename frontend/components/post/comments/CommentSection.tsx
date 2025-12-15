'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Comment, getComments, createComment, deleteComment } from '@/lib/api/comments'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'
import { useUserStore } from '@/lib/store/useUserStore'
import { useBlogStore } from '@/lib/store/useBlogStore'
import { useModal } from '@/components/common/Modal'

const COMMENTS_PER_PAGE = 10

interface CommentSectionProps {
    postId: string
}

export default function CommentSection({ postId }: CommentSectionProps) {
    const { user, isLoading: isUserLoading } = useUserStore()
    const { selectedBlog, isLoading: isBlogLoading, hasFetched, fetchBlogs } = useBlogStore()
    const { showAlert } = useModal()
    const [comments, setComments] = useState<Comment[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [rootOffset, setRootOffset] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // 사용자 블로그 정보 로드
    useEffect(() => {
        if (isUserLoading) return
        if (user && !hasFetched && !isBlogLoading) {
            fetchBlogs(user.id)
        }
    }, [user, isUserLoading, hasFetched, isBlogLoading, fetchBlogs])

    // 초기 댓글 로드
    const fetchComments = useCallback(async () => {
        try {
            const { comments: data, totalCount: total } = await getComments(postId, COMMENTS_PER_PAGE, 0)
            setComments(data)
            setTotalCount(total)
            // 루트 댓글 수 계산
            const rootCount = data.filter(c => !c.parent_id).length
            setRootOffset(rootCount)
            setHasMore(rootCount === COMMENTS_PER_PAGE)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [postId])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    // 추가 댓글 로드
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return

        setLoadingMore(true)
        try {
            const { comments: newComments } = await getComments(postId, COMMENTS_PER_PAGE, rootOffset)
            if (newComments.length > 0) {
                setComments(prev => [...prev, ...newComments])
                const newRootCount = newComments.filter(c => !c.parent_id).length
                setRootOffset(prev => prev + newRootCount)
                setHasMore(newRootCount === COMMENTS_PER_PAGE)
            } else {
                setHasMore(false)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingMore(false)
        }
    }, [postId, rootOffset, loadingMore, hasMore])

    // Intersection Observer로 스크롤 감지
    useEffect(() => {
        if (loading || !hasMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )

        const currentRef = loadMoreRef.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef)
            }
        }
    }, [loading, hasMore, loadMore])

    const handleCreateComment = async (text: string) => {
        setSubmitting(true)
        try {
            const newComment = await createComment(postId, text, undefined, selectedBlog?.id)
            setComments(prev => [...prev, newComment])
            setTotalCount(prev => prev + 1)
        } catch (err) {
            console.error(err)
            await showAlert('댓글 작성에 실패했습니다.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReply = async (parentId: string, text: string) => {
        try {
            const newComment = await createComment(postId, text, parentId, selectedBlog?.id)
            setComments(prev => [...prev, newComment])
            setTotalCount(prev => prev + 1)
        } catch (err) {
            throw err // Let Item handle error alert
        }
    }

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId)
            // 삭제된 댓글과 그 대댓글 수 계산
            const deletedComment = comments.find(c => c.id === commentId)
            const deletedReplies = comments.filter(c => c.parent_id === commentId)
            const deletedCount = 1 + deletedReplies.length
            setTotalCount(prev => prev - deletedCount)
            await fetchComments() // Refresh list
        } catch (err) {
            throw err
        }
    }

    // 최상위 댓글 (parent_id 가 없는 댓글)
    const rootComments = comments.filter(c => !c.parent_id)

    return (
        <div className="mt-16 border-t border-[var(--blog-border)] pt-8">
            <h3 className="mb-6 text-lg font-bold text-[var(--blog-fg)]">
                댓글 <span className="text-[var(--blog-muted)]">{totalCount}</span>
            </h3>

            {/* 댓글 작성 폼 */}
            <div className="mb-10">
                <CommentForm
                    onSubmit={handleCreateComment}
                    loading={submitting}
                />
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--blog-fg)]/20 border-t-[var(--blog-fg)]" />
                    </div>
                ) : rootComments.length > 0 ? (
                    <>
                        {rootComments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                replies={comments.filter(c => c.parent_id === comment.id)}
                                allComments={comments}
                                onReply={handleReply}
                                onDelete={handleDelete}
                            />
                        ))}

                        {/* 무한스크롤 감지 영역 */}
                        <div ref={loadMoreRef} className="h-10" />

                        {/* 로딩 인디케이터 */}
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--blog-fg)]/20 border-t-[var(--blog-fg)]" />
                            </div>
                        )}

                        {/* 더 이상 없음 표시 */}
                        {!hasMore && rootComments.length > COMMENTS_PER_PAGE && (
                            <div className="py-4 text-center text-xs text-[var(--blog-muted)]">
                                모든 댓글을 확인했습니다
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-10 text-center text-sm text-[var(--blog-muted)]">
                        첫 번째 댓글을 남겨보세요!
                    </div>
                )}
            </div>
        </div>
    )
}
