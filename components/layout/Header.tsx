'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/lib/store/useUserStore'
import LoginModal from '@/components/auth/LoginModal'
import UserMenu from '@/components/auth/UserMenu'
import SearchInputWithSuggestions from '@/components/search/SearchInputWithSuggestions'

const ThemeToggle = dynamic(() => import('@/components/common/ThemeToggle'), {
    ssr: false,
    loading: () => <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10" />,
})

export default function Header() {
    const pathname = usePathname()
    const { user } = useUserStore()
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

    // Hide header on blog management pages and write page
    if (pathname.includes('/manage') || pathname.includes('/setting') || pathname === '/write') {
        return null
    }

    const isMainPage = pathname === '/'
    const isForumPage = pathname.startsWith('/forum')
    const isFeedPage = pathname === '/feed'

    // Specific logic for elements
    // Main Page: Search + Profile + ThemeToggle (Global?)
    // Forum: Logo, Nav, ThemeToggle. Hide Search/Profile? User said: search and profile ONLY on main page.
    // Wait, User said: "Search and round profile picture ONLY on main page".
    // "Other pages... Snuggle logo, Home, Feed, Skin, Forum buttons".
    // "Forum ONLY: Dark/White mode toggle".
    // Let's interpret strictly.

    // Common Elements: Logo, Navigation (Home, Feed, Skin, Forum) - wait, Main page already has Nav.
    // The user laid out specific requirements for "Other pages".
    // Main Page: As is (implied, or "Search and round profile picture exist").
    // Let's assume Main Page keeps its current layout (Logo, Nav, Search, Theme, Profile).

    // Requirement: "Search and round profile picture are ONLY on main page" -> implication: remove from others.
    // "Other pages... Snuggle logo button, Home button, Feed button, Skin button, Forum button".
    // "Forum ONLY: Dark/White mode toggle".

    // So:
    // Logo: All pages.
    // Nav: All pages.
    // Search: Main page only.
    // Profile (UserMenu): Main page only.
    // ThemeToggle: Main page (existing) AND Forum page (requested). What about others? "Forum ONLY" might mean "Among the others, only Forum gets it".
    // Or "Main page has it too". I'll keep it on Main and Forum.

    return (
        <>
            <header className="relative z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    {/* Logo */}
                    <div className="relative flex items-center">
                        <a href="/" className="text-xl font-bold text-black dark:text-white">
                            Snuggle
                        </a>
                    </div>

                    {/* Navigation - Always show? User requested "Home, Feed, Skin, Forum buttons" for other pages. Main page already has them. So yes, always show. */}
                    <nav className="flex items-center gap-8">
                        <a
                            href="/"
                            className={`text-sm transition-colors ${pathname === '/'
                                    ? 'font-bold text-black dark:text-white'
                                    : 'font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            홈
                        </a>
                        <a
                            href="/feed"
                            className={`text-sm transition-colors ${pathname === '/feed'
                                    ? 'font-bold text-black dark:text-white'
                                    : 'font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            피드
                        </a>
                        <a
                            href="/skins"
                            className={`text-sm transition-colors ${pathname.startsWith('/skins')
                                    ? 'font-bold text-black dark:text-white'
                                    : 'font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            스킨
                        </a>
                        <a
                            href="/forum"
                            className={`text-sm transition-colors ${pathname.startsWith('/forum')
                                    ? 'font-bold text-black dark:text-white'
                                    : 'font-medium text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            포럼
                        </a>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search - Main Page Only */}
                        {isMainPage && <SearchInputWithSuggestions />}

                        {/* Theme Toggle - Main Page OR Forum Page OR Feed Page */}
                        {(isMainPage || isForumPage || isFeedPage) && <ThemeToggle />}

                        {/* User Menu / Login - Main Page Only */}
                        {isMainPage && (
                            user ? (
                                <UserMenu />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                                >
                                    시작하기
                                </button>
                            )
                        )}

                        {/* If not main page, user menu is hidden. How do they log in/out? 
               User constraint: "Round profile picture is ONLY on main page". 
               Maybe "Start" button is allowed? 
               I will stick to the strict requirement: Hide profile on others.
            */}
                    </div>
                </div>
            </header>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
        </>
    )
}
