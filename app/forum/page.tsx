'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getForums, ForumPost } from '@/lib/api/forum'
import ForumList from '@/components/forum/ForumList'
import ForumWrite from '@/components/forum/ForumWrite'
import ForumPagination from '@/components/forum/ForumPagination'
import { useUserStore } from '@/lib/store/useUserStore'

export default function ForumPage() {
    const searchParams = useSearchParams()
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 12
    const offset = (page - 1) * limit

    // State for filters and data
    const [forums, setForums] = useState<ForumPost[]>([])
    const [loading, setLoading] = useState(true)
    const [category, setCategory] = useState('전체')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [searchType, setSearchType] = useState('title_content')
    const { user } = useUserStore()

    const fetchForums = async () => {
        setLoading(true)
        try {
            const data = await getForums(limit, offset, category, searchQuery, searchType)
            setForums(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Re-fetch when dependencies change
    useEffect(() => {
        fetchForums()
    }, [page, category, searchQuery, searchType])

    const handleSearch = () => {
        setSearchQuery(searchInput)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const categories = ['전체', '블로그 소개', '블로그 운영팁', '스킨', '질문/기타']

    return (
        <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
            {/* Header Banner */}
            <div
                className="relative h-[240px] w-full overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: "url('/img/forum_title.png')" }}
            >
                {/* Overlay for better text readability if needed, but user didn't ask. Assuming image is dark enough or text is readable. 
                   User said "Search button back black panel change to image". 
                   The previous code had bg-[#2c2c2c].
                   I will add a slight overlay just in case, or stick to raw image. 
                   User: "이미지의비율을 조절하지 말고 그냥 자르세요" -> bg-cover.
                */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/30">
                    <h1 className="text-3xl font-bold text-white mb-2">Forum</h1>
                    <p className="text-white/90">
                        스너글에 대한 이야기를 자유롭게 나눠보세요
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 w-full max-w-xl px-4">
                        <div className="flex bg-white rounded overflow-hidden shadow-lg">
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="px-4 py-3 bg-transparent text-sm border-r border-gray-200 outline-none text-black cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value="title_content">제목+내용</option>
                                <option value="title">제목</option>
                                <option value="content">내용</option>
                            </select>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 px-4 py-3 text-sm outline-none text-black placeholder-gray-400"
                                placeholder="검색어를 입력하세요."
                            />
                            <button
                                onClick={handleSearch}
                                className="px-4 text-black/60 hover:text-black transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-5xl px-4 py-8">
                {/* Tabs / Filter */}
                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4 dark:border-white">
                    <div className="flex flex-wrap gap-4 sm:gap-6 text-sm font-medium">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`${category === cat
                                    ? 'border-b-2 border-black -mb-4.5 pb-4 font-bold text-black dark:border-white dark:text-white'
                                    : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    {user && (
                        <a
                            href="#write-form"
                            className="rounded-full bg-black px-6 py-2 text-sm text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                        >
                            글쓰기
                        </a>
                    )}
                </div>

                {/* List */}
                {loading ? (
                    <div className="py-20 text-center">Loading...</div>
                ) : (
                    <ForumList forums={forums} />
                )}

                {/* Pagination */}
                <ForumPagination currentPage={page} hasMore={forums.length === limit} />

                {/* Write Form (Bottom) */}
                <div className="mt-12">
                    <ForumWrite onPostSuccess={fetchForums} />
                </div>
            </main>
        </div>
    )
}
