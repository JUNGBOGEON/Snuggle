'use client'

import { ForumPost } from '@/lib/api/forum'
import ForumItem from './ForumItem'

interface ForumListProps {
    forums: ForumPost[]
}

export default function ForumList({ forums }: ForumListProps) {
    if (forums.length === 0) {
        return (
            <div className="py-20 text-center text-black/40 dark:text-white/40">
                작성된 글이 없습니다.
            </div>
        )
    }

    return (
        <div className="divide-y divide-black/10 dark:divide-white/10">
            {forums.map((post) => (
                <ForumItem key={post.id} post={post} />
            ))}
        </div>
    )
}
