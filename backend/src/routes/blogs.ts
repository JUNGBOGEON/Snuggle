import { Router, Response } from 'express'
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js'
import { createAuthenticatedClient, supabase } from '../services/supabase.service.js'
import { logger } from '../utils/logger.js'
import redis from '../config/redis.js'

const router = Router()

// 내 블로그 목록 조회 (활성 상태)
router.get('/my', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)
        const userId = req.user!.id

        const { data: blogs, error } = await authClient
            .from('blogs')
            .select('id, name, description, thumbnail_url, created_at, updated_at')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (error) {
            logger.error('Get my blogs error:', error)
            res.status(500).json({ error: 'Failed to fetch blogs' })
            return
        }

        if (!blogs || blogs.length === 0) {
            res.json([])
            return
        }

        // 각 블로그의 총 조회수 계산
        const blogsWithStats = await Promise.all(blogs.map(async (blog) => {
            const { data: posts, error: postsError } = await authClient
                .from('posts')
                .select('view_count')
                .eq('blog_id', blog.id)

            let totalViewCount = 0
            if (posts && !postsError) {
                totalViewCount = posts.reduce((sum, post) => sum + (post.view_count || 0), 0)
            }

            return {
                ...blog,
                total_view_count: totalViewCount
            }
        }))

        res.json(blogsWithStats)
    } catch (error) {
        logger.error('Get my blogs error:', error)
        res.status(500).json({ error: 'Failed to fetch blogs' })
    }
})

// 삭제된 블로그 목록 조회 (휴지통)
router.get('/deleted', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)
        const userId = req.user!.id

        const { data, error } = await authClient
            .from('blogs')
            .select('id, name, description, thumbnail_url, created_at, deleted_at')
            .eq('user_id', userId)
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false })

        if (error) {
            logger.error('Get deleted blogs error:', error)
            res.status(500).json({ error: 'Failed to fetch deleted blogs' })
            return
        }

        res.json(data || [])
    } catch (error) {
        logger.error('Get deleted blogs error:', error)
        res.status(500).json({ error: 'Failed to fetch deleted blogs' })
    }
})

// 블로그 생성
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)
        const userId = req.user!.id

        const { name, description } = req.body

        if (!name || !name.trim()) {
            res.status(400).json({ error: 'Blog name is required' })
            return
        }

        const { data, error } = await authClient
            .from('blogs')
            .insert({
                user_id: userId,
                name: name.trim(),
                description: description?.trim() || null,
            })
            .select()
            .single()

        if (error) {
            logger.error('Create blog error:', error)
            res.status(500).json({ error: 'Failed to create blog' })
            return
        }

        res.status(201).json(data)
    } catch (error) {
        logger.error('Create blog error:', error)
        res.status(500).json({ error: 'Failed to create blog' })
    }
})

// 블로그 삭제 (Soft Delete)
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)
        const userId = req.user!.id
        const blogId = req.params.id

        // 블로그 소유권 확인
        const { data: blog, error: findError } = await authClient
            .from('blogs')
            .select('id, user_id')
            .eq('id', blogId)
            .single()

        if (findError || !blog) {
            res.status(404).json({ error: 'Blog not found' })
            return
        }

        if (blog.user_id !== userId) {
            res.status(403).json({ error: 'You are not the owner of this blog' })
            return
        }

        // Soft Delete: deleted_at에 현재 시간 설정
        const { error } = await authClient
            .from('blogs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', blogId)

        if (error) {
            logger.error('Delete blog error:', error)
            res.status(500).json({ error: 'Failed to delete blog' })
            return
        }

        res.json({ success: true, message: 'Blog deleted successfully' })
    } catch (error) {
        logger.error('Delete blog error:', error)
        res.status(500).json({ error: 'Failed to delete blog' })
    }
})

// 블로그 복구
router.patch('/:id/restore', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)
        const userId = req.user!.id
        const blogId = req.params.id

        // 블로그 소유권 확인
        const { data: blog, error: findError } = await authClient
            .from('blogs')
            .select('id, user_id, deleted_at')
            .eq('id', blogId)
            .single()

        if (findError || !blog) {
            res.status(404).json({ error: 'Blog not found' })
            return
        }

        if (blog.user_id !== userId) {
            res.status(403).json({ error: 'You are not the owner of this blog' })
            return
        }

        if (!blog.deleted_at) {
            res.status(400).json({ error: 'Blog is not deleted' })
            return
        }

        // 복구: deleted_at을 null로 설정
        const { data, error } = await authClient
            .from('blogs')
            .update({ deleted_at: null })
            .eq('id', blogId)
            .select()
            .single()

        if (error) {
            logger.error('Restore blog error:', error)
            res.status(500).json({ error: 'Failed to restore blog' })
            return
        }

        res.json(data)
    } catch (error) {
        logger.error('Restore blog error:', error)
        res.status(500).json({ error: 'Failed to restore blog' })
    }
})

// 블로그 방문자 수 조회 (DB 누적 + Redis 실시간)
router.get('/:id/visitors', async (req, res): Promise<void> => {
    try {
        const { id: blogId } = req.params

        // 1. Redis에서 아직 DB에 반영 안 된 방문자 수 (pending)
        const pendingKey = `visit:pending:${blogId}`
        const pendingCountStr = await redis.get(pendingKey)
        const pendingCount = parseInt(pendingCountStr || '0')

        // 2. DB에서 누적 방문자 수
        const { data: blog } = await supabase
            .from('blogs')
            .select('visitor_count')
            .eq('id', blogId)
            .single()

        const dbCount = blog?.visitor_count || 0
        const totalCount = dbCount + pendingCount

        res.json({
            today: pendingCount,       // 오늘 (아직 DB 반영 안 된 것)
            total: totalCount,          // 전체 (DB + Redis pending)
        })
    } catch (error) {
        logger.error('Get visitor count error:', error)
        res.status(500).json({ error: 'Failed to get visitor count' })
    }
})

export default router
