import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

async function main() {
    try {
        console.log('=== Redis Visitor Pending Keys ===\n')

        // 모든 pending 키 조회
        const keys = await redis.keys('visit:pending:*')

        if (keys.length === 0) {
            console.log('No pending keys found.')
        } else {
            for (const key of keys) {
                const value = await redis.get(key)
                const blogId = key.split(':').pop()
                console.log(`Blog ID: ${blogId}`)
                console.log(`  Key: ${key}`)
                console.log(`  Value: ${value}`)

                // 음수인 경우 표시
                if (parseInt(value || '0') < 0) {
                    console.log(`  ⚠️  NEGATIVE VALUE DETECTED!`)
                }
                console.log('')
            }
        }

        process.exit(0)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

main()
