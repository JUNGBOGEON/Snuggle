'use client'

import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { getForums, ForumPost } from '@/lib/api/forum'
import ForumList from '@/components/forum/ForumList'
import ForumWrite from '@/components/forum/ForumWrite'
import { useUserStore } from '@/lib/store/useUserStore'

function ForumContent() {
    const limit = 12

    const [forums, setForums] = useState<ForumPost[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [category, setCategory] = useState('전체')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [showWriteModal, setShowWriteModal] = useState(false)
    const { user } = useUserStore()

    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // 초기 로드 및 필터 변경 시
    const fetchForums = async (reset = true) => {
        if (reset) {
            setLoading(true)
            setHasMore(true)
        }
        try {
            const data = await getForums(limit, 0, category, searchQuery, 'title_content')
            setForums(data)
            setHasMore(data.length === limit)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // 추가 로드
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return

        setLoadingMore(true)
        try {
            const data = await getForums(limit, forums.length, category, searchQuery, 'title_content')
            if (data.length > 0) {
                setForums(prev => [...prev, ...data])
                setHasMore(data.length === limit)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingMore(false)
        }
    }, [forums.length, category, searchQuery, loadingMore, hasMore])

    // 초기 로드 및 필터 변경
    useEffect(() => {
        fetchForums(true)
    }, [category, searchQuery])

    // Intersection Observer 설정
    useEffect(() => {
        if (loading) return

        if (observerRef.current) {
            observerRef.current.disconnect()
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [loading, hasMore, loadingMore, loadMore])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearchQuery(searchInput)
    }

    const categories = ['전체', '블로그 소개', '블로그 운영팁', '스킨', '질문/기타']

    const handlePostSuccess = () => {
        setShowWriteModal(false)
        fetchForums(true)
        window.scrollTo(0, 0)
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Banner - Full Width */}
            <div className="relative w-full overflow-hidden">
                <Image
                    src="/img/forum_banner2.png"
                    alt="Forum Banner"
                    width={1920}
                    height={400}
                    className="h-[200px] w-full object-cover sm:h-[280px]"
                    priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {/* Title & Description */}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                    <div className="mx-auto max-w-4xl">
                        <h2 className="text-2xl font-bold text-white sm:text-3xl">Forum</h2>
                        <p className="mt-2 text-sm text-white/80 sm:text-base">
                            블로그 운영 팁부터 스킨 공유까지, 함께 이야기해요
                        </p>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-4xl px-6 py-8">
                {/* Search */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="검색..."
                            className="h-12 w-full rounded-2xl border-0 bg-black/5 pl-12 pr-4 text-sm text-black outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-white/10"
                        />
                    </div>
                </form>

                {/* Categories */}
                <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                category === cat
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
                    </div>
                ) : (
                    <>
                        <ForumList forums={forums} />

                        {/* Load More Trigger */}
                        <div ref={loadMoreRef} className="py-8">
                            {loadingMore && (
                                <div className="flex items-center justify-center">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
                                </div>
                            )}
                            {!hasMore && forums.length > 0 && (
                                <p className="text-center text-sm text-black/30 dark:text-white/30">
                                    모든 글을 불러왔습니다
                                </p>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Floating Write Button */}
            {user && (
                <button
                    onClick={() => setShowWriteModal(true)}
                    className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/20 transition-all hover:scale-105 hover:shadow-xl dark:bg-white dark:text-black dark:shadow-white/10"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    새 글 작성하기
                </button>
            )}

            {/* Write Modal */}
            {showWriteModal && (
                <ForumWrite
                    onPostSuccess={handlePostSuccess}
                    onClose={() => setShowWriteModal(false)}
                />
            )}
        </div>
    )
}

export default function ForumPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
            </div>
        }>
            <ForumContent />
        </Suspense>
    )
}
