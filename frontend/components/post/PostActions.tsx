'use client'

import { useState, useEffect } from 'react'
import { useModal } from '@/components/common/Modal'
import { toggleLike } from '@/lib/api/posts'
import { useUserStore } from '@/lib/store/useUserStore'

interface PostActionsProps {
    postId: string
    initialLikeCount?: number
    initialIsLiked?: boolean
}

export default function PostActions({
    postId,
    initialLikeCount = 0,
    initialIsLiked = false,
}: PostActionsProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [likeCount, setLikeCount] = useState(initialLikeCount)
    const { showAlert } = useModal()
    const { user } = useUserStore()

    useEffect(() => {
        setIsLiked(initialIsLiked)
        setLikeCount(initialLikeCount)
    }, [initialIsLiked, initialLikeCount])

    const handleLike = async () => {
        if (!user) {
            await showAlert('로그인이 필요합니다.')
            return
        }

        const prevIsLiked = isLiked
        const prevCount = likeCount
        setIsLiked(!prevIsLiked)
        setLikeCount(prev => prevIsLiked ? prev - 1 : prev + 1)

        try {
            const result = await toggleLike(postId)
            setIsLiked(result.is_liked)
            setLikeCount(result.like_count)
        } catch (error) {
            setIsLiked(prevIsLiked)
            setLikeCount(prevCount)
            await showAlert('오류가 발생했습니다.')
        }
    }

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            await showAlert('링크가 복사되었습니다.')
        } catch {
            await showAlert('복사에 실패했습니다.')
        }
    }

    return (
        <div className="flex items-center justify-center gap-3">
            {/* 좋아요 버튼 */}
            <button
                onClick={handleLike}
                className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    isLiked
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-[var(--blog-fg)]/5 text-[var(--blog-fg)]/60 hover:bg-[var(--blog-fg)]/10 hover:text-[var(--blog-fg)]'
                }`}
            >
                <svg
                    className={`h-[18px] w-[18px] transition-transform group-active:scale-125 ${isLiked ? 'fill-current' : 'fill-none'}`}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                </svg>
                <span>공감</span>
                {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
            </button>

            {/* 공유 버튼 */}
            <button
                onClick={handleShare}
                className="flex items-center gap-2 rounded-full bg-[var(--blog-fg)]/5 px-5 py-2.5 text-sm font-medium text-[var(--blog-fg)]/60 transition-all hover:bg-[var(--blog-fg)]/10 hover:text-[var(--blog-fg)]"
            >
                <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                </svg>
                <span>공유</span>
            </button>
        </div>
    )
}
