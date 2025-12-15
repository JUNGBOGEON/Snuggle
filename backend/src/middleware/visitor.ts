import { Request, Response, NextFunction } from 'express'
import { trackVisitor, getVisitorId } from '../utils/visitor.js'

/**
 * 블로그 방문자 수 집계 미들웨어
 * req.params.blogId가 존재하는 라우트에서 사용
 * 쿠키 기반 방문자 ID 사용 (없으면 IP fallback)
 */
export const blogVisitorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // 응답이 끝난 후 비동기로 처리 (사용자 경험 저하 방지)
    res.on('finish', () => {
        try {
            const { blogId } = req.params
            const cookies = req.headers.cookie
            const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
            const visitorId = getVisitorId(cookies, ip)

            if (blogId) {
                trackVisitor(blogId, visitorId).catch(err => console.error('Visitor track error', err))
            }
        } catch (error) {
            // Ignore
        }
    })

    next()
}

