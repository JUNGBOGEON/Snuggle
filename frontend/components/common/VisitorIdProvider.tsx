'use client'

import { useEffect } from 'react'

const COOKIE_NAME = 'snuggle_visitor_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1년

function generateVisitorId(): string {
    return crypto.randomUUID()
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
    return match ? match[2] : null
}

function setCookie(name: string, value: string, maxAge: number): void {
    // SameSite=None + Secure 필요 (cross-origin 쿠키 전송을 위해)
    // localhost에서는 Secure 없이도 동작하도록 조건부 처리
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    const sameSite = isLocalhost ? 'Lax' : 'None; Secure'
    document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=${sameSite}`
}

/**
 * 방문자 고유 ID를 쿠키로 관리하는 Provider
 * - 쿠키가 없으면 UUID 생성 후 저장
 * - 1년간 유지
 */
export default function VisitorIdProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const existingId = getCookie(COOKIE_NAME)

        if (!existingId) {
            const newId = generateVisitorId()
            setCookie(COOKIE_NAME, newId, COOKIE_MAX_AGE)
        }
    }, [])

    return <>{children}</>
}
