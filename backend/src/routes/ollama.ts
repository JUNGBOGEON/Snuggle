import { Router, Response } from 'express'
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js'
import { generateTheme, checkOllamaHealth } from '../services/ollama.service.js'
import { logger } from '../utils/logger.js'

const router = Router()

/**
 * 테마 생성 (2단계: CSS → HTML)
 * POST /api/ollama/chat
 *
 * Body:
 * - messages: [{ role: 'user', content: '보라색 테마' }]
 */
router.post(
  '/chat',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { messages } = req.body

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'messages 배열이 필요합니다' })
        return
      }

      const userMessage = messages[messages.length - 1]?.content
      if (!userMessage) {
        res.status(400).json({ error: '사용자 메시지가 필요합니다' })
        return
      }

      logger.info(`=== AI Request: "${userMessage}" ===`)

      const result = await generateTheme(userMessage)
      res.json(result)
    } catch (error) {
      logger.error('AI chat error:', error)
      res.status(500).json({
        error: '테마 생성 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

/**
 * 스트리밍 테마 생성 (진행 상황 표시)
 * POST /api/ollama/chat/stream
 */
router.post(
  '/chat/stream',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { messages } = req.body

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'messages 배열이 필요합니다' })
        return
      }

      const userMessage = messages[messages.length - 1]?.content
      if (!userMessage) {
        res.status(400).json({ error: '사용자 메시지가 필요합니다' })
        return
      }

      // SSE 설정
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders()

      res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

      logger.info(`=== AI Stream: "${userMessage}" ===`)

      // 진행 상황 전송
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current: 0,
        total: 2,
        message: '테마 생성 시작...',
      })}\n\n`)

      const result = await generateTheme(userMessage)

      // 완료
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current: 2,
        total: 2,
        message: '완료!',
      })}\n\n`)

      res.write(`data: ${JSON.stringify({
        type: 'chunk',
        content: JSON.stringify(result),
      })}\n\n`)

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      res.end()

      logger.info('=== AI Stream Complete ===')
    } catch (error) {
      logger.error('AI stream error:', error)

      if (!res.headersSent) {
        res.status(500).json({ error: '테마 생성 실패' })
      } else if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`)
        res.end()
      }
    }
  }
)

/**
 * 헬스체크
 * GET /api/ollama/health
 */
router.get(
  '/health',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const health = await checkOllamaHealth()
      res.json({
        status: health.available ? 'ok' : 'unavailable',
        model: health.model,
        modelLoaded: health.modelLoaded,
      })
    } catch (error) {
      logger.error('Health check error:', error)
      res.status(500).json({ error: 'Health check failed' })
    }
  }
)

export default router
