'use client'

import React from 'react'

interface FeedHeaderProps {
    followingCount: number
    followersCount: number
}

export default function FeedHeader({ followingCount, followersCount }: FeedHeaderProps) {
    return (
        <div className="mb-6 border-b border-black/10 pb-4 dark:border-white/10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-black dark:text-white">Feed</h1>
                    <p className="mt-1 text-lg text-black dark:text-white">
                        내가 구독하는 글입니다
                    </p>
                </div>
                <div className="flex gap-4 text-sm">
                    <span className="text-black/50 dark:text-white/50">
                        구독중 <span className="font-semibold text-black dark:text-white">{followingCount}</span>
                    </span>
                    <span className="text-black/50 dark:text-white/50">
                        구독자 <span className="font-semibold text-black dark:text-white">{followersCount}</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
