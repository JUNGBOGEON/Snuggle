'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchPosts, searchBlogs, SearchPostResult, SearchBlogResult } from '@/lib/api/search'
import PostCard from '@/components/blog/PostCard'
import SearchHeader from '@/components/search/SearchHeader'
import SearchTabs, { TabType } from '@/components/search/SearchTabs'
import SearchBlogCard from '@/components/search/SearchBlogCard'
import { SearchSkeleton, SearchEmpty, PageLoading } from '@/components/search/SearchStatus'

function SearchContent() {
    const searchParams = useSearchParams()
    const query = searchParams.get('q') || ''

    const [activeTab, setActiveTab] = useState<TabType>('posts')
    const [posts, setPosts] = useState<SearchPostResult[]>([])
    const [blogs, setBlogs] = useState<SearchBlogResult[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!query) return

        const fetchResults = async () => {
            setLoading(true)
            try {
                if (activeTab === 'posts') {
                    const results = await searchPosts(query)
                    setPosts(results)
                } else {
                    const results = await searchBlogs(query)
                    setBlogs(results)
                }
            } catch (error) {
                console.error('Search error:', error)
            }
            setLoading(false)
        }

        fetchResults()
    }, [query, activeTab])

    const renderResults = () => {
        if (!query) {
            return <SearchEmpty message="검색어를 입력해주세요" />
        }

        if (loading) {
            return <SearchSkeleton />
        }

        if (activeTab === 'posts') {
            if (posts.length === 0) {
                return <SearchEmpty message="검색 결과가 없습니다" />
            }
            return (
                <div>
                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={{
                                ...post,
                                blog: post.blog ? {
                                    name: post.blog.name,
                                    thumbnail_url: post.blog.thumbnail_url,
                                } : null,
                            }}
                        />
                    ))}
                </div>
            )
        }

        if (blogs.length === 0) {
            return <SearchEmpty message="검색 결과가 없습니다" />
        }

        return (
            <div className="space-y-4">
                {blogs.map((blog) => (
                    <SearchBlogCard key={blog.id} blog={blog} />
                ))}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <SearchHeader initialQuery={query} />

            <main className="mx-auto max-w-4xl px-6 py-8">
                {query && (
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-black dark:text-white">
                            &apos;{query}&apos; 검색 결과
                        </h1>
                    </div>
                )}

                <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {renderResults()}
            </main>
        </div>
    )
}

export default function SearchPage() {
    return (
        <Suspense fallback={<PageLoading />}>
            <SearchContent />
        </Suspense>
    )
}
