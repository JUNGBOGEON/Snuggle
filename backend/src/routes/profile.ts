import { Router, Response } from 'express'
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js'
import { createAuthenticatedClient } from '../services/supabase.service.js'
import { logger } from '../utils/logger.js'

const router = Router()

// 프로필 동기화 (카카오 프로필 정보를 profiles 테이블에 저장)
router.post('/sync', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)

    // 현재 사용자의 auth 메타데이터 가져오기
    const { data: { user }, error: userError } = await authClient.auth.getUser()

    if (userError || !user) {
      res.status(401).json({ error: 'Failed to get user' })
      return
    }

    const metadata = user.user_metadata
    const profileImageUrl = metadata?.avatar_url || metadata?.picture || null
    const nickname = metadata?.name || metadata?.full_name || null

    // profiles 테이블 업데이트
    const { data, error } = await authClient
      .from('profiles')
      .upsert({
        id: user.id,
        profile_image_url: profileImageUrl,
        nickname: nickname,
      }, {
        onConflict: 'id',
      })
      .select()
      .single()

    if (error) {
      logger.error('Profile sync error:', error)
      res.status(500).json({ error: error.message })
      return
    }

    res.json(data)
  } catch (error) {
    logger.error('Profile sync error:', error)
    res.status(500).json({ error: 'Failed to sync profile' })
  }
})

// 계정 탈퇴 (Soft Delete)
router.delete('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)
    const userId = req.user!.id

    // 1. 프로필이 이미 삭제되었는지 확인
    const { data: profile, error: findError } = await authClient
      .from('profiles')
      .select('id, deleted_at')
      .eq('id', userId)
      .single()

    if (findError || !profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    if (profile.deleted_at) {
      res.status(400).json({ error: 'Account is already deleted' })
      return
    }

    const now = new Date().toISOString()

    // 2. 프로필 soft delete
    const { error: profileError } = await authClient
      .from('profiles')
      .update({ deleted_at: now })
      .eq('id', userId)

    if (profileError) {
      logger.error('Delete account error:', profileError)
      res.status(500).json({ error: 'Failed to delete account' })
      return
    }

    // 3. 해당 사용자의 모든 활성 블로그도 soft delete
    const { error: blogsError } = await authClient
      .from('blogs')
      .update({ deleted_at: now })
      .eq('user_id', userId)
      .is('deleted_at', null)

    if (blogsError) {
      logger.error('Delete user blogs error:', blogsError)
      // 블로그 삭제 실패해도 계정 삭제는 성공으로 처리
    }

    res.json({ success: true, message: 'Account deleted successfully' })
  } catch (error) {
    logger.error('Delete account error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

// 계정 복구
router.patch('/restore', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization!.split(' ')[1]
    const authClient = createAuthenticatedClient(token)
    const userId = req.user!.id

    // 1. 프로필 상태 확인
    const { data: profile, error: findError } = await authClient
      .from('profiles')
      .select('id, deleted_at')
      .eq('id', userId)
      .single()

    if (findError || !profile) {
      res.status(404).json({ error: 'Profile not found' })
      return
    }

    if (!profile.deleted_at) {
      res.status(400).json({ error: 'Account is not deleted' })
      return
    }

    // 2. 프로필 복구 (deleted_at을 null로)
    const { data, error } = await authClient
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      logger.error('Restore account error:', error)
      res.status(500).json({ error: 'Failed to restore account' })
      return
    }

    // 블로그는 별도로 휴지통에서 복구하도록 안내
    res.json({
      ...data,
      message: 'Account restored. Please restore your blogs from the trash if needed.'
    })
  } catch (error) {
    logger.error('Restore account error:', error)
    res.status(500).json({ error: 'Failed to restore account' })
  }
})

export default router
