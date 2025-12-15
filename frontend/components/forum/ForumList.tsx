'use client'

import { ForumPost } from '@/lib/api/forum'
import ForumItem from './ForumItem'

interface ForumListProps {
    forums: ForumPost[]
}

export default function ForumList({ forums }: ForumListProps) {
    if (forums.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                    <svg className="h-8 w-8 text-black/20 dark:text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <p className="text-sm text-black/40 dark:text-white/40">아직 작성된 글이 없습니다</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {forums.map((post) => (
                <ForumItem key={post.id} post={post} />
            ))}
        </div>
    )
}
