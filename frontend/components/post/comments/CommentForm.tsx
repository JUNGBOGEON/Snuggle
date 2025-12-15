'use client'

import { useState } from 'react'
import { useUserStore } from '@/lib/store/useUserStore'
import { useBlogStore } from '@/lib/store/useBlogStore'
import { useModal } from '@/components/common/Modal'

const MAX_LENGTH = 500

interface CommentFormProps {
    onSubmit: (text: string) => Promise<void>
    placeholder?: string
    buttonLabel?: string
    loading?: boolean
    autoFocus?: boolean
    onCancel?: () => void
}

export default function CommentForm({
    onSubmit,
    placeholder = '내용을 입력하세요.',
    buttonLabel = '등록',
    loading = false,
    autoFocus = false,
    onCancel
}: CommentFormProps) {
    const { user } = useUserStore()
    const { selectedBlog, isLoading: isBlogLoading, hasFetched } = useBlogStore()
    const { showAlert } = useModal()
    const [text, setText] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!text.trim() || loading) return

        if (!user) {
            await showAlert('로그인이 필요합니다.')
            return
        }

        await onSubmit(text)
        setText('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Shift + Enter for new line, Enter to submit
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    // 선택된 블로그 정보 사용, 프로필 이미지는 블로그 썸네일 -> 카카오 프로필 순서로 폴백
    const displayName = selectedBlog?.name || ''
    const kakaoProfileImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
    const profileImage = selectedBlog?.thumbnail_url || kakaoProfileImage

    // 블로그가 로딩 중이거나 아직 fetch하지 않았으면 로딩 상태로 표시
    const showSkeleton = isBlogLoading || (user && !hasFetched)

    return (
        <form onSubmit={handleSubmit} className="relative">
            {!user ? (
                <div className="flex h-24 w-full items-center justify-center rounded-lg border border-[var(--blog-border)] bg-[var(--blog-card-bg)] text-[var(--blog-muted)]">
                    로그인 후 댓글을 작성할 수 있습니다.
                </div>
            ) : (
                <div className="rounded-lg border border-[var(--blog-border)] bg-[var(--blog-card-bg)] p-4 focus-within:ring-1 focus-within:ring-[var(--blog-fg)]">
                    <div className="mb-2 flex items-center gap-2">
                        {showSkeleton ? (
                            <>
                                <div className="h-6 w-6 rounded-full bg-[var(--blog-fg)]/10 animate-pulse" />
                                <div className="h-4 w-16 rounded bg-[var(--blog-fg)]/10 animate-pulse" />
                            </>
                        ) : (
                            <>
                                {profileImage ? (
                                    <img src={profileImage} alt={displayName} className="h-6 w-6 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--blog-fg)]/10 text-xs font-bold text-[var(--blog-muted)]">
                                        {(displayName || 'U').charAt(0)}
                                    </div>
                                )}
                                <span className="text-sm font-bold text-[var(--blog-fg)]">{displayName}</span>
                            </>
                        )}
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full resize-none bg-transparent text-sm text-[var(--blog-fg)] placeholder-[var(--blog-muted)] outline-none"
                        rows={3}
                        autoFocus={autoFocus}
                        maxLength={MAX_LENGTH}
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <span className={`text-xs ${text.length >= MAX_LENGTH ? 'text-red-500' : 'text-[var(--blog-muted)]'}`}>
                            {text.length}/{MAX_LENGTH}
                        </span>
                        <div className="flex items-center gap-2">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="rounded px-3 py-1.5 text-xs text-[var(--blog-muted)] hover:text-[var(--blog-fg)]"
                            >
                                취소
                            </button>
                        )}
                            <button
                                type="submit"
                                disabled={!text.trim() || loading}
                                className={`rounded px-4 py-1.5 text-xs font-bold transition-colors ${text.trim() && !loading
                                    ? 'bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90'
                                    : 'cursor-not-allowed bg-[var(--blog-border)] text-[var(--blog-muted)]'
                                    }`}
                            >
                                {loading ? '등록 중...' : buttonLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
