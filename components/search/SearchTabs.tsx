'use client'

type TabType = 'posts' | 'blogs'

interface SearchTabsProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
}

export default function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
    return (
        <div className="mb-6 flex gap-4 border-b border-black/10 dark:border-white/10">
            <button
                type="button"
                onClick={() => onTabChange('posts')}
                className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'posts'
                        ? 'border-b-2 border-black text-black dark:border-white dark:text-white'
                        : 'text-black/50 hover:text-black/70 dark:text-white/50 dark:hover:text-white/70'
                    }`}
            >
                글
            </button>
            <button
                type="button"
                onClick={() => onTabChange('blogs')}
                className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'blogs'
                        ? 'border-b-2 border-black text-black dark:border-white dark:text-white'
                        : 'text-black/50 hover:text-black/70 dark:text-white/50 dark:hover:text-white/70'
                    }`}
            >
                블로그
            </button>
        </div>
    )
}

export type { TabType }
