'use client'

export function SearchSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse border-b border-black/10 py-6 dark:border-white/10">
                    <div className="h-5 w-3/4 rounded bg-black/10 dark:bg-white/10" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-black/10 dark:bg-white/10" />
                </div>
            ))}
        </div>
    )
}

export function SearchEmpty({ message }: { message: string }) {
    return (
        <div className="py-20 text-center">
            <p className="text-black/50 dark:text-white/50">{message}</p>
        </div>
    )
}

export function PageLoading() {
    return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
            <div className="animate-pulse text-black/50 dark:text-white/50">로딩 중...</div>
        </div>
    )
}
