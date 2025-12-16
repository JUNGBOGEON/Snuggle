'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useUserStore } from '@/lib/store/useUserStore'
import LoginModal from '@/components/auth/LoginModal'
import UserMenu from '@/components/auth/UserMenu'
import SearchInputWithSuggestions from '@/components/search/SearchInputWithSuggestions'
import ThemeToggle from '@/components/common/ThemeToggle'

export default function Header() {
    const pathname = usePathname()
    const { user, isLoading } = useUserStore()
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const tabContainerRef = useRef<HTMLDivElement>(null)
    const skinsTabRef = useRef<HTMLAnchorElement>(null)
    const marketplaceTabRef = useRef<HTMLAnchorElement>(null)
    const [pillStyle, setPillStyle] = useState({ transform: 'translateX(0)', width: 0 })
    const [isInitialized, setIsInitialized] = useState(false)

    // Track client mount
    useEffect(() => {
        setIsMounted(true)
    }, [])

    const isMainPage = pathname === '/'
    const isForumPage = pathname.startsWith('/forum')
    const isFeedPage = pathname === '/feed'
    const isSkinsPage = pathname === '/skins'
    const isMarketplacePage = pathname === '/marketplace'
    const isSkinsSection = isSkinsPage || isMarketplacePage

    // Update pill position based on active tab
    useEffect(() => {
        const updatePill = () => {
            const activeRef = isSkinsPage ? skinsTabRef : marketplaceTabRef
            if (activeRef.current && tabContainerRef.current) {
                const containerRect = tabContainerRef.current.getBoundingClientRect()
                const tabRect = activeRef.current.getBoundingClientRect()
                const offsetX = tabRect.left - containerRect.left

                setPillStyle({
                    transform: `translateX(${offsetX}px)`,
                    width: tabRect.width,
                })

                // Enable transition after initial render
                if (!isInitialized) {
                    requestAnimationFrame(() => {
                        setIsInitialized(true)
                    })
                }
            }
        }

        updatePill()
        // Also update on window resize
        window.addEventListener('resize', updatePill)
        return () => window.removeEventListener('resize', updatePill)
    }, [isSkinsPage, isMarketplacePage, isInitialized])

    // Hide header on blog pages, post pages, management pages, write page, and search page
    // Blog and post pages use BlogHeader with blog-specific themes
    // Search page uses its own SearchHeader
    if (
        pathname.includes('/manage') ||
        pathname.includes('/setting') ||
        pathname === '/write' ||
        pathname.startsWith('/blog/') ||
        pathname.startsWith('/post/') ||
        pathname.startsWith('/search')
    ) {
        return null
    }

    return (
        <>
            <header className="relative z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
                <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    {/* Logo */}
                    <div className="relative z-10 flex items-center">
                        <a href="/" className="text-xl font-bold text-black dark:text-white">
                            Snuggle
                        </a>
                    </div>

                    {/* Navigation - Absolutely centered */}
                    <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-8">
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
                    <div className="relative z-10 flex items-center gap-3">
                        {/* Skins Section Tabs with Sliding Pill Animation */}
                        {isSkinsSection && (
                            <div
                                ref={tabContainerRef}
                                className="relative flex items-center rounded-full bg-black/5 p-1 dark:bg-white/5"
                            >
                                {/* Sliding Pill Background - GPU accelerated */}
                                <div
                                    className="absolute top-1 bottom-1 left-0 rounded-full bg-black dark:bg-white"
                                    style={{
                                        transform: pillStyle.transform,
                                        width: pillStyle.width || 'auto',
                                        willChange: 'transform, width',
                                        transition: isInitialized
                                            ? 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                                            : 'none',
                                    }}
                                />
                                {/* Tab Links */}
                                <a
                                    ref={skinsTabRef}
                                    href="/skins"
                                    className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                                        isSkinsPage
                                            ? 'text-white dark:text-black'
                                            : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
                                    }`}
                                >
                                    내 스킨
                                </a>
                                <a
                                    ref={marketplaceTabRef}
                                    href="/marketplace"
                                    className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                                        isMarketplacePage
                                            ? 'text-white dark:text-black'
                                            : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
                                    }`}
                                >
                                    마켓플레이스
                                </a>
                            </div>
                        )}

                        {/* Search - Main Page Only */}
                        {isMainPage && <SearchInputWithSuggestions />}

                        {/* Theme Toggle - Main Page OR Forum Page OR Feed Page OR Skins Section */}
                        {(isMainPage || isForumPage || isFeedPage || isSkinsSection) && <ThemeToggle />}

                        {/* User Menu / Login - Main Page Only */}
                        {isMainPage && (
                            (!isMounted || isLoading) ? (
                                <div className="h-9 w-20 rounded-full bg-black/10 dark:bg-white/10" />
                            ) : user ? (
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
