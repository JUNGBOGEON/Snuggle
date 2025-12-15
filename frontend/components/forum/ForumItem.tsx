'use client'

import { useState } from 'react'
import { ForumPost } from '@/lib/api/forum'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import ForumCommentList from './ForumCommentList'
import { getBlogImageUrl } from '@/lib/utils/image'

interface ForumItemProps {
    post: ForumPost
}

export default function ForumItem({ post }: ForumItemProps) {
    const [expanded, setExpanded] = useState(false)

    const profileImage = getBlogImageUrl(post.blog?.thumbnail_url, post.blog?.profile_image_url)
    const authorName = post.blog?.name || '익명'
    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })

    return (
        <div className={`overflow-hidden rounded-2xl bg-white transition-shadow dark:bg-neutral-900 ${
            expanded ? 'shadow-lg ring-1 ring-black/5 dark:ring-white/5' : 'shadow-sm hover:shadow-md'
        }`}>
            {/* Header - Clickable */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
            >
                <div className="flex items-start gap-4">
                    {/* Profile */}
                    <div className="shrink-0">
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt={authorName}
                                className="h-10 w-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-black/10 to-black/5 text-sm font-medium text-black/40 dark:from-white/10 dark:to-white/5 dark:text-white/40">
                                {authorName.charAt(0)}
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-medium text-black dark:text-white">{authorName}</span>
                            <span className="text-xs text-black/30 dark:text-white/30">{timeAgo}</span>
                        </div>

                        <h3 className="text-[15px] font-semibold text-black dark:text-white">
                            {post.title}
                        </h3>

                        {/* Category Badge */}
                        <div className="mt-2 flex items-center gap-3">
                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black/50 dark:bg-white/5 dark:text-white/50">
                                {post.category || '블로그 소개'}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex shrink-0 items-center gap-4 text-xs text-black/40 dark:text-white/40">
                        <div className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{post.view_count}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${post.comment_count > 0 ? 'text-black/60 dark:text-white/60' : ''}`}>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.comment_count}</span>
                        </div>

                        {/* Expand Icon */}
                        <svg
                            className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </button>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-black/5 dark:border-white/5">
                    {/* Post Content */}
                    <div className="px-5 py-6">
                        <div
                            className="prose prose-sm max-w-none text-black/70 dark:prose-invert dark:text-white/70"
                            dangerouslySetInnerHTML={{ __html: post.description }}
                        />
                    </div>

                    {/* Comments */}
                    <ForumCommentList forumId={post.id} />
                </div>
            )}
        </div>
    )
}
