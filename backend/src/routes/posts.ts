import { Router, Request, Response } from 'express'
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js'
import { createAuthenticatedClient, supabase } from '../services/supabase.service.js'
import type { Post, Blog, Category, Profile } from '../types/database.types.js'
import { logger } from '../utils/logger.js'

const router = Router()

// Types for Supabase responses
interface SubscribeRow {
  subed_id: string
}

// HTML content에서 첫 번째 이미지 URL 추출
function extractFirstImageUrl(content: string): string | null {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/)
  return imgMatch ? imgMatch[1] : null
}

// 피드 목록 조회 (구독한 블로거의 글)
router.get('/feed', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const limit = parseInt(req.query.limit as string) || 14
    const offset = parseInt(req.query.offset as string) || 0

    // 1. 내가 구독한 사람들의 ID (subed_id) 가져오기
    const { data: subscribed, error: subError } = await supabase
      .from('subscribe')
      .select('subed_id')
      .eq('sub_id', user.id)

    if (subError) throw subError

    const subscribedUserIds = (subscribed as SubscribeRow[]).map((row) => row.subed_id)

    if (subscribedUserIds.length === 0) {
      res.json([])
      return
    }

    // 2. 해당 유저들의 글 가져오기 (relation join으로 N+1 해결)
    const { data: posts, error: postError } = await supabase
      .from('posts')
      .select(`
        id, title, content, thumbnail_url, created_at, blog_id, user_id, is_private,
        blog:blogs ( name, thumbnail_url, user_id )
      `)
      .in('user_id', subscribedUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (postError) throw postError

    // 프로필 정보 가져오기 (카카오 프로필 이미지용)
    const userIds = (posts || []).map((p: Record<string, unknown>) => {
      const blogData = p.blog as Record<string, unknown> | null
      return blogData?.user_id as string
    }).filter(Boolean)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; profile_image_url: string | null }) => [p.id, p.profile_image_url])
    )

    // Transform response to match frontend expectation
    // Supabase returns relation as array, get first item
    const result = (posts || []).map((post: Record<string, unknown>) => {
      const blogData = post.blog as Record<string, unknown> | null
      const blogUserId = blogData?.user_id as string | undefined
      const profileImageUrl = blogUserId ? profileMap.get(blogUserId) : null
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        thumbnail_url: post.thumbnail_url,
        created_at: post.created_at,
        blog_id: post.blog_id,
        blog: blogData ? {
          name: (blogData.name as string) || '',
          thumbnail_url: (blogData.thumbnail_url as string | null) || null,
          profile_image_url: profileImageUrl || null,
        } : null,
      }
    })

    res.json(result)
  } catch (error) {
    logger.error('Feed error:', error)
    res.status(500).json({ error: 'Failed to fetch feed' })
  }
})

