'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { getFeedPosts, PostListItem } from '@/lib/api/posts'
import { getSubscriptionCounts, getSubscribedBlogs, SubscribedBlog } from '@/lib/api/subscribe'
import FeedHeader from '@/components/feed/FeedHeader'
import FeedItem from '@/components/feed/FeedItem'
import SubscribedBlogs from '@/components/feed/SubscribedBlogs'

const POSTS_PER_PAGE = 10

export default function FeedPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [posts, setPosts] = useState<PostListItem[]>([])
    const [blogs, setBlogs] = useState<SubscribedBlog[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [counts, setCounts] = useState({ following: 0, followers: 0 })
    const loadMoreRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            setUser(user)

            try {
                const [feedPosts, subCounts, subscribedBlogs] = await Promise.all([
                    getFeedPosts(POSTS_PER_PAGE, 0),
                    getSubscriptionCounts(user.id),
                    getSubscribedBlogs(user.id, 10)
                ])

                setPosts(feedPosts)
                setCounts(subCounts)
                setBlogs(subscribedBlogs)
                setHasMore(feedPosts.length === POSTS_PER_PAGE)
            } catch (error) {
                console.error('Feed loading failed:', error)
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [router])

    // 추가 데이터 로드
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return

        setLoadingMore(true)
        try {
            const newPosts = await getFeedPosts(POSTS_PER_PAGE, posts.length)
            setPosts(prev => [...prev, ...newPosts])
            setHasMore(newPosts.length === POSTS_PER_PAGE)
        } catch (error) {
            console.error('Load more failed:', error)
        } finally {
            setLoadingMore(false)
        }
    }, [loadingMore, hasMore, posts.length])

    // Intersection Observer로 스크롤 감지
    useEffect(() => {
        if (loading || !hasMore) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore()
                }
            },
            { threshold: 0.1 }
        )

        const currentRef = loadMoreRef.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef)
            }
        }
    }, [loading, hasMore, loadMore])

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black">
                <main className="mx-auto max-w-7xl px-6 py-8">
                    <div className="flex gap-8">
                        <div className="min-w-0 flex-1">
                            <div className="mb-8">
                                <div className="h-8 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                <div className="mt-2 h-4 w-48 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                            </div>
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse border-b border-black/10 py-6 dark:border-white/10">
                                        <div className="flex gap-4">
                                            <div className="h-24 w-24 rounded-lg bg-black/10 dark:bg-white/10" />
                                            <div className="flex-1 space-y-3">
                                                <div className="h-5 w-3/4 rounded bg-black/10 dark:bg-white/10" />
                                                <div className="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
                                                <div className="h-4 w-1/2 rounded bg-black/10 dark:bg-white/10" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="hidden w-80 flex-shrink-0 lg:block">
                            <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                                <div className="h-4 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                <div className="mt-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="h-10 w-10 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
                                            <div className="h-4 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!user) return null

    // 구독도 없고 글도 없는 경우 - 통합 빈 상태
    const hasNoContent = posts.length === 0 && blogs.length === 0

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <main className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex gap-8">
                    {/* 왼쪽: 피드 글 목록 */}
                    <div className="min-w-0 flex-1">
                        <FeedHeader
                            followingCount={counts.following}
                            followersCount={counts.followers}
                        />

                        <div>
                            {posts.length > 0 ? (
                                <>
                                    {posts.map((post) => (
                                        <FeedItem key={post.id} post={post} />
                                    ))}

                                    {/* 무한스크롤 감지 영역 */}
                                    <div ref={loadMoreRef} className="h-10" />

                                    {/* 로딩 인디케이터 */}
                                    {loadingMore && (
                                        <div className="flex justify-center py-8">
                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
                                        </div>
                                    )}

                                    {/* 더 이상 없음 표시 */}
                                    {!hasMore && posts.length > 0 && (
                                        <div className="py-8 text-center text-sm text-black/40 dark:text-white/40">
                                            모든 글을 확인했습니다
                                        </div>
                                    )}
                                </>
                            ) : hasNoContent ? (
                                // 구독도 없고 글도 없는 경우
                                <div className="py-16 text-center">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                        <svg className="h-10 w-10 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-black dark:text-white">
                                        아직 구독한 블로그가 없습니다
                                    </h3>
                                    <p className="mt-2 text-sm text-black/50 dark:text-white/50">
                                        관심있는 블로그를 구독하면 새 글을 피드에서 확인할 수 있어요
                                    </p>
                                    <a
                                        href="/"
                                        className="mt-6 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                                    >
                                        블로그 둘러보기
                                    </a>
                                </div>
                            ) : (
                                // 구독은 있는데 새 글이 없는 경우
                                <div className="py-16 text-center">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                        <svg className="h-10 w-10 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-black dark:text-white">
                                        새로운 글이 없습니다
                                    </h3>
                                    <p className="mt-2 text-sm text-black/50 dark:text-white/50">
                                        구독한 블로그에서 새 글이 올라오면 여기에 표시됩니다
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 사이드바 - 구독이 있을 때만 표시 */}
                    {blogs.length > 0 && (
                        <div className="hidden w-80 flex-shrink-0 lg:block">
                            <div className="sticky top-8">
                                <SubscribedBlogs blogs={blogs} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
