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
        <div className="mt-12 overflow-hidden rounded-xl border border-[var(--blog-border)]">
            {/* 다음 글 (최신) */}
            {nextPost && (
                <Link
                    href={`/post/${nextPost.id}`}
                    className="flex items-center gap-4 border-b border-[var(--blog-border)] px-6 py-4 transition-colors hover:bg-[var(--blog-fg)]/5"
                >
                    <span className="shrink-0 text-sm font-medium text-[var(--blog-muted)]">
                        다음 글
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-[var(--blog-fg)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="flex-1 truncate text-sm font-medium text-[var(--blog-fg)]">
                        {nextPost.title}
                    </span>
                </Link>
            )}

            {/* 이전 글 (과거) */}
            {prevPost && (
                <Link
                    href={`/post/${prevPost.id}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[var(--blog-fg)]/5"
                >
                    <span className="shrink-0 text-sm font-medium text-[var(--blog-muted)]">
                        이전 글
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-[var(--blog-fg)]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="flex-1 truncate text-sm font-medium text-[var(--blog-fg)]">
                        {prevPost.title}
                    </span>
                </Link>
            )}
        </div>
    )
}