// 오늘의 인기글 (최근 7일 기준 좋아요 순)
router.get('/popular', async (req: Request, res: Response): Promise<void> => {
  try {
    // 오늘의 인기글 -> 오늘 00:00:00 이후 작성된 글만
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id, title, content, thumbnail_url, created_at, blog_id, user_id, like_count,
        blog:blogs ( name, thumbnail_url, user_id )
      `)
      .gt('created_at', today.toISOString()) // 오늘 작성된 글만
      .gt('like_count', 0) // 좋아요 1개 이상만
      .eq('published', true)
      .eq('is_private', false)
      .order('like_count', { ascending: false })
      .limit(5)

    if (error) {
      throw error
    }

    // 프로필 정보 가져오기 (작성자 프로필)
    const userIds = (posts || []).map((p: any) => p.blog?.user_id).filter(Boolean)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.id, p])
    )

    const result = (posts || []).map((post: any) => {
      const blogUserId = post.blog?.user_id
      const profile = blogUserId ? profileMap.get(blogUserId) : null

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        thumbnail_url: post.thumbnail_url,
        created_at: post.created_at,
        like_count: post.like_count || 0,
        blog: post.blog ? {
          name: post.blog.name,
          thumbnail_url: post.blog.thumbnail_url,
          profile_image_url: profile ? profile.profile_image_url : null
        } : null
      }
    })

    res.json(result)
  } catch (error) {
    logger.error('Popular posts error:', error)
    res.status(500).json({ error: 'Failed to fetch popular posts' })
  }
})

// 전체 게시글 목록 (공개글만, 인증 불필요) - N+1 해결
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    // relation join으로 N+1 문제 해결
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id, title, content, thumbnail_url, created_at, blog_id, is_private,
        blog:blogs ( name, thumbnail_url, user_id )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // 프로필 정보 가져오기 (카카오 프로필 이미지용)
    const userIds = (posts || []).map((p: Record<string, unknown>) => {
      const blogData = p.blog as Record<string, unknown> | null
      return blogData?.user_id as string
    }).filter(Boolean)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, profile_image_url')
      .in('id', userIds)

    const profileMap = new Map(
      (profiles || []).map((p: { id: string; profile_image_url: string | null }) => [p.id, p.profile_image_url])
    )

    // Transform response
    const postsWithDetails = (posts || []).map((post: Record<string, unknown>) => {
      const blogData = post.blog as Record<string, unknown> | null
      const blogUserId = blogData?.user_id as string | undefined
      const profileImageUrl = blogUserId ? profileMap.get(blogUserId) : null
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        thumbnail_url: post.thumbnail_url,
        created_at: post.created_at,
        blog_id: post.blog_id,
        blog: blogData ? {
          name: blogData.name,
          thumbnail_url: blogData.thumbnail_url,
          profile_image_url: profileImageUrl || null,
        } : null,
      }
    })

    res.json(postsWithDetails)
  } catch (error) {
    logger.error('Get posts error:', error)
    res.status(500).json({ error: 'Failed to get posts' })
  }
})

// 블로그별 게시글 목록
router.get('/blog/:blogId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { blogId } = req.params
    const showAll = req.query.showAll === 'true'
    const authHeader = req.headers.authorization
    let isOwner = false

    // 인증된 사용자인 경우 소유자 확인
    if (authHeader?.startsWith('Bearer ') && showAll) {
      const token = authHeader.split(' ')[1]
      const authClient = createAuthenticatedClient(token)
      const { data: { user } } = await authClient.auth.getUser()

      if (user) {
        const { data: blog } = await supabase
          .from('blogs')
          .select('user_id')
          .eq('id', blogId)
          .single()

        isOwner = blog?.user_id === user.id
      }
    }

    let query = supabase
      .from('posts')
      .select('*')
      .eq('blog_id', blogId)
      .order('created_at', { ascending: false })

    // 소유자가 아니면 공개글만 -> 이제 목록에서는 모두 노출
    // if (!isOwner) {
    //   query = query.eq('is_private', false)
    // }

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (error) {
    logger.error('Get blog posts error:', error)
    res.status(500).json({ error: 'Failed to get blog posts' })
  }
})

// 게시글 상세 조회 (조회수 증가 포함)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const authHeader = req.headers.authorization
    const selectedBlogId = req.query.selectedBlogId as string | undefined

    // relation join으로 단일 쿼리로 조회
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        blog:blogs ( id, user_id, name, thumbnail_url ),
        category:categories ( id, name )
      `)
      .eq('id', id)
      .single()

    if (postError || !post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }

    const typedPost = post as Post & {
      blog: Pick<Blog, 'id' | 'user_id' | 'name' | 'thumbnail_url'> | null
      category: Pick<Category, 'id' | 'name'> | null
    }

    if (!typedPost.blog) {
      res.status(404).json({ error: 'Blog not found' })
      return
    }

    // 비공개 글 접근 권한 확인
    // user_id가 일치하고, 현재 선택된 블로그가 해당 게시글의 블로그인 경우에만 접근 가능
    if (typedPost.is_private) {
      let canAccess = false

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        const authClient = createAuthenticatedClient(token)
        const { data: { user } } = await authClient.auth.getUser()

        // 작성자이면서 현재 선택된 블로그가 게시글의 블로그와 일치해야 함
        const isOwner = user?.id === typedPost.user_id
        const isSameBlog = selectedBlogId === typedPost.blog.id
        canAccess = isOwner && isSameBlog
      }

      if (!canAccess) {
        res.status(403).json({ error: 'Private post' })
        return
      }
    }

    // 조회수 증가 (비동기로 처리, 실패해도 응답에 영향 없음)
    void (async () => {
      try {
        await supabase
          .from('posts')
          .update({ view_count: (typedPost.view_count || 0) + 1 })
          .eq('id', id)
      } catch {
        // Ignore errors
      }
    })()

    // 프로필 정보
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nickname, profile_image_url')
      .eq('id', typedPost.blog.user_id)
      .eq('id', typedPost.blog.user_id)
      .single()

    // 좋아요 여부 확인
    let isLiked = false
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const authClient = createAuthenticatedClient(token)
      const { data: { user } } = await authClient.auth.getUser()
      if (user) {
        const { data: likeData } = await supabase
          .from('likes')
          .select('posts_id') // posts_id 확인
          .eq('posts_id', id)
          .eq('user_id', user.id)
          .single()
        isLiked = !!likeData
      }
    }

    // 이전 글 / 다음 글 조회 (같은 블로그 내)
    const { data: prevPost } = await supabase
      .from('posts')
      .select('id, title')
      .eq('blog_id', typedPost.blog_id)
      .lt('created_at', typedPost.created_at) // 현재 글보다 오래된 글 중 가장 최신 (=이전 글)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: nextPost } = await supabase
      .from('posts')
      .select('id, title')
      .eq('blog_id', typedPost.blog_id)
      .gt('created_at', typedPost.created_at) // 현재 글보다 최신 글 중 가장 오래된 (=다음 글)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    res.json({
      ...typedPost,
      profile,
      prev_post: prevPost || null,
      next_post: nextPost || null,
      is_liked: isLiked,
    })
  } catch (error) {
    logger.error('Get post error:', error)
    res.status(500).json({ error: 'Failed to get post' })
  }
})

