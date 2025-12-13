'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSystemSkins, applySkin, BlogSkin } from '@/lib/api/skins'
import SkinCard from '@/components/skin/SkinCard'
import Toast from '@/components/common/Toast'
import type { User } from '@supabase/supabase-js'

interface Blog {
  id: string
  name: string
}

export default function SkinsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userBlog, setUserBlog] = useState<Blog | null>(null)
  const [skins, setSkins] = useState<BlogSkin[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [previewSkin, setPreviewSkin] = useState<BlogSkin | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // 현재 사용자
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // 사용자의 블로그
      if (user) {
        const { data: blogData } = await supabase
          .from('blogs')
          .select('id, name')
          .eq('user_id', user.id)
          .single()

        if (blogData) {
          setUserBlog(blogData)
        }
      }

      // 시스템 스킨 목록
      try {
        const skinsData = await getSystemSkins()
        setSkins(skinsData)
      } catch (err) {
        console.error('Failed to load skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleApplySkin = async (skinId: string) => {
    if (!user) {
      showToast('로그인이 필요합니다', 'error')
      return
    }

    if (!userBlog) {
      showToast('블로그를 먼저 만들어주세요', 'error')
      return
    }

    setApplying(true)
    try {
      await applySkin(userBlog.id, skinId)
      showToast('스킨이 적용되었습니다!', 'success')
    } catch (err) {
      showToast('스킨 적용에 실패했습니다', 'error')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* 헤더 */}
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="text-lg font-bold text-black dark:text-white">
            Snuggle
          </a>
          <nav className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm font-medium text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              홈
            </a>
            <span className="text-sm font-medium text-black dark:text-white">
              스킨
            </span>
          </nav>
        </div>
      </header>

      {/* 메인 */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* 타이틀 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            블로그 스킨
          </h1>
          <p className="mt-3 text-black/60 dark:text-white/60">
            블로그에 어울리는 스킨을 선택하세요
          </p>
        </div>

        {/* 로그인 안내 */}
        {!user && (
          <div className="mt-8 rounded-xl border border-black/10 bg-black/5 p-6 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-black/70 dark:text-white/70">
              스킨을 적용하려면 로그인이 필요합니다
            </p>
            <a
              href="/"
              className="mt-3 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              로그인하러 가기
            </a>
          </div>
        )}

        {/* 블로그 없음 안내 */}
        {user && !userBlog && (
          <div className="mt-8 rounded-xl border border-black/10 bg-black/5 p-6 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-black/70 dark:text-white/70">
              스킨을 적용하려면 블로그를 먼저 만들어주세요
            </p>
            <a
              href="/create-blog"
              className="mt-3 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
            >
              블로그 만들기
            </a>
          </div>
        )}

        {/* 스킨 그리드 */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {skins.map((skin) => (
            <SkinCard
              key={skin.id}
              skin={skin}
              onSelect={() => handleApplySkin(skin.id)}
              onPreview={() => setPreviewSkin(skin)}
            />
          ))}
        </div>

        {skins.length === 0 && (
          <div className="mt-12 text-center text-black/50 dark:text-white/50">
            사용 가능한 스킨이 없습니다
          </div>
        )}
      </main>

      {/* 미리보기 모달 */}
      {previewSkin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
          onClick={() => setPreviewSkin(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-black/10 p-4 dark:border-white/10">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                {previewSkin.name} 미리보기
              </h2>
              <button
                onClick={() => setPreviewSkin(null)}
                className="rounded-lg p-2 text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 미리보기 컨텐츠 */}
            <div
              className="p-8"
              style={{
                backgroundColor: previewSkin.css_variables['--blog-bg'],
                color: previewSkin.css_variables['--blog-fg'],
                fontFamily: previewSkin.css_variables['--blog-font-sans'],
              }}
            >
              {/* 샘플 헤더 */}
              <div
                className="flex items-center justify-between border-b pb-4"
                style={{ borderColor: previewSkin.css_variables['--blog-border'] }}
              >
                <span className="text-xl font-bold">Sample Blog</span>
                <button
                  className="rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: previewSkin.css_variables['--blog-accent'],
                    color: previewSkin.css_variables['--blog-bg'],
                  }}
                >
                  새 글 작성
                </button>
              </div>

              {/* 샘플 포스트 */}
              <div className="mt-6 space-y-4">
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: previewSkin.css_variables['--blog-card-bg'] }}
                >
                  <h3 className="text-lg font-semibold">첫 번째 블로그 포스트</h3>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: previewSkin.css_variables['--blog-muted'] }}
                  >
                    이것은 샘플 포스트입니다. 이 스킨이 블로그에 어떻게 보이는지 미리 확인해보세요.
                  </p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: previewSkin.css_variables['--blog-card-bg'] }}
                >
                  <h3 className="text-lg font-semibold">두 번째 블로그 포스트</h3>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: previewSkin.css_variables['--blog-muted'] }}
                  >
                    다양한 스킨을 적용하여 블로그의 분위기를 바꿔보세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end gap-3 border-t border-black/10 p-4 dark:border-white/10">
              <button
                onClick={() => setPreviewSkin(null)}
                className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              >
                닫기
              </button>
              {userBlog && (
                <button
                  onClick={() => {
                    handleApplySkin(previewSkin.id)
                    setPreviewSkin(null)
                  }}
                  disabled={applying}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {applying ? '적용 중...' : '이 스킨 적용하기'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  )
}
