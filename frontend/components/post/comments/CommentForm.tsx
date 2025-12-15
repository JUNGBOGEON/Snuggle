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
            <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]">
                <div className={`${isReply ? 'h-7 w-7' : 'h-9 w-9'} shrink-0 rounded-full bg-black/10 dark:bg-white/10`} />
                <span className="text-sm text-black/50 dark:text-white/50">
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
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-black/10 text-xs font-medium text-black/50 dark:bg-white/10 dark:text-white/50">
                            {(displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* 입력 영역 */}
                <div className="min-w-0 flex-1">
                    <div className={`overflow-hidden rounded-xl border transition-colors ${
                        isFocused
                            ? 'border-black/20 bg-white dark:border-white/20 dark:bg-neutral-900'
                            : 'border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]'
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
                            className="block w-full resize-none bg-transparent px-4 py-3 text-sm text-black outline-none placeholder:text-black/40 dark:text-white dark:placeholder:text-white/40"
                            rows={1}
                            maxLength={MAX_LENGTH}
                        />
                    </div>

                    {/* 버튼 영역 */}
                    {isFocused && (
                        <div className="mt-3 flex items-center justify-between">
                            <span className={`text-xs ${text.length >= MAX_LENGTH ? 'text-red-500' : 'text-black/40 dark:text-white/40'}`}>
                                {text.length}/{MAX_LENGTH}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={!text.trim() || loading}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                        text.trim() && !loading
                                            ? 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                                            : 'cursor-not-allowed bg-black/10 text-black/30 dark:bg-white/10 dark:text-white/30'
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
