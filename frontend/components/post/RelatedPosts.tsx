'use client'

import Link from 'next/link'

interface RelatedPost {
    id: string
    title: string
}

interface RelatedPostsProps {
    categoryName: string
    currentPost: RelatedPost
    prevPost?: RelatedPost | null
    nextPost?: RelatedPost | null
}

export default function RelatedPosts({
    categoryName,
    currentPost,
    prevPost,
    nextPost
}: RelatedPostsProps) {
    return (
        <div className="mt-12 mb-12 text-[var(--blog-fg)]">
            <h3 className="mb-4 text-sm font-medium opacity-60">
                '{categoryName}'의 다른글
            </h3>
            <div className="flex flex-col gap-2 border-t border-b border-[var(--blog-fg)]/10 py-4">
                {/* 다음 글 (최신) */}
                {nextPost && (
                    <div className="flex items-center gap-4 text-sm">
                        <span className="w-12 shrink-0 opacity-40">다음글</span>
                        <Link
                            href={`/post/${nextPost.id}`}
                            className="truncate opacity-60 hover:opacity-100 hover:underline"
                        >
                            {nextPost.title}
                        </Link>
                    </div>
                )}

                {/* 현재 글 */}
                <div className="flex items-center gap-4 text-sm">
                    <span className="w-12 shrink-0 opacity-40">현재글</span>
                    <span className="truncate font-medium">
                        {currentPost.title}
                    </span>
                </div>

                {/* 이전 글 (과거) */}
                {prevPost && (
                    <div className="flex items-center gap-4 text-sm">
                        <span className="w-12 shrink-0 opacity-40">이전글</span>
                        <Link
                            href={`/post/${prevPost.id}`}
                            className="truncate opacity-60 hover:opacity-100 hover:underline"
                        >
                            {prevPost.title}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
