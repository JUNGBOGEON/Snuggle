'use client'

import { useState, useRef, useEffect } from 'react'
import { useUserStore } from '@/lib/store/useUserStore'
import { useBlogStore } from '@/lib/store/useBlogStore'
import { useModal } from '@/components/common/Modal'

const MAX_LENGTH = 500

interface CommentFormProps {
    onSubmit: (text: string) => Promise<void>
    placeholder?: string
    loading?: boolean
    autoFocus?: boolean
    onCancel?: () => void
    isReply?: boolean
}

export default function CommentForm({
    onSubmit,
    placeholder = '댓글 추가...',
    loading = false,
    autoFocus = false,
    onCancel,
    isReply = false
}: CommentFormProps) {
    const { user } = useUserStore()
    const { selectedBlog } = useBlogStore()
    const { showAlert } = useModal()
    const [text, setText] = useState('')
    const [isFocused, setIsFocused] = useState(autoFocus)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const kakaoProfileImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
    const profileImage = selectedBlog?.thumbnail_url || kakaoProfileImage
    const displayName = selectedBlog?.name || user?.user_metadata?.name || ''

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus()
            setIsFocused(true)
        }
    }, [autoFocus])

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim() || loading) return

        if (!user) {
            await showAlert('로그인이 필요합니다.')
            return
        }

        await onSubmit(text)
        setText('')
        if (!isReply) {
            setIsFocused(false)
        }
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleCancel = () => {
        setText('')
        setIsFocused(false)
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
        onCancel?.()
    }

    if (!user) {
        return (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--blog-border)] bg-[var(--blog-fg)]/[0.02] px-4 py-3">
                <div className={`${isReply ? 'h-7 w-7' : 'h-9 w-9'} shrink-0 rounded-full bg-[var(--blog-fg)]/10`} />
                <span className="text-sm text-[var(--blog-muted)]">
                    로그인 후 댓글을 작성할 수 있습니다.
                </span>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
                {/* 프로필 이미지 */}
                <div className={`${isReply ? 'h-7 w-7' : 'h-9 w-9'} shrink-0`}>
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt={displayName}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--blog-fg)]/10 text-xs font-medium text-[var(--blog-muted)]">
                            {(displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* 입력 영역 */}
                <div className="min-w-0 flex-1">
                    <div className={`overflow-hidden rounded-xl border transition-colors ${
                        isFocused
                            ? 'border-[var(--blog-border)] bg-[var(--blog-card-bg)]'
                            : 'border-[var(--blog-border)] bg-[var(--blog-fg)]/[0.02]'
                    }`}>
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value.slice(0, MAX_LENGTH))
                                adjustHeight()
                            }}
                            onFocus={() => setIsFocused(true)}
                            placeholder={placeholder}
                            className="block w-full resize-none bg-transparent px-4 py-3 text-sm text-[var(--blog-fg)] outline-none placeholder:text-[var(--blog-muted)]"
                            rows={1}
                            maxLength={MAX_LENGTH}
                        />
                    </div>

                    {/* 버튼 영역 */}
                    {isFocused && (
                        <div className="mt-3 flex items-center justify-between">
                            <span className={`text-xs ${text.length >= MAX_LENGTH ? 'text-red-500' : 'text-[var(--blog-muted)]'}`}>
                                {text.length}/{MAX_LENGTH}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--blog-fg)]/70 transition-colors hover:bg-[var(--blog-fg)]/5"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={!text.trim() || loading}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                        text.trim() && !loading
                                            ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90'
                                            : 'cursor-not-allowed bg-[var(--blog-fg)]/10 text-[var(--blog-fg)]/30'
                                    }`}
                                >
                                    {loading ? '등록 중...' : isReply ? '답글' : '댓글'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    )
}
