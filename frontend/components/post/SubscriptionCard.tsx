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
        <div className="mt-12 rounded-2xl border border-[var(--blog-border)] bg-[var(--blog-card-bg)] p-8">
            <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--blog-fg)]">
                        <Link href={`/blog/${blogId}`} className="hover:underline">
                            {blogName}
                        </Link>
                    </h3>
                    <p className="mt-2 text-sm text-[var(--blog-muted)]">
                        {blogDescription || '일상, 생각, 취미를 기록합니다.'}
                    </p>

                    <div className="mt-6">
                        <SubscriptionButton
                            targetId={authorId}
                            className="!px-5 !py-2.5"
                            variant="blog"
                        />
                    </div>
                </div>

                <div className="shrink-0">
                    <Link href={`/blog/${blogId}`}>
                        <img
                            src={thumbnailUrl || profileImageUrl || ''}
                            alt={blogName}
                            className="h-20 w-20 rounded-full object-cover border border-[var(--blog-border)] transition-opacity hover:opacity-80"
                        />
                    </Link>
                </div>
            </div>
        </div>
    )
}
