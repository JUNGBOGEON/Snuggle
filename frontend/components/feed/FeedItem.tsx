'use client'

import Link from 'next/link'
import { getBlogImageUrl } from '@/lib/utils/image'

interface FeedItemProps {
    post: {
        id: string
        title: string
        content: string
        thumbnail_url: string | null
        created_at: string
        blog_id: string
        blog: {
            name: string
            thumbnail_url: string | null
            profile_image_url?: string | null
        } | null
    }
}

function getFirstParagraph(html: string): string {
    const withoutCode = html.replace(/<pre[\s\S]*?<\/pre>/gi, '')
    const withoutImages = withoutCode.replace(/<img[^>]*>/gi, '')
    const pMatch = withoutImages.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    if (pMatch) {
        const text = pMatch[1].replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim()
        const firstLine = text.split(/[\r\n]/)[0]?.trim()
        if (firstLine) return firstLine
    }
    const plainText = withoutImages.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim()
    const firstLine = plainText.split(/[\r\n]/)[0]?.trim()
    return firstLine || ''
}

export default function FeedItem({ post }: FeedItemProps) {
    const blogName = post.blog?.name || '알 수 없음'
    const blogImage = getBlogImageUrl(post.blog?.thumbnail_url, post.blog?.profile_image_url)
    const preview = post.content ? getFirstParagraph(post.content).slice(0, 150) : ''
    const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    return (
        <Link href={`/post/${post.id}`} className="block">
            <article className="border-b border-black/10 py-6 transition-colors hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.02]">
                <div className="flex gap-4">
                    {/* 썸네일 */}
                    {post.thumbnail_url && (
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
                            <img
                                src={post.thumbnail_url}
                                alt={post.title}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}

                    {/* 콘텐츠 */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-black dark:text-white line-clamp-1">
                            {post.title}
                        </h3>
                        {preview && (
                            <p className="mt-1 text-sm text-black/60 dark:text-white/60 line-clamp-1">
                                {preview}
                            </p>
                        )}

                        {/* 블로그 정보 */}
                        <div className="mt-3 flex items-center gap-2">
                            {blogImage && (
                                <img
                                    src={blogImage}
                                    alt={blogName}
                                    className="h-5 w-5 rounded-full object-cover"
                                />
                            )}
                            <span className="text-xs text-black/50 dark:text-white/50">
                                {blogName} · {date}
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    )
}
