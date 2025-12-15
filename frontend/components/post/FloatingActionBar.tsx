'use client'

import { useState, useEffect } from 'react'
import { useModal } from '@/components/common/Modal'
import { toggleLike } from '@/lib/api/posts'
import { useUserStore } from '@/lib/store/useUserStore'

interface FloatingActionBarProps {
    postId: string
    initialLikeCount?: number
    initialIsLiked?: boolean
    commentCount?: number
}

export default function FloatingActionBar({
    postId,
    initialLikeCount = 0,
    initialIsLiked = false,
    commentCount = 0
}: FloatingActionBarProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [likeCount, setLikeCount] = useState(initialLikeCount)
    const [isVisible, setIsVisible] = useState(true)
    const { showAlert } = useModal()
    const { user } = useUserStore()

    // 초기값 동기화
    useEffect(() => {
        setIsLiked(initialIsLiked)
        setLikeCount(initialLikeCount)
    }, [initialIsLiked, initialLikeCount])

    // 스크롤 시 표시/숨김 (하단 도달 시 숨김)
    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = document.documentElement.scrollHeight
            const scrollTop = window.scrollY
            const clientHeight = window.innerHeight

            // 하단 200px 근처에서 숨김
            if (scrollHeight - scrollTop - clientHeight < 200) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleLike = async () => {
        if (!user) {
            await showAlert('로그인이 필요한 기능입니다.')
            return
        }

        // Optimistic UI
        const prevIsLiked = isLiked
        const prevCount = likeCount
        setIsLiked(!prevIsLiked)
        setLikeCount(prev => prevIsLiked ? prev - 1 : prev + 1)

        try {
            const result = await toggleLike(postId)
            setIsLiked(result.is_liked)
            setLikeCount(result.like_count)
        } catch (error) {
            // Revert on error
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

    const scrollToComments = () => {
        const commentSection = document.querySelector('#comment-section')
        if (commentSection) {
            commentSection.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div
            className={`fixed left-[calc(50%-480px)] top-1/3 z-40 hidden flex-col items-center gap-3 rounded-full border border-black/10 bg-white/80 px-3 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 dark:border-white/10 dark:bg-zinc-900/80 lg:flex ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
            }`}
        >
            {/* 좋아요 */}
            <button
                onClick={handleLike}
                className="group flex flex-col items-center gap-1"
                title="좋아요"
            >
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                        isLiked
                            ? 'border-red-500 bg-red-500 text-white'
                            : 'border-black/20 bg-white text-black/60 hover:border-red-500 hover:text-red-500 dark:border-white/20 dark:bg-zinc-800 dark:text-white/60 dark:hover:border-red-500 dark:hover:text-red-500'
                    }`}
                >
                    <svg
                        className={`h-6 w-6 ${isLiked ? 'fill-current' : 'fill-none'}`}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                </div>
                <span className="text-xs font-medium text-black/60 dark:text-white/60">
                    {likeCount}
                </span>
            </button>

            {/* 댓글로 이동 */}
            <button
                onClick={scrollToComments}
                className="group flex flex-col items-center gap-1"
                title="댓글"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black/20 bg-white text-black/60 transition-all hover:border-black/40 hover:text-black dark:border-white/20 dark:bg-zinc-800 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
                <span className="text-xs font-medium text-black/60 dark:text-white/60">
                    {commentCount}
                </span>
            </button>

            {/* 공유 */}
            <button
                onClick={handleShare}
                className="group flex flex-col items-center gap-1"
                title="공유"
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black/20 bg-white text-black/60 transition-all hover:border-black/40 hover:text-black dark:border-white/20 dark:bg-zinc-800 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                    </svg>
                </div>
            </button>
        </div>
    )
}
