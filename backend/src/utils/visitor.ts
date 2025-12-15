import redis from '../config/redis.js'
import { logger } from './logger.js'

const VISIT_KEY_PREFIX = 'visit:log'
const PENDING_KEY_PREFIX = 'visit:pending'

/**
 * 방문자 수 카운팅 함수 (Redis 활용)
 * @param blogId 블로그 ID
 * @param visitorId 방문자 고유 ID (쿠키 기반, 없으면 IP 사용)
 */
export async function trackVisitor(blogId: string, visitorId: string) {
    try {
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const logKey = `${VISIT_KEY_PREFIX}:${blogId}:${visitorId}:${today}`

        // 1. 중복 방문 체크 (오늘 하루 동안 동일 방문자 무시)
        const hasVisited = await redis.get(logKey)

        if (!hasVisited) {
            // 2. 방문 기록 저장 (TTL 24시간)
            await redis.set(logKey, '1', 'EX', 86400)

            // 3. 카운트 증가 (Sync를 위한 Pending Key)
            await redis.incr(`${PENDING_KEY_PREFIX}:${blogId}`)
        }
    } catch (error) {
        logger.error('Redis visitor tracking error:', error)
    }
}

/**
 * 요청에서 방문자 ID 추출 (쿠키 우선, 없으면 IP)
 */
export function getVisitorId(cookies: string | undefined, ip: string): string {
    if (cookies) {
        const match = cookies.match(/snuggle_visitor_id=([^;]+)/)
        if (match) return match[1]
    }
    return ip // 쿠키 없으면 IP 사용 (fallback)
}

