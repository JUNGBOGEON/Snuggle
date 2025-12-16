import cron from 'node-cron'
import redis from '../config/redis.js'
import { supabase } from '../services/supabase.service.js'
import { logger } from '../utils/logger.js'

const PENDING_KEY_PATTERN = 'visit:pending:*'

/**
 * Redis에 쌓인 방문자 수를 DB로 동기화하는 스케줄러
 * 주기: 매 10분마다 실행
 */
export function startVisitorSyncScheduler() {
    logger.info('[Scheduler] Visitor sync scheduler started (every 10 minutes)')

    cron.schedule('*/10 * * * *', async () => {
        try {
            // 1. Pending Key 스캔
            const keys = await redis.keys(PENDING_KEY_PATTERN)

            if (keys.length === 0) return

            for (const key of keys) {
                // key format: visit:pending:{blogId}
                const blogId = key.split(':').pop()
                if (!blogId) continue

                // 2. 현재 쌓인 카운트 가져오기
                const countStr = await redis.get(key)
                const count = parseInt(countStr || '0')

                if (count > 0) {
                    // 3. DB 업데이트 (select -> update 방식)
                    const { data: blog, error: selectError } = await supabase
                        .from('blogs')
                        .select('visitor_count')
                        .eq('id', blogId)
                        .single()

                    if (selectError) {
                        logger.error(`[Sync] Failed to fetch blog ${blogId}:`, selectError.message)
                        continue
                    }

                    const newCount = (blog?.visitor_count || 0) + count
                    const { error: updateError } = await supabase
                        .from('blogs')
                        .update({ visitor_count: newCount })
                        .eq('id', blogId)

                    if (updateError) {
                        logger.error(`[Sync] Failed to update blog ${blogId}:`, updateError.message)
                        continue
                    }

                    logger.info(`[Sync] Updated blog ${blogId} visitor count: ${blog?.visitor_count || 0} -> ${newCount} (+${count})`)

                    // 4. Redis 키 삭제 (DB 업데이트 성공 후)
                    // decrby 대신 del 사용: 동시성 이슈로 음수가 되는 것을 방지
                    await redis.del(key)
                }
            }
        } catch (error) {
            logger.error('[Scheduler] Visitor sync error:', error)
        }
    })
}
