'use client'

import { useState, useEffect, useCallback } from 'react'
import { Comment, getComments, createComment, deleteComment } from '@/lib/api/comments'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'
import { useUserStore } from '@/lib/store/useUserStore'
import { useModal } from '@/components/common/Modal'

interface CommentSectionProps {
    postId: string
}

export default function CommentSection({ postId }: CommentSectionProps) {
    const { user } = useUserStore()
    const { showAlert } = useModal()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const fetchComments = useCallback(async () => {
        try {
            const data = await getComments(postId)
            setComments(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [postId])

    useEffect(() => {
        fetchComments()
    }, [fetchComments])

    const handleCreateComment = async (text: string) => {
        setSubmitting(true)
        try {
            const newComment = await createComment(postId, text)
            // 백엔드에서 반환된 완성된 댓글 객체(프로필 포함)를 바로 추가
            setComments(prev => [...prev, newComment])
        } catch (err) {
            console.error(err)
            await showAlert('댓글 작성에 실패했습니다.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleReply = async (parentId: string, text: string) => {
        try {
            const newComment = await createComment(postId, text, parentId)
            setComments(prev => [...prev, newComment])
        } catch (err) {
            throw err // Let Item handle error alert
        }
    }

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId)
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
                댓글 <span className="text-[var(--blog-muted)]">{comments.length}</span>
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
                    rootComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replies={comments.filter(c => c.parent_id === comment.id)}
                            allComments={comments}
                            onReply={handleReply}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <div className="py-10 text-center text-sm text-[var(--blog-muted)]">
                        첫 번째 댓글을 남겨보세요!
                    </div>
                )}
            </div>
        </div>
    )
}
