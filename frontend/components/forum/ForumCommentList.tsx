'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ForumComment, createForumComment, getForumComments } from '@/lib/api/forum'
import { getMyBlogs } from '@/lib/api/blogs'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useUserStore } from '@/lib/store/useUserStore'
import { getBlogImageUrl } from '@/lib/utils/image'
import { useModal } from '@/components/common/Modal'

interface ForumCommentListProps {
    forumId: string
}

export default function ForumCommentList({ forumId }: ForumCommentListProps) {
    const { user } = useUserStore()
    const { showAlert } = useModal()
    const [comments, setComments] = useState<ForumComment[]>([])
    const [content, setContent] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [myBlogId, setMyBlogId] = useState<string | null>(null)
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getForumComments(forumId)
                setComments(data)

                if (user) {
                    const blogs = await getMyBlogs()
                    if (blogs.length > 0) setMyBlogId(blogs[0].id)
                }
            } catch (error) {
                console.error(error)
            }
        }
        loadData()
    }, [forumId, user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !myBlogId || !content.trim() || submitting) return

        setSubmitting(true)
        try {
            const newComment = await createForumComment({
                forum_id: forumId,
                blog_id: myBlogId,
                content: content.trim(),
            })
            setComments(prev => [...prev, newComment])
            setContent('')
            setIsFocused(false)
        } catch (error) {
            console.error('Failed to post comment', error)
            showAlert('댓글 작성에 실패했습니다.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="border-t border-black/5 dark:border-white/5">
            {/* Comments Header */}
            <div className="flex items-center gap-2 px-5 py-4">
                <svg className="h-4 w-4 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium text-black/60 dark:text-white/60">
                    댓글 {comments.length}개
                </span>
            </div>

            {/* Comment List */}
            {comments.length > 0 && (
                <div className="space-y-0 divide-y divide-black/5 dark:divide-white/5">
                    {comments.map((comment) => {
                        const profileImage = getBlogImageUrl(comment.blog?.thumbnail_url, comment.blog?.profile_image_url)
                        const authorName = comment.blog?.name || '익명'

                        return (
                            <div key={comment.id} className="flex gap-3 px-5 py-4">
                                {/* Profile */}
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={authorName}
                                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-black/10 to-black/5 text-xs font-medium text-black/40 dark:from-white/10 dark:to-white/5 dark:text-white/40">
                                        {authorName.charAt(0)}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-black dark:text-white">
                                            {authorName}
                                        </span>
                                        <span className="text-xs text-black/30 dark:text-white/30">
                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm leading-relaxed text-black/70 dark:text-white/70 whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Empty State */}
            {comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-black/30 dark:text-white/30">
                        아직 댓글이 없습니다
                    </p>
                </div>
            )}

            {/* Write Form */}
            <div className="border-t border-black/5 px-5 py-4 dark:border-white/5">
                {user ? (
                    <form onSubmit={handleSubmit}>
                        <div className={`overflow-hidden rounded-xl transition-all ${
                            isFocused
                                ? 'ring-2 ring-black/10 dark:ring-white/10'
                                : ''
                        }`}>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => !content && setIsFocused(false)}
                                placeholder={myBlogId ? "댓글을 입력하세요..." : "블로그 개설 후 댓글을 작성할 수 있습니다."}
                                disabled={!myBlogId}
                                className="w-full resize-none border-0 bg-black/[0.03] px-4 py-3 text-sm text-black outline-none placeholder:text-black/30 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-white/30"
                                rows={isFocused ? 3 : 1}
                                maxLength={500}
                            />

                            {/* Actions - Show when focused */}
                            {isFocused && (
                                <div className="flex items-center justify-between bg-black/[0.03] px-4 py-2 dark:bg-white/[0.03]">
                                    <span className="text-xs text-black/30 dark:text-white/30">
                                        {content.length}/500
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setContent(''); setIsFocused(false); }}
                                            className="rounded-full px-3 py-1.5 text-xs font-medium text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!content.trim() || submitting || !myBlogId}
                                            className="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-30 dark:bg-white dark:text-black"
                                        >
                                            {submitting ? '등록 중...' : '등록'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="flex items-center justify-center rounded-xl bg-black/[0.03] py-4 dark:bg-white/[0.03]">
                        <p className="text-sm text-black/40 dark:text-white/40">
                            댓글을 작성하려면{' '}
                            <Link href="/login" className="font-medium text-black underline dark:text-white">
                                로그인
                            </Link>
                            이 필요합니다
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
