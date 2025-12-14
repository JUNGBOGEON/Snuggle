'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { getFeedPosts, PostListItem } from '@/lib/api/posts'
import { getSubscriptionCounts } from '@/lib/api/subscribe'
import FeedHeader from '@/components/feed/FeedHeader'
import FeedItem from '@/components/feed/FeedItem'

export default function FeedPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [posts, setPosts] = useState<PostListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [counts, setCounts] = useState({ following: 0, followers: 0 })

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // 비로그인 시 로그인 모달을 띄우거나 홈으로 리다이렉트 (여기선 홈으로)
                router.push('/')
                return
            }

            setUser(user)

            try {
                // 병렬로 데이터 페칭
                const [feedPosts, subCounts] = await Promise.all([
                    getFeedPosts(user.id, 14),
                    getSubscriptionCounts(user.id)
                ])

                setPosts(feedPosts)
                setCounts(subCounts)
            } catch (error) {
                console.error('Feed loading failed:', error)
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [router])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Header */}
            <header className="relative z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="relative flex items-center">
                        <a href="/" className="text-xl font-bold text-black dark:text-white">
                            Snuggle
                        </a>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-6 py-10">
                <FeedHeader
                    followingCount={counts.following}
                    followersCount={counts.followers}
                />

                <div className="space-y-2">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <FeedItem key={post.id} post={post} />
                        ))
                    ) : (
                        <div className="py-20 text-center text-black/50 dark:text-white/50">
                            <p>구독한 블로그의 새 글이 없습니다.</p>
                            <a href="/" className="mt-4 inline-block text-sm underline">
                                새로운 블로그 찾아보기
                            </a>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
