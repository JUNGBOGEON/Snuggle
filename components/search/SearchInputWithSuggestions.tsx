'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSearchSuggestions, SearchSuggestion } from '@/lib/api/search'

interface SearchInputWithSuggestionsProps {
    placeholder?: string
    className?: string
}

export default function SearchInputWithSuggestions({
    placeholder = '검색',
    className = '',
}: SearchInputWithSuggestionsProps) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<SearchSuggestion | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // 디바운스된 검색 추천
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        if (query.trim().length < 2) {
            setSuggestions(null)
            setIsOpen(false)
            return
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const result = await getSearchSuggestions(query)
                setSuggestions(result)
                const hasResults =
                    result.posts.length > 0 ||
                    result.blogs.length > 0 ||
                    result.categories.length > 0
                setIsOpen(hasResults)
            } catch (error) {
                console.error('Search suggestion error:', error)
            }
            setLoading(false)
        }, 300) // 300ms 디바운스

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [query])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            setIsOpen(false)
            router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        }
    }

    const handleSuggestionClick = () => {
        setIsOpen(false)
        setQuery('')
    }

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (suggestions && (suggestions.posts.length > 0 || suggestions.blogs.length > 0 || suggestions.categories.length > 0)) {
                            setIsOpen(true)
                        }
                    }}
                    placeholder={placeholder}
                    className="h-9 w-48 rounded-full border border-black/10 bg-transparent px-4 text-sm text-black placeholder-black/40 outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:placeholder-white/40 dark:focus:border-white/30"
                />
            </form>

            {/* 추천 드롭다운 */}
            {isOpen && suggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-black z-50 max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-center text-sm text-black/50 dark:text-white/50">
                            검색 중...
                        </div>
                    ) : (
                        <>
                            {/* 게시글 */}
                            {suggestions.posts.length > 0 && (
                                <div className="border-b border-black/5 dark:border-white/5">
                                    <div className="px-3 py-2 text-xs font-medium text-black/40 dark:text-white/40">
                                        📝 게시글
                                    </div>
                                    {suggestions.posts.map((post) => (
                                        <Link
                                            key={post.id}
                                            href={`/post/${post.id}`}
                                            onClick={handleSuggestionClick}
                                            className="block px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                        >
                                            {post.title}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* 블로그 */}
                            {suggestions.blogs.length > 0 && (
                                <div className="border-b border-black/5 dark:border-white/5">
                                    <div className="px-3 py-2 text-xs font-medium text-black/40 dark:text-white/40">
                                        🏠 블로그
                                    </div>
                                    {suggestions.blogs.map((blog) => (
                                        <Link
                                            key={blog.id}
                                            href={`/blog/${blog.id}`}
                                            onClick={handleSuggestionClick}
                                            className="flex items-center gap-2 px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                        >
                                            {blog.thumbnail_url ? (
                                                <img
                                                    src={blog.thumbnail_url}
                                                    alt=""
                                                    className="h-5 w-5 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs dark:bg-white/10">
                                                    {blog.name.charAt(0)}
                                                </div>
                                            )}
                                            {blog.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* 카테고리 */}
                            {suggestions.categories.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-medium text-black/40 dark:text-white/40">
                                        🏷️ 카테고리
                                    </div>
                                    {suggestions.categories.map((category) => (
                                        <Link
                                            key={category.id}
                                            href={`/search?q=${encodeURIComponent(category.name)}`}
                                            onClick={handleSuggestionClick}
                                            className="block px-3 py-2 text-sm text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
