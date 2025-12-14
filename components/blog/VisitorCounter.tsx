'use client'

import { useEffect, useState } from 'react'

interface VisitorCounterProps {
    variant?: 'default' | 'stat'
}

export default function VisitorCounter({ variant = 'default' }: VisitorCounterProps) {
    const [count, setCount] = useState<number | null>(null)

    useEffect(() => {
        const trackAndFetch = async () => {
            try {
                // 백엔드 API 주소 (환경 변수가 없으면 기본값 사용)
                const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')

                // 1. 방문자 기록 (POST) - 비동기로 요청만 보냄
                await fetch(`${API_URL}/api/visitors`, {
                    method: 'POST',
                }).catch((err) => console.error('Failed to track visitor:', err))

                // 2. 카운트 조회 (GET)
                const res = await fetch(`${API_URL}/api/visitors/count`)
                if (!res.ok) throw new Error('Failed to fetch count')

                const data = await res.json()
                setCount(data.count)
            } catch (error) {
                console.error('Visitor counter error:', error)
            }
        }

        trackAndFetch()
    }, [])

    if (variant === 'stat') {
        return (
            <div className="text-center">
                <p className="text-2xl font-bold text-black dark:text-white">
                    {typeof count === 'number' ? count.toLocaleString() : '0'}
                </p>
                <p className="text-xs text-black/50 dark:text-white/50">오늘 방문자</p>
            </div>
        )
    }

    if (count === null) return null

    return (
        <div className="text-xs text-gray-500 font-medium">
            오늘의 방문자: <span className="font-bold text-gray-700">{count.toLocaleString()}</span>명
        </div>
    )
}