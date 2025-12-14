'use client'

type TabType = 'posts' | 'blogs'

interface SearchTabsProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
    postsCount?: number
    blogsCount?: number
}

export default function SearchTabs({ activeTab, onTabChange, postsCount, blogsCount }: SearchTabsProps) {
    return (
        <div className="mb-8 flex gap-6 border-b border-black/10 dark:border-white/10">
            <button
                type="button"
                onClick={() => onTabChange('posts')}
                className={`pb-4 text-xl font-semibold transition-colors ${activeTab === 'posts'
                    ? 'border-b-[3px] border-black text-black dark:border-white dark:text-white'
                    : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                    }`}
            >
                글{postsCount !== undefined && ` (${postsCount})`}
            </button>
            <button
                type="button"
                onClick={() => onTabChange('blogs')}
                className={`pb-4 text-xl font-semibold transition-colors ${activeTab === 'blogs'
                    ? 'border-b-[3px] border-black text-black dark:border-white dark:text-white'
                    : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                    }`}
            >
                블로그{blogsCount !== undefined && ` (${blogsCount})`}
            </button>
        </div>
    )
}

export type { TabType }
