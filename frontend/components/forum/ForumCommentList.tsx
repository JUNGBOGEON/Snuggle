'use client'

import { useState, useEffect } from 'react'
import { ForumComment, createForumComment, getForumComments } from '@/lib/api/forum'
import { getMyBlogs } from '@/lib/api/blogs'
import ProfileImage from '@/components/common/ProfileImage'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useUserStore } from '@/lib/store/useUserStore'
import { createClient } from '@/lib/supabase/client'
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

    // Load comments & user's blog
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load Comments
                const data = await getForumComments(forumId)
                setComments(data)

                // 2. Load My Blog ID if logged in
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
        } catch (error) {
            console.error('Failed to post comment', error)
            showAlert('댓글 작성에 실패했습니다.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mt-8 border-t border-black/5 bg-black/[0.02] p-6 dark:border-white/5 dark:bg-white/[0.02] rounded-lg">
            {/* Comment List */}
            <div className="space-y-6">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                        <ProfileImage
                            src={getBlogImageUrl(comment.blog?.thumbnail_url, comment.blog?.profile_image_url)}
                            fallback={comment.blog?.name || 'U'}
                            alt={comment.blog?.name || 'User'}
                            size="md"
                        />
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-black dark:text-white text-sm">
                                    {comment.blog?.name}
                                </span>
                                <span className="text-xs text-black/40 dark:text-white/40">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-black/80 dark:text-white/80 whitespace-pre-wrap">
                                {comment.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Write Form */}
            {user ? (
                <form onSubmit={handleSubmit} className="mt-8 flex gap-4">
                    {/* Show my profile (optional, skipping for simplicity or fetching my profile image) */}
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={myBlogId ? "내용을 입력하세요..." : "블로그 개설 후 댓글을 작성할 수 있습니다."}
                            disabled={!myBlogId}
                            className="w-full resize-none rounded-lg border border-black/10 bg-white p-3 text-sm focus:border-black focus:outline-none dark:border-white/10 dark:bg-black dark:focus:border-white min-h-[80px]"
                            maxLength={500}
                        />
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-black/30 dark:text-white/30">
                                {content.length}/500
                            </span>
                            <button
                                type="submit"
                                disabled={!content.trim() || submitting || !myBlogId}
                                className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
                            >
                                {submitting ? '등록 중...' : '등록'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mt-8 text-center text-sm text-black/40 dark:text-white/40">
                    댓글을 작성하려면 <a href="/login" className="underline">로그인</a>이 필요합니다.
                </div>
            )}
        </div>
    )
}
