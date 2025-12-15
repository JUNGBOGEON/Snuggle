'use client'

import { useState, useRef, useEffect } from 'react'
import { Comment } from '@/lib/api/comments'
import { useUserStore } from '@/lib/store/useUserStore'
import { useModal } from '@/components/common/Modal'
import CommentForm from './CommentForm'

interface CommentItemProps {
    comment: Comment
    replies: Comment[]
    onReply: (commentId: string) => void
    onDelete: (commentId: string) => Promise<void>
    onUpdate: (commentId: string, newText: string) => Promise<void>
    onCreateReply: (parentId: string, text: string) => Promise<void>
    replyingTo: string | null
    onCancelReply: () => void
    isReply?: boolean
}

export default function CommentItem({
    comment,
    replies,
    onReply,
    onDelete,
    onUpdate,
    onCreateReply,
    replyingTo,
    onCancelReply,
    isReply = false
}: CommentItemProps) {
    const { user } = useUserStore()
    const { showAlert, showConfirm } = useModal()
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(comment.comment_text)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showReplies, setShowReplies] = useState(false)
    const [replySubmitting, setReplySubmitting] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const editTextareaRef = useRef<HTMLTextAreaElement>(null)

    const isAuthor = user?.id === comment.user_id
    const isEdited = comment.updated_at && comment.updated_at !== comment.created_at
    const isReplying = replyingTo === comment.id

    const displayName = comment.blog?.name || comment.profiles?.nickname || '알 수 없음'
    const displayImage = comment.blog?.thumbnail_url || comment.profiles?.profile_image_url

    // 메뉴 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 수정 모드 시 textarea 자동 조절
    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
            editTextareaRef.current.style.height = 'auto'
            editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px'
            editTextareaRef.current.focus()
            editTextareaRef.current.setSelectionRange(editText.length, editText.length)
        }
    }, [isEditing, editText.length])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = (now.getTime() - date.getTime()) / 1000

        if (diff < 60) return '방금 전'
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
        if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
        if (diff < 2592000) return `${Math.floor(diff / 604800)}주 전`
        if (diff < 31536000) return `${Math.floor(diff / 2592000)}개월 전`
        return `${Math.floor(diff / 31536000)}년 전`
    }

    const handleDelete = async () => {
        setShowMenu(false)
        const confirmed = await showConfirm('댓글을 삭제하시겠습니까?')
        if (!confirmed) return

        setIsDeleting(true)
        try {
            await onDelete(comment.id)
        } catch {
            await showAlert('삭제에 실패했습니다.')
            setIsDeleting(false)
        }
    }

    const handleEdit = () => {
        setShowMenu(false)
        setIsEditing(true)
        setEditText(comment.comment_text)
    }

    const handleSaveEdit = async () => {
        if (!editText.trim() || editText === comment.comment_text) {
            setIsEditing(false)
            setEditText(comment.comment_text)
            return
        }

        setIsSaving(true)
        try {
            await onUpdate(comment.id, editText)
            setIsEditing(false)
        } catch {
            await showAlert('수정에 실패했습니다.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditText(comment.comment_text)
    }

    const handleReplyClick = () => {
        onReply(comment.id)
    }

    const handleSubmitReply = async (text: string) => {
        setReplySubmitting(true)
        try {
            // 대댓글에 답글 다는 경우, 같은 루트 댓글 아래에 추가
            const parentId = comment.parent_id || comment.id
            await onCreateReply(parentId, text)
            setShowReplies(true)
        } finally {
            setReplySubmitting(false)
        }
    }

    const sortedReplies = [...replies].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    return (
        <div className={isReply ? 'relative pl-12' : 'py-5'}>
            <div className="flex gap-3">
                {/* 프로필 이미지 */}
                <div className={`${isReply ? 'h-7 w-7' : 'h-9 w-9'} shrink-0`}>
                    {displayImage ? (
                        <img
                            src={displayImage}
                            alt={displayName}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-black/10 text-xs font-medium text-black/50 dark:bg-white/10 dark:text-white/50">
                            {(displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* 내용 */}
                <div className="min-w-0 flex-1">
                    {/* 헤더 */}
                    <div className="flex items-center gap-2">
                        <span className={`font-medium text-black dark:text-white ${isReply ? 'text-sm' : 'text-sm'}`}>
                            {displayName}
                        </span>
                        <span className="text-xs text-black/40 dark:text-white/40">
                            {formatDate(comment.created_at)}
                        </span>
                        {isEdited && (
                            <span className="text-xs text-black/40 dark:text-white/40">(수정됨)</span>
                        )}

                        {/* 더보기 메뉴 - 헤더 오른쪽 끝 */}
                        {isAuthor && (
                            <div className="relative ml-auto" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="rounded-lg p-1 text-black/40 transition-colors hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white/60"
                                    aria-label="더보기"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="6" r="1.5" />
                                        <circle cx="12" cy="12" r="1.5" />
                                        <circle cx="12" cy="18" r="1.5" />
                                    </svg>
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[100px] overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-neutral-900">
                                        <button
                                            onClick={handleEdit}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-black/80 transition-colors hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/5"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                        >
                                            {isDeleting ? '삭제 중...' : '삭제'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 본문 or 수정 폼 */}
                    {isEditing ? (
                        <div className="mt-2">
                            <div className="overflow-hidden rounded-xl border border-black/20 bg-white dark:border-white/20 dark:bg-neutral-900">
                                <textarea
                                    ref={editTextareaRef}
                                    value={editText}
                                    onChange={(e) => {
                                        setEditText(e.target.value)
                                        e.target.style.height = 'auto'
                                        e.target.style.height = e.target.scrollHeight + 'px'
                                    }}
                                    className="block w-full resize-none bg-transparent px-4 py-3 text-sm text-black outline-none dark:text-white"
                                    rows={1}
                                />
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                                <button
                                    onClick={handleCancelEdit}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving || !editText.trim()}
                                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                >
                                    {isSaving ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-black/80 dark:text-white/80">
                            {comment.comment_text}
                        </p>
                    )}

                    {/* 액션 버튼 */}
                    {!isEditing && (
                        <div className="mt-2 flex items-center gap-4">
                            <button
                                onClick={handleReplyClick}
                                className="flex items-center gap-1 text-xs text-black/40 transition-colors hover:text-black/70 dark:text-white/40 dark:hover:text-white/70"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v6M3 10l6 6m-6-6l6-6" />
                                </svg>
                                답글
                            </button>
                        </div>
                    )}

                    {/* 인라인 답글 작성 폼 */}
                    {isReplying && (
                        <div className="mt-4">
                            <CommentForm
                                onSubmit={handleSubmitReply}
                                loading={replySubmitting}
                                placeholder={`${displayName}님에게 답글...`}
                                onCancel={onCancelReply}
                                isReply
                                autoFocus
                            />
                        </div>
                    )}

                    {/* 답글 토글 버튼 */}
                    {!isReply && sortedReplies.length > 0 && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
                        >
                            <svg
                                className={`h-4 w-4 transition-transform duration-200 ${showReplies ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            답글 {sortedReplies.length}개
                        </button>
                    )}

                    {/* 답글 목록 */}
                    {!isReply && showReplies && sortedReplies.length > 0 && (
                        <div className="relative mt-4 ml-[6px]">
                            {/* 메인 세로 연결선 - 루트 댓글 프로필 중앙에서 시작 */}
                            <div
                                className="absolute w-[2px] bg-black/15 dark:bg-white/15"
                                style={{
                                    left: '-42px',
                                    top: '-20px',
                                    bottom: '20px'
                                }}
                            />

                            {sortedReplies.map((reply, index) => (
                                <div key={reply.id} className="relative" style={{ marginTop: index > 0 ? '16px' : '0' }}>
                                    {/* 곡선 연결선 - L자 모양 */}
                                    <div
                                        className="absolute border-l-2 border-b-2 border-black/15 dark:border-white/15 rounded-bl-xl"
                                        style={{
                                            left: '-42px',
                                            top: '0',
                                            width: '30px',
                                            height: '14px'
                                        }}
                                    />

                                    <CommentItem
                                        comment={reply}
                                        replies={[]}
                                        onReply={onReply}
                                        onDelete={onDelete}
                                        onUpdate={onUpdate}
                                        onCreateReply={onCreateReply}
                                        replyingTo={replyingTo}
                                        onCancelReply={onCancelReply}
                                        isReply
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
