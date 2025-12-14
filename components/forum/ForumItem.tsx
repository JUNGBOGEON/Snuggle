'use client'

import { useState } from 'react'
import { ForumPost } from '@/lib/api/forum'
import ProfileImage from '@/components/common/ProfileImage'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import ForumCommentList from './ForumCommentList'

interface ForumItemProps {
    post: ForumPost
}

export default function ForumItem({ post }: ForumItemProps) {
    const [expanded, setExpanded] = useState(false)

    // Toggle expand
    const toggleExpand = () => setExpanded(!expanded)

    return (
        <div className="border-b border-black/10 last:border-0 dark:border-white/10">
            {/* Header Row (Clickable) */}
            <div
                onClick={toggleExpand}
                className="group flex cursor-pointer items-start gap-4 py-6 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
            >
                {/* Author Profile */}
                <div className="hidden sm:block">
                    <ProfileImage
                        src={post.blog?.thumbnail_url}
                        alt={post.blog?.name || 'User'}
                        fallback={post.blog?.name || 'U'}
                        size="md"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#f76d6d] drop-shadow-sm">
                            {/* Mock Category or Label based on content? Or fetch category later. For now generic 'Forum' or 'New' */}
                            hot
                        </span>
                        <h3 className="truncate text-lg font-medium text-black group-hover:underline dark:text-white">
                            {post.title}
                        </h3>
                        {/* Mobile Profile (Tiny) */}
                        <div className="sm:hidden ml-auto">
                            <ProfileImage
                                size="sm"
                                src={post.blog?.thumbnail_url}
                                alt={post.blog?.name || 'User'}
                                fallback={post.blog?.name || 'U'}
                            />
                        </div>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                        <span className="font-medium text-black/60 dark:text-white/60">{post.blog?.name}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })}</span>
                        <span>·</span>
                        <span>블로그 소개</span>
                    </div>

                    {/* Preview (Details shown when expanded, but maybe show excerpt here?) */}
                    {/* Design indicates title only, but let's show excerpt if not expanded? No, design 1 shows title and author stuff. */}
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end gap-1 text-xs text-black/40 dark:text-white/40">
                    <span>조회수 {post.view_count}</span>
                    <span className={`font-medium ${post.comment_count > 0 ? 'text-[#f76d6d]' : ''}`}>
                        댓글 {post.comment_count}
                    </span>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-4 pb-8 sm:pl-14"> {/* Indent to align with text */}
                    {/* Content */}
                    <div
                        className="prose prose-sm max-w-none text-black/80 dark:prose-invert dark:text-white/80"
                        dangerouslySetInnerHTML={{ __html: post.description }}
                    />

                    {/* Comments Section */}
                    <ForumCommentList forumId={post.id} />
                </div>
            )}
        </div>
    )
}
