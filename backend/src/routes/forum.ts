import { Router, Request, Response } from 'express'
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js'
import { createAuthenticatedClient, supabase } from '../services/supabase.service.js'
import type { Forum, Blog } from '../types/database.types.js'
import { logger } from '../utils/logger.js'

const router = Router()

// Types for forum responses
interface ForumWithRelations {
  id: string
  title: string
  description: string
  user_id: string
  blog_id: string
  category_id: string | null
  created_at: string
  updated_at: string
  view_count: number
  blog: { name: string; thumbnail_url: string | null; user_id: string } | null
  comments: { count: number }[]
}

// 포럼 목록 조회
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0
    const category = req.query.category as string
    const categoryId = req.query.category_id as string
    const search = req.query.q as string
    const searchType = req.query.type as string || 'title_content'

    let query = supabase
      .from('forums')
      .select(`
        *,
        blog:blogs ( name, thumbnail_url, user_id ),
        comments:forum_comments(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 새로운 category_id 기반 필터링
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    // 기존 title prefix 기반 필터링 (하위 호환성)
    else if (category && category !== '전체') {
      query = query.ilike('title', `[${category}]%`)
    }

    // Search
    if (search) {
      const searchQuery = `%${search}%`
      if (searchType === 'title') {
        query = query.ilike('title', searchQuery)
      } else if (searchType === 'content') {
        query = query.ilike('description', searchQuery)
      } else {
        query = query.or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`)
      }
    }

    const { data: forums, error } = await query

    if (error) {
      logger.error('Fetch forums error:', error)
      res.status(500).json({ error: error.message })
      return
    }

    // 프로필 정보 가져오기 (카카오 프로필 이미지용)
    const userIds = (forums as ForumWithRelations[])
      .map((f) => f.blog?.user_id)
      .filter(Boolean) as string[]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; profile_image_url: string | null }) => [p.id, p.profile_image_url])
    )

    // Transform count array to number and add profile_image_url
    const result = (forums as ForumWithRelations[]).map((item) => ({
      ...item,
      comment_count: item.comments?.[0]?.count || 0,
      blog: item.blog ? {
        name: item.blog.name,
        thumbnail_url: item.blog.thumbnail_url,
        profile_image_url: profileMap.get(item.blog.user_id) || null,
      } : null,
    }))

    res.json(result)
  } catch (error) {
    logger.error('Fetch forums error:', error)
    res.status(500).json({ error: 'Failed to fetch forums' })
  }
})

