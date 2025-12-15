'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Comment, getComments, createComment, deleteComment, updateComment } from '@/lib/api/comments'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'
import { useUserStore } from '@/lib/store/useUserStore'
import { useBlogStore } from '@/lib/store/useBlogStore'
import { useModal } from '@/components/common/Modal'

const COMMENTS_PER_PAGE = 20

interface CommentSectionProps {
    postId: string
    onCountChange?: (count: number) => void
}

export default function CommentSection({ postId, onCountChange }: CommentSectionProps) {
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
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
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

    useEffect(() => {
        onCountChange?.(totalCount)
    }, [totalCount, onCountChange])

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

    // Intersection Observer
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
        if (currentRef) observer.observe(currentRef)

        return () => {
            if (currentRef) observer.unobserve(currentRef)
        }
    }, [loading, hasMore, loadMore])

    // 댓글 작성 (루트)
    const handleCreateComment = async (text: string) => {
        setSubmitting(true)
        try {
            const newComment = await createComment(postId, text, undefined, selectedBlog?.id)
            setComments(prev => [newComment, ...prev])
            setTotalCount(prev => prev + 1)
        } catch (err) {
            console.error(err)
            await showAlert('댓글 작성에 실패했습니다.')
        } finally {
            setSubmitting(false)
        }
    }

    // 답글 작성
    const handleCreateReply = async (parentId: string, text: string) => {
        try {
            const newComment = await createComment(postId, text, parentId, selectedBlog?.id)
            setComments(prev => [...prev, newComment])
            setTotalCount(prev => prev + 1)
            setReplyingTo(null)
        } catch (err) {
            console.error(err)
            await showAlert('답글 작성에 실패했습니다.')
        }
    }

    // 답글 클릭
    const handleReply = (commentId: string) => {
        setReplyingTo(commentId)
    }

    // 답글 취소
    const handleCancelReply = () => {
        setReplyingTo(null)
    }

    // 댓글 삭제
    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId)
            const deletedReplies = comments.filter(c => c.parent_id === commentId)
            const deletedCount = 1 + deletedReplies.length
            setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId))
            setTotalCount(prev => prev - deletedCount)
        } catch (err) {
            throw err
        }
    }

    // 댓글 수정
    const handleUpdate = async (commentId: string, newText: string) => {
        try {
            const updatedComment = await updateComment(commentId, newText)
            setComments(prev => prev.map(c =>
                c.id === commentId ? { ...c, comment_text: newText, updated_at: updatedComment.updated_at } : c
            ))
        } catch (err) {
            throw err
        }
    }

    // 루트 댓글과 답글 분리
    const rootComments = comments.filter(c => !c.parent_id)
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

    // 루트 댓글을 최신순으로 정렬
    const sortedRootComments = [...rootComments].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
        <section className="mt-16 border-t border-black/10 pt-10 dark:border-white/10">
            {/* 헤더 */}
            <h2 className="mb-6 text-lg font-semibold text-black dark:text-white">
                댓글 {totalCount > 0 && (
                    <span className="ml-1 font-normal text-black/50 dark:text-white/50">{totalCount}</span>
                )}
            </h2>

            {/* 댓글 작성 폼 */}
            <div className="mb-8">
                <CommentForm
                    onSubmit={handleCreateComment}
                    loading={submitting}
                    placeholder="댓글 추가..."
                />
            </div>

            {/* 댓글 목록 */}
            <div className="divide-y divide-black/5 dark:divide-white/5">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
                    </div>
                ) : sortedRootComments.length > 0 ? (
                    <>
                        {sortedRootComments.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                replies={getReplies(comment.id)}
                                onReply={handleReply}
                                onDelete={handleDelete}
                                onUpdate={handleUpdate}
                                onCreateReply={handleCreateReply}
                                replyingTo={replyingTo}
                                onCancelReply={handleCancelReply}
                            />
                        ))}

                        {/* 무한스크롤 감지 영역 */}
                        <div ref={loadMoreRef} className="h-4" />

                        {/* 로딩 인디케이터 */}
                        {loadingMore && (
                            <div className="flex justify-center py-6">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-sm text-black/40 dark:text-white/40">
                            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                        </p>
                    </div>
                )}
            </div>
        </section>
    )
}
