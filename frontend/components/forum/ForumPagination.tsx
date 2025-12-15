'use client'

import { useRouter } from 'next/navigation'

interface ForumPaginationProps {
    currentPage: number
    hasMore: boolean
}

export default function ForumPagination({ currentPage, hasMore }: ForumPaginationProps) {
    const router = useRouter()

    const handlePrev = () => {
        if (currentPage > 1) {
            router.push(`/forum?page=${currentPage - 1}`)
        }
    }

    const handleNext = () => {
        if (hasMore) {
            router.push(`/forum?page=${currentPage + 1}`)
        }
    }

    if (currentPage === 1 && !hasMore) return null

    return (
        <div className="mt-8 flex items-center justify-center gap-4">
            {/* Previous Button */}
            <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                    currentPage === 1
                        ? 'cursor-not-allowed text-black/20 dark:text-white/20'
                        : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Page Indicator */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-black dark:text-white">
                    {currentPage}
                </span>
                <span className="text-sm text-black/30 dark:text-white/30">페이지</span>
            </div>

            {/* Next Button */}
            <button
                onClick={handleNext}
                disabled={!hasMore}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                    !hasMore
                        ? 'cursor-not-allowed text-black/20 dark:text-white/20'
                        : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    )
}