// 포럼 상세 조회 (조회수 증가 포함)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('forums')
      .select(`
        *,
        blog:blogs ( name, thumbnail_url, user_id )
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({ error: 'Forum not found' })
      return
    }

    const forum = data as ForumWithRelations

    // 프로필 정보 가져오기 (카카오 프로필 이미지용)
    let profileImageUrl: string | null = null
    if (forum.blog?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_image_url')
        .eq('id', forum.blog.user_id)
        .single()
      profileImageUrl = profile?.profile_image_url || null
    }

    // 조회수 증가 (비동기로 처리, 실패해도 응답에 영향 없음)
    void (async () => {
      try {
        await supabase
          .from('forums')
          .update({ view_count: (forum.view_count || 0) + 1 })
          .eq('id', id)
      } catch {
        // Ignore errors
      }
    })()

    // 댓글 수 조회
    const { count } = await supabase
      .from('forum_comments')
      .select('*', { count: 'exact', head: true })
      .eq('forum_id', id)

    res.json({
      ...forum,
      blog: forum.blog ? {
        name: forum.blog.name,
        thumbnail_url: forum.blog.thumbnail_url,
        profile_image_url: profileImageUrl,
      } : null,
      view_count: (forum.view_count || 0) + 1,
      comment_count: count || 0
    })
  } catch (error) {
    logger.error('Fetch forum detail error:', error)
    res.status(500).json({ error: 'Failed to fetch forum detail' })
  }
})

// 포럼 글 작성
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { title, description, blog_id, category, category_id } = req.body

    // 하루 3개 제한 체크
    const { data: countData, error: countError } = await supabase
      .rpc('get_user_forum_count_today', { p_user_id: user.id })

    if (countError) {
      logger.error('Check forum limit error:', countError)
      res.status(500).json({ error: 'Failed to check forum limit' })
      return
    }

    if (countData >= 3) {
      res.status(429).json({ error: '하루에 3개까지만 작성할 수 있습니다.' })
      return
    }

    // category_id가 있으면 사용, 없으면 기존 title prefix 방식 (하위 호환성)
    let finalTitle = title
    if (!category_id && category) {
      finalTitle = `[${category}] ${title}`
    }

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const insertData: Partial<Forum> = {
      title: finalTitle,
      description,
      user_id: user.id,
      blog_id
    }

    if (category_id) {
      insertData.category_id = category_id
    }

    const { data, error } = await authClient
      .from('forums')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error('Create forum error:', error)
      res.status(500).json({ error: error.message })
      return
    }

    res.status(201).json(data)
  } catch (error) {
    logger.error('Create forum error:', error)
    res.status(500).json({ error: 'Failed to create forum' })
  }
})

// 포럼 수정
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { id } = req.params
    const { title, description, category_id } = req.body

    // 소유자 확인
    const { data: forum } = await supabase
      .from('forums')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!forum || forum.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const updateData: Partial<Forum> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category_id !== undefined) updateData.category_id = category_id

    const { data, error } = await authClient
      .from('forums')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (error) {
    logger.error('Update forum error:', error)
    res.status(500).json({ error: 'Failed to update forum' })
  }
})

// 포럼 삭제
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { id } = req.params

    // 소유자 확인
    const { data: forum } = await supabase
      .from('forums')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!forum || forum.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const { error } = await authClient
      .from('forums')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ success: true })
  } catch (error) {
    logger.error('Delete forum error:', error)
    res.status(500).json({ error: 'Failed to delete forum' })
  }
})

// 댓글 목록 조회
router.get('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('forum_comments')
      .select(`
        *,
        blog:blogs ( name, thumbnail_url, user_id )
      `)
      .eq('forum_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // 프로필 정보 가져오기 (카카오 프로필 이미지용)
    const userIds = (data || [])
      .map((c: { blog: { user_id: string } | null }) => c.blog?.user_id)
      .filter(Boolean) as string[]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; profile_image_url: string | null }) => [p.id, p.profile_image_url])
    )

    // Transform to include profile_image_url
    const result = (data || []).map((comment: { blog: { name: string; thumbnail_url: string | null; user_id: string } | null;[key: string]: unknown }) => ({
      ...comment,
      blog: comment.blog ? {
        name: comment.blog.name,
        thumbnail_url: comment.blog.thumbnail_url,
        profile_image_url: profileMap.get(comment.blog.user_id) || null,
      } : null,
    }))

    res.json(result)
  } catch (error) {
    logger.error('Fetch comments error:', error)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

// 댓글 작성
router.post('/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { forum_id, blog_id, content, parent_id } = req.body

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const insertData: Record<string, unknown> = {
      forum_id,
      user_id: user.id,
      blog_id,
      content
    }

    if (parent_id) {
      insertData.parent_id = parent_id
    }

    const { data, error } = await authClient
      .from('forum_comments')
      .insert(insertData)
      .select(`
        *,
        blog:blogs ( name, thumbnail_url, user_id )
      `)
      .single()

    if (error) {
      logger.error('Create comment error:', error)
      res.status(500).json({ error: error.message })
      return
    }

    res.status(201).json(data)
  } catch (error) {
    logger.error('Create comment error:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
})

// 댓글 삭제
router.delete('/comments/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { id } = req.params

    // 소유자 확인
    const { data: comment } = await supabase
      .from('forum_comments')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!comment || comment.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized' })
      return
    }

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const { error } = await authClient
      .from('forum_comments')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ success: true })
  } catch (error) {
    logger.error('Delete comment error:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

export default router
