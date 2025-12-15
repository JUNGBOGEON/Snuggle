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
export default function RelatedPosts({ prevPost, nextPost }: RelatedPostsProps) {
    if (!prevPost && !nextPost) return null

    return (
        <div className="mt-12 overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
            {/* 다음 글 (최신) */}
            {nextPost && (
                <Link
                    href={`/post/${nextPost.id}`}
                    className="flex items-center gap-4 border-b border-black/10 px-6 py-4 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                    <span className="shrink-0 text-sm font-medium text-black/40 dark:text-white/40">
                        다음 글
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="flex-1 truncate text-sm font-medium text-black dark:text-white">
                        {nextPost.title}
                    </span>
                </Link>
            )}

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
            {/* 이전 글 (과거) */}
            {prevPost && (
                <Link
                    href={`/post/${prevPost.id}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                >
                    <span className="shrink-0 text-sm font-medium text-black/40 dark:text-white/40">
                        이전 글
                    </span>
                    <svg className="h-4 w-4 shrink-0 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="flex-1 truncate text-sm font-medium text-black dark:text-white">
                        {prevPost.title}
                    </span>
                </Link>
            )}
        </div>
    )
}
