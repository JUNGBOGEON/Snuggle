'use client'

import { useEffect, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { getPopularPosts, PostListItem } from '@/lib/api/posts'
import Link from 'next/link'
import { getBlogImageUrl } from '@/lib/utils/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PopularPostSlider() {
    const [posts, setPosts] = useState<PostListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })])

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await getPopularPosts()
                setPosts(data)
            } catch (err) {
                console.error('Failed to fetch popular posts:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchPosts()
    }, [])

    if (loading) return null // Or a skeleton if preferred
    if (posts.length === 0) return null

    return (
        <div className="mb-8 group relative">
            <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                오늘의 인기글
            </h2>
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900" ref={emblaRef}>
                <div className="flex">
                    {posts.map((post) => (
                        <div key={post.id} className="flex-[0_0_100%] min-w-0">
                            <Link href={`/post/${post.id}`} className="block group/item relative h-64 w-full overflow-hidden">
                                {/* Background Image with Overlay */}
                                {post.thumbnail_url ? (
                                    <div className="absolute inset-0">
                                        <img
                                            src={post.thumbnail_url}
                                            alt=""
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600" />
                                )}

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        {post.blog?.profile_image_url ? (
                                            <img src={post.blog.profile_image_url} alt="" className="w-6 h-6 rounded-full object-cover border border-white/20" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-white/20" />
                                        )}
                                        <span className="text-sm font-medium opacity-90">{post.blog?.name}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold leading-tight mb-2 line-clamp-2 group-hover/item:underline decoration-2 underline-offset-4">
                                        {post.title}
                                    </h3>
                                    <div className="text-sm opacity-80 line-clamp-1">
                                        {(post.content || '').replace(/<[^>]*>/g, '')}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/50 group-hover:opacity-100"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 backdrop-blur-sm transition-all hover:bg-black/50 group-hover:opacity-100"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6" />
            </button>
        </div>
    )
}