// 게시글 생성 (인증 필요)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { blog_id, title, content, category_ids, is_private, is_allow_comment, thumbnail_url } = req.body

    if (!blog_id || !title) {
      res.status(400).json({ error: 'blog_id and title are required' })
      return
    }

    // 블로그 소유자 확인
    const { data: blog } = await supabase
      .from('blogs')
      .select('user_id')
      .eq('id', blog_id)
      .single()

    if (!blog || blog.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized to post to this blog' })
      return
    }

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const { data, error } = await authClient
      .from('posts')
      .insert({
        blog_id,
        user_id: user.id,
        title: title.trim(),
        content: content || '',
        published: true, // 항상 공개 상태로 저장 (is_private로 제어)
        is_private: is_private ?? false,
        is_allow_comment: is_allow_comment ?? true,
        thumbnail_url: thumbnail_url || extractFirstImageUrl(content || ''),
      })
      .select()
      .single()

    if (error) {
      logger.error('Insert error:', error)
      res.status(500).json({ error: error.message })
      return
    }

    // 카테고리 연결 (다중 카테고리)
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const postCategories = category_ids.slice(0, 5).map((categoryId: string) => ({
        post_id: data.id,
        category_id: categoryId,
      }))

      await authClient
        .from('post_categories')
        .insert(postCategories)
    }

    res.status(201).json(data)
  } catch (error) {
    logger.error('Create post error:', error)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// 게시글 수정 (인증 필요)
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { id } = req.params
    const { title, content, category_ids, is_private, is_allow_comment, thumbnail_url } = req.body

    // 게시글 소유자 확인
    const { data: post } = await supabase
      .from('posts')
      .select('blog_id')
      .eq('id', id)
      .single()

    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }

    const { data: blog } = await supabase
      .from('blogs')
      .select('user_id')
      .eq('id', post.blog_id)
      .single()

    if (!blog || blog.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized to edit this post' })
      return
    }

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const updateData: Partial<Post> = {}
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) {
      updateData.content = content
      updateData.thumbnail_url = extractFirstImageUrl(content)
    }
    if (is_private !== undefined) (updateData as any).is_private = is_private
    // is_private 변경 시 (또는 항상) published는 true로 강제하여 DB RLS 통과 보장
    if (is_private !== undefined || title !== undefined || content !== undefined) {
      (updateData as any).published = true
    }

    // if (is_allow_comment !== undefined) (updateData as any).is_allow_comment = is_allow_comment // DB 컬럼 없음 대비 임시 주석
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url

    const { data, error } = await authClient
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // 카테고리 업데이트 (기존 삭제 후 새로 추가)
    if (category_ids !== undefined && Array.isArray(category_ids)) {
      await authClient
        .from('post_categories')
        .delete()
        .eq('post_id', id)

      if (category_ids.length > 0) {
        const postCategories = category_ids.slice(0, 5).map((categoryId: string) => ({
          post_id: id,
          category_id: categoryId,
        }))

        await authClient
          .from('post_categories')
          .insert(postCategories)
      }
    }

    res.json(data)
  } catch (error) {
    logger.error('Update post error:', error)
    res.status(500).json({ error: 'Failed to update post' })
  }
})

