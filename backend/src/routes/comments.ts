import { Router, Response } from 'express'
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js'
import { createAuthenticatedClient, supabase } from '../services/supabase.service.js'

const router = Router()

// 댓글 조회 (특정 게시글의 댓글 - 페이지네이션 지원)
router.get('/:postId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { postId } = req.params
        const limit = parseInt(req.query.limit as string) || 20
        const offset = parseInt(req.query.offset as string) || 0
        const token = req.headers.authorization?.split(' ')[1]

        // 토큰이 있으면 인증된 클라이언트, 없으면 익명 클라이언트 사용
        const client = token ? createAuthenticatedClient(token) : supabase

        // 0. 전체 댓글 수 조회
        const { count: totalCount, error: countError } = await client
            .from('post_comment')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)

        if (countError) {
            console.error('Fetch comment count error:', countError)
            res.status(500).json({ error: 'Failed to fetch comments' })
            return
        }

        // 1. 루트 댓글만 페이지네이션해서 가져오기
        const { data: rootComments, error: rootError } = await client
            .from('post_comment')
            .select(`
                *,
                profiles:user_id (
                    id,
                    nickname,
                    profile_image_url
                ),
                blog:blog_id (
                    id,
                    name,
                    thumbnail_url
                )
            `)
            .eq('post_id', postId)
            .is('parent_id', null)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1)

        if (rootError) {
            console.error('Fetch root comments error:', rootError)
            res.status(500).json({ error: 'Failed to fetch comments' })
            return
        }

        if (!rootComments || rootComments.length === 0) {
            res.json({ comments: [], totalCount: totalCount || 0 })
            return
        }

        // 2. 해당 루트 댓글들의 대댓글 모두 가져오기
        const rootIds = rootComments.map(c => c.id)
        const { data: replies, error: replyError } = await client
            .from('post_comment')
            .select(`
                *,
                profiles:user_id (
                    id,
                    nickname,
                    profile_image_url
                ),
                blog:blog_id (
                    id,
                    name,
                    thumbnail_url
                )
            `)
            .eq('post_id', postId)
            .in('parent_id', rootIds)
            .order('created_at', { ascending: true })

        if (replyError) {
            console.error('Fetch replies error:', replyError)
            res.status(500).json({ error: 'Failed to fetch comments' })
            return
        }

        // 루트 댓글 + 대댓글 합쳐서 반환 (totalCount 포함)
        const allComments = [...rootComments, ...(replies || [])]
        res.json({ comments: allComments, totalCount: totalCount || 0 })
    } catch (error) {
        console.error('Fetch comments error:', error)
        res.status(500).json({ error: 'Failed to fetch comments' })
    }
})

// 댓글 작성
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id
        const { post_id, comment_text, parent_id, blog_id } = req.body

        if (!post_id || !comment_text) {
            res.status(400).json({ error: 'post_id and comment_text are required' })
            return
        }

        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)

        const { data, error } = await authClient
            .from('post_comment')
            .insert({
                post_id,
                user_id: userId,
                comment_text,
                parent_id: parent_id || null,
                blog_id: blog_id || null
            })
            .select(`
                *,
                profiles:user_id (
                    id,
                    nickname,
                    profile_image_url
                ),
                blog:blog_id (
                    id,
                    name,
                    thumbnail_url
                )
            `)
            .single()

        if (error) {
            console.error('Create comment error:', error)
            res.status(500).json({ error: 'Failed to create comment' })
            return
        }

        res.json(data)
    } catch (error) {
        console.error('Create comment error:', error)
        res.status(500).json({ error: 'Failed to create comment' })
    }
})

// 댓글 삭제
router.delete('/:commentId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id
        const { commentId } = req.params

        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)

        const { error } = await authClient
            .from('post_comment')
            .delete()
            .eq('id', commentId)
            .eq('user_id', userId) // 본인 댓글만 삭제 가능

        if (error) {
            console.error('Delete comment error:', error)
            res.status(500).json({ error: 'Failed to delete comment' })
            return
        }

        res.json({ success: true })
    } catch (error) {
        console.error('Delete comment error:', error)
        res.status(500).json({ error: 'Failed to delete comment' })
    }
})

// 댓글 수정
router.patch('/:commentId', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id
        const { commentId } = req.params
        const { comment_text } = req.body

        if (!comment_text) {
            res.status(400).json({ error: 'comment_text is required' })
            return
        }

        const token = req.headers.authorization!.split(' ')[1]
        const authClient = createAuthenticatedClient(token)

        const { data, error } = await authClient
            .from('post_comment')
            .update({
                comment_text,
                updated_at: new Date().toISOString()
            })
            .eq('id', commentId)
            .eq('user_id', userId) // 본인 댓글만 수정 가능
            .select(`
                *,
                profiles:user_id (
                    id,
                    nickname,
                    profile_image_url
                ),
                blog:blog_id (
                    id,
                    name,
                    thumbnail_url
                )
            `)
            .single()

        if (error) {
            console.error('Update comment error:', error)
            res.status(500).json({ error: 'Failed to update comment' })
            return
        }

        res.json(data)
    } catch (error) {
        console.error('Update comment error:', error)
        res.status(500).json({ error: 'Failed to update comment' })
    }
})

export default router
