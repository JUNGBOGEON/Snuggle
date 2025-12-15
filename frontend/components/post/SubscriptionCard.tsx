'use client'

import Link from 'next/link'
import SubscriptionButton from '@/components/common/SubscriptionButton'

interface SubscriptionCardProps {
    blogId: string
    blogName: string
    blogDescription: string | null
    authorId: string
    thumbnailUrl: string | null
    profileImageUrl: string | null
}

export default function SubscriptionCard({
    blogId,
    blogName,
    blogDescription,
    authorId,
    thumbnailUrl,
    profileImageUrl
}: SubscriptionCardProps) {
    return (
        <div className="mt-12 rounded-xl border border-[var(--blog-border)] bg-[var(--blog-fg)]/[0.02] p-6">
            <div className="flex items-center gap-4">
                {/* 프로필 이미지 */}
                <Link href={`/blog/${blogId}`} className="shrink-0">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-[var(--blog-fg)]/10">
                        {(thumbnailUrl || profileImageUrl) ? (
                            <img
                                src={thumbnailUrl || profileImageUrl || ''}
                                alt={blogName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[var(--blog-muted)]">
                                {blogName.charAt(0)}
                            </div>
                        )}
                    </div>
                </Link>

                {/* 블로그 정보 */}
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/blog/${blogId}`}
                        className="text-lg font-bold text-[var(--blog-fg)] hover:underline"
                    >
                        {blogName}
                    </Link>
                    <p className="mt-1 truncate text-sm text-[var(--blog-fg)]/60">
                        {blogDescription || '소개글이 없습니다.'}
                    </p>
                </div>

                {/* 구독 버튼 */}
                <div className="shrink-0">
                    <SubscriptionButton
                        targetId={authorId}
                        variant="blog"
                        className="!rounded-lg !px-4 !py-2"
                    />
                </div>
            </div>
        </div>
    )
}
