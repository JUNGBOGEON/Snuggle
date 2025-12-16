'use client'

import Link from 'next/link'

interface RelatedPost {
    id: string
    title: string
}

interface RelatedPostsProps {
    prevPost?: RelatedPost | null
    nextPost?: RelatedPost | null
}

export default function RelatedPosts({ prevPost, nextPost }: RelatedPostsProps) {
    if (!prevPost && !nextPost) return null

    return (
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {/* 이전 글 */}
            <div>
                {prevPost ? (
                    <Link
                        href={`/post/${prevPost.id}`}
                        className="group flex h-full flex-col rounded-xl border border-[var(--blog-border)] p-5 transition-colors hover:bg-[var(--blog-fg)]/[0.02]"
                    >
                        <span className="text-xs font-medium text-[var(--blog-muted)]">
                            이전 글
                        </span>
                        <span className="mt-2 line-clamp-2 text-sm font-medium text-[var(--blog-fg)] group-hover:underline">
                            {prevPost.title}
                        </span>
                    </Link>
                ) : (
                    <div className="h-full rounded-xl border border-dashed border-[var(--blog-border)] p-5 opacity-50">
                        <span className="text-xs text-[var(--blog-muted)]">이전 글이 없습니다</span>
                    </div>
                )}
            </div>

            {/* 다음 글 */}
            <div>
                {nextPost ? (
                    <Link
                        href={`/post/${nextPost.id}`}
                        className="group flex h-full flex-col items-end rounded-xl border border-[var(--blog-border)] p-5 text-right transition-colors hover:bg-[var(--blog-fg)]/[0.02]"
                    >
                        <span className="text-xs font-medium text-[var(--blog-muted)]">
                            다음 글
                        </span>
                        <span className="mt-2 line-clamp-2 text-sm font-medium text-[var(--blog-fg)] group-hover:underline">
                            {nextPost.title}
                        </span>
                    </Link>
                ) : (
                    <div className="flex h-full flex-col items-end rounded-xl border border-dashed border-[var(--blog-border)] p-5 opacity-50">
                        <span className="text-xs text-[var(--blog-muted)]">다음 글이 없습니다</span>
                    </div>
                )}
            </div>
        </div>
    )
}
