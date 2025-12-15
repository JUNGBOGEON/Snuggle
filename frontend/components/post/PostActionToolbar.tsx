'use client'

import { useState, useRef, useEffect } from 'react'
import { useModal } from '@/components/common/Modal'
import { toggleLike } from '@/lib/api/posts'
import { useUserStore } from '@/lib/store/useUserStore'

interface PostActionToolbarProps {
    postId?: string
    initialIsLiked?: boolean
}

export default function PostActionToolbar({ postId, initialIsLiked = false }: PostActionToolbarProps) {
    const [activeMenu, setActiveMenu] = useState<'share' | 'more' | null>(null)
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const containerRef = useRef<HTMLDivElement>(null)
    const { showAlert } = useModal()
    const { user } = useUserStore()

    // 초기값 변경 시 상태 업데이트 (페이지 이동 등)
    useEffect(() => {
        setIsLiked(initialIsLiked)
    }, [initialIsLiked])

    // 외부 클릭 감지 및 ESC 키 처리
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActiveMenu(null)
            }
        }

        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActiveMenu(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEsc)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEsc)
        }
    }, [])

    const toggleMenu = (menu: 'share' | 'more') => {
        setActiveMenu(prev => prev === menu ? null : menu)
    }

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            await showAlert('주소가 복사되었습니다.')
            setActiveMenu(null)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleLike = async () => {
        if (!postId) return
        if (!user) {
            await showAlert('로그인이 필요한 기능입니다.')
            return
        }

        // Optimistic UI Update
        const prevIsLiked = isLiked
        setIsLiked(!prevIsLiked)

        try {
            const result = await toggleLike(postId)
            setIsLiked(result.is_liked)
        } catch (error) {
            console.error('Like error:', error)
            // Revert on error
            setIsLiked(prevIsLiked)
            await showAlert('오류가 발생했습니다.')
        }
    }

    return (
        <div className="relative flex justify-start" ref={containerRef}>
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-1.5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                {/* 좋아요 (더미) */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-red-500 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400' : 'text-black/60 hover:text-red-500 dark:text-white/60 dark:hover:text-red-400'}`}
                    title="공감"
                >
                    <svg className={`h-5 w-5 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-sm font-medium">공감</span>
                </button>

                <div className="h-4 w-px bg-transparent" />

                {/* 공유하기 */}
                <div className="relative">
                    <button
                        onClick={() => toggleMenu('share')}
                        className={`flex items-center text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white ${activeMenu === 'share' ? 'text-black dark:text-white' : ''}`}
                        title="공유하기"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>

                    {/* 공유 메뉴 */}
                    {activeMenu === 'share' && (
                        <div className="absolute bottom-full left-1/2 mb-3 w-48 -translate-x-1/2 rounded-lg border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                            <button
                                onClick={handleCopyUrl}
                                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                URL 복사
                            </button>
                            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5">
                                <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-yellow-400">
                                    <span className="text-[10px] font-bold text-black">K</span>
                                </div>
                                카카오톡 공유
                            </button>
                            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5">
                                <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-blue-600">
                                    <span className="text-[10px] font-bold text-white">f</span>
                                </div>
                                페이스북 공유
                            </button>
                            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5">
                                <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-black text-white dark:bg-white dark:text-black">
                                    <span className="text-[10px] font-bold">X</span>
                                </div>
                                엑스 공유
                            </button>

                            {/* 화살표 */}
                            <div className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900" />
                        </div>
                    )}
                </div>

                {/* 더보기 */}
                <div className="relative">
                    <button
                        onClick={() => toggleMenu('more')}
                        className={`flex items-center text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white ${activeMenu === 'more' ? 'text-black dark:text-white' : ''}`}
                        title="더보기"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                    </button>

                    {/* 더보기 메뉴 */}
                    {activeMenu === 'more' && (
                        <div className="absolute bottom-full left-1/2 mb-3 w-32 -translate-x-1/2 rounded-lg border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-zinc-900">
                            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                신고하기
                            </button>

                            {/* 화살표 */}
                            <div className="absolute bottom-[-5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
