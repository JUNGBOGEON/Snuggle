import Redis from 'ioredis'
import dotenv from 'dotenv'
import { logger } from '../utils/logger.js'

dotenv.config()

// REDIS_URL이 있으면 URL로 연결 (Upstash 등), 없으면 개별 설정 사용
const redisUrl = process.env.REDIS_URL

const redis = redisUrl
    ? new Redis(redisUrl, {
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
        retryStrategy: (times) => Math.min(times * 50, 2000)
    })
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => Math.min(times * 50, 2000)
    })

redis.on('connect', () => {
    logger.info('[Redis] Connected successfully')
})

redis.on('error', (err) => {
    logger.error('[Redis] Connection error:', err.message)
})

export default redis
