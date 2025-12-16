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
        <div className="mt-10 rounded-2xl bg-[var(--blog-fg)]/[0.03] p-6">
            <div className="flex items-start gap-4">
                {/* 프로필 이미지 */}
                <Link href={`/blog/${blogId}`} className="shrink-0">
                    <div className="h-14 w-14 overflow-hidden rounded-full bg-[var(--blog-fg)]/10">
                        {(thumbnailUrl || profileImageUrl) ? (
                            <img
                                src={thumbnailUrl || profileImageUrl || ''}
                                alt={blogName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-[var(--blog-muted)]">
                                {blogName.charAt(0)}
                            </div>
                        )}
                    </div>
                </Link>

                {/* 블로그 정보 */}
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/blog/${blogId}`}
                        className="text-base font-semibold text-[var(--blog-fg)] hover:underline"
                    >
                        {blogName}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--blog-muted)] line-clamp-2">
                        {blogDescription || '블로그 소개글이 없습니다.'}
                    </p>

                    {/* 구독 버튼 */}
                    <div className="mt-3">
                        <SubscriptionButton
                            targetId={authorId}
                            variant="blog"
                            className="!rounded-full !px-4 !py-2 !text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
