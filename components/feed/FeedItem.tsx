'use client'

import React from 'react'
import ProfileImage from '@/components/common/ProfileImage'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

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
        } | null
        // 추가적으로 필요한 정보들 (댓글 수, 좋아요 수 등은 API가 제공한다면)
    }
}

export default function FeedItem({ post }: FeedItemProps) {
    // HTML 태그 제거 및 길이 제한 (본문 미리보기용)
    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV')
        tmp.innerHTML = html
        return tmp.textContent || tmp.innerText || ''
    }

    const summary = React.useMemo(() => {
        if (typeof window === 'undefined') return '' // SSR 방지
        const text = stripHtml(post.content)
        return text.length > 120 ? text.slice(0, 120) + '...' : text
    }, [post.content])

    return (
        <div className="group flex gap-6 border-b border-black/10 py-8 last:border-0 dark:border-white/10">
            {/* 왼쪽: 프로필 및 블로그 정보 */}
            <div className="w-24 flex-shrink-0">
                <a href={`/blog/${post.blog_id}`} className="flex flex-col items-center text-center">
                    <ProfileImage
                        src={post.blog?.thumbnail_url}
                        alt={post.blog?.name || '블로그'}
                        fallback={post.blog?.name || '블로그'}
                        size="md"
                        className="mb-2"
                    />
                    <span className="line-clamp-1 w-full text-sm font-medium text-black dark:text-white">
                        {post.blog?.name}
                    </span>
                    <span className="line-clamp-1 w-full text-xs text-black/50 dark:text-white/50">
                        by {post.blog?.name}
                    </span>
                </a>
            </div>

            {/* 가운데: 게시글 내용 */}
            <div className="flex-1 min-w-0">
                <a href={`/post/${post.id}`} className="block group-hover:opacity-80 transition-opacity">
                    <h2 className="mb-2 text-xl font-bold text-black dark:text-white">
                        {post.title}
                    </h2>
                    <p className="mb-4 text-sm text-black/60 line-clamp-2 dark:text-white/60">
                        {summary}
                    </p>
                </a>

                <div className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                    <span>
                        {formatDistanceToNow(new Date(post.created_at), {
                            addSuffix: true,
                            locale: ko,
                        })}
                    </span>
                    <span>·</span>
                    <span>공감 0</span> {/* API에서 제공하지 않아 하드코딩 */}
                </div>
            </div>

            {/* 오른쪽: 썸네일 (있을 경우) */}
            {post.thumbnail_url && (
                <a href={`/post/${post.id}`} className="block flex-shrink-0">
                    <div className="h-24 w-32 overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
                        <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                </a>
            )}
        </div>
    )
}
