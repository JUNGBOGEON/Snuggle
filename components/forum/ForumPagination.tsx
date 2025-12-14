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
        <div className="flex justify-center gap-8 py-8">
            <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="p-2 text-black/40 hover:text-black disabled:opacity-20 dark:text-white/40 dark:hover:text-white"
            >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={handleNext}
                disabled={!hasMore}
                className="p-2 text-black/40 hover:text-black disabled:opacity-20 dark:text-white/40 dark:hover:text-white"
            >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    )
}
