'use client'

import { useState, useEffect } from 'react'
import { checkSubscription, toggleSubscription } from '@/lib/api/subscribe'
import { useUserStore } from '@/lib/store/useUserStore'

interface SubscriptionButtonProps {
    targetId: string
    className?: string
    onToggle?: (subscribed: boolean) => void
    label?: string
    labelSubscribed?: string
    variant?: 'system' | 'blog'
}

export default function SubscriptionButton({
    targetId,
    className = '',
    onToggle,
    label = '구독하기',
    labelSubscribed = '구독중',
    variant = 'system'
}: SubscriptionButtonProps) {
    const { user } = useUserStore()
    const [subscribed, setSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!user || !targetId || user.id === targetId) return

        let isMounted = true
        const fetchStatus = async () => {
            try {
                const status = await checkSubscription(targetId)
                if (isMounted) {
                    setSubscribed(status)
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchStatus()

        return () => {
            isMounted = false
        }
    }, [user?.id, targetId])

    const handleToggle = async () => {
        if (!user) {
            alert('로그인이 필요합니다.')
            // Or open login modal if feasible
            return
        }

        setLoading(true)
        try {
            const result = await toggleSubscription(targetId)
            setSubscribed(result.subscribed)
            if (onToggle) onToggle(result.subscribed)
        } catch (err) {
            console.error(err)
            alert('오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    if (!user || user.id === targetId) return null

    const systemStyles = subscribed
        ? 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
        : 'border-black bg-white text-black hover:bg-gray-50 dark:border-white dark:bg-black dark:text-white'

    const blogStyles = subscribed
        ? 'border-[var(--blog-border)] bg-[var(--blog-card-bg)] text-[var(--blog-fg)] hover:opacity-80'
        : 'border-[var(--blog-fg)] bg-[var(--blog-fg)] text-[var(--blog-bg)] hover:opacity-90'

    const baseStyles = variant === 'blog' ? blogStyles : systemStyles

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-all ${baseStyles} ${className}`}
        >
            {subscribed ? (
                <>
                    {labelSubscribed}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </>
            ) : (
                <>
                    {label}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </>
            )}
        </button>
    )
}