// 게시글 삭제 (인증 필요)
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { id } = req.params

    // 게시글 소유자 확인
    const { data: post } = await supabase
      .from('posts')
      .select('blog_id')
      .eq('id', id)
      .single()

    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }

    const { data: blog } = await supabase
      .from('blogs')
      .select('user_id')
      .eq('id', post.blog_id)
      .single()

    if (!blog || blog.user_id !== user.id) {
      res.status(403).json({ error: 'Not authorized to delete this post' })
      return
    }

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    const { error } = await authClient
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    res.json({ success: true })
  } catch (error) {
    logger.error('Delete post error:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// 좋아요 토글 (인증 필요)
router.post('/:id/like', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!
    const { id } = req.params

    // 1. 이미 좋아요를 눌렀는지 확인
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('posts_id', id)
      .eq('user_id', user.id)
      .single()

    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    let isLiked = false
    let change = 0

    if (existingLike) {
      // 2. 이미 좋아요 상태 -> 좋아요 취소 (삭제)
      const { error: deleteError } = await authClient
        .from('likes')
        .delete()
        .eq('posts_id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      isLiked = false
      change = -1
    } else {
      // 3. 좋아요 안 누름 -> 좋아요 추가 (생성)
      const { error: insertError } = await authClient
        .from('likes')
        .insert({
          posts_id: id,
          user_id: user.id,
          update_at: new Date().toISOString() // 요청사항: update_at (updated_at 아님)
        })

      if (insertError) throw insertError
      isLiked = true
      change = 1
    }

    // 4. 게시글 like_count 업데이트 (RPC 이용 또는 트랜잭션 없이 조회후 업데이트 - 예제 단순화를 위해 직접 fetch & update)
    // 안전한 방법은 rpc('increment_like_count') 등을 쓰는 것이지만, 여기서는 간단히 로직 구현
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', id)
      .single()

    if (fetchError || !post) throw fetchError || new Error('Post not found')

    const newLikeCount = (post.like_count || 0) + change

    await authClient
      .from('posts')
      .update({ like_count: newLikeCount })
      .eq('id', id)

    res.json({ success: true, is_liked: isLiked, like_count: newLikeCount })

  } catch (error: any) {
    logger.error('Toggle like error:', error)
    res.status(500).json({
      error: 'Failed to toggle like',
      details: error.message || error,
      code: error.code
    })
  }
})

export default router
