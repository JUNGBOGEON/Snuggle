'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAvailableSkins, applySkin, getBlogSkin, BlogSkin } from '@/lib/api/skins'
import { getBlogPosts, Post } from '@/lib/api/posts'
import Toast from '@/components/common/Toast'
import PreviewBlogLayout from '@/components/skin/PreviewBlogLayout'
import PreviewSidebar from '@/components/skin/PreviewSidebar'
import PreviewPostList from '@/components/skin/PreviewPostList'
import type { User } from '@supabase/supabase-js'

interface Blog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

interface Profile {
  id: string
  nickname: string | null
  profile_image_url: string | null
}

export default function SkinsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userBlog, setUserBlog] = useState<Blog | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [blogPosts, setBlogPosts] = useState<Post[]>([])
  const [skins, setSkins] = useState<BlogSkin[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [selectedSkin, setSelectedSkin] = useState<BlogSkin | null>(null)
  const [appliedSkinId, setAppliedSkinId] = useState<string | null>(null)
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

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: blogData } = await supabase
          .from('blogs')
          .select('id, name, description, thumbnail_url')
          .eq('user_id', user.id)
          .single()

        if (blogData) {
          setUserBlog(blogData)

          try {
            const posts = await getBlogPosts(blogData.id, false)
            setBlogPosts(posts.slice(0, 5))
          } catch (err) {
            console.error('Failed to load posts:', err)
          }

          // 현재 적용된 스킨 확인
          try {
            const skinApplication = await getBlogSkin(blogData.id)
            if (skinApplication?.skin_id) {
              setAppliedSkinId(skinApplication.skin_id)
            }
          } catch (err) {
            console.error('Failed to load applied skin:', err)
          }
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, nickname, profile_image_url')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
        }
      }

      // 사용 가능한 스킨 조회 (기본 + 다운로드한 스킨)
      try {
        const skinsData = await getAvailableSkins()
        setSkins(skinsData)
        if (skinsData.length > 0) {
          setSelectedSkin(skinsData[0])
        }
      } catch (err) {
        console.error('Failed to load skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleApplySkin = async () => {
    if (!selectedSkin) return

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
      await applySkin(userBlog.id, selectedSkin.id)
      setAppliedSkinId(selectedSkin.id)
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

  const cssVars = selectedSkin?.css_variables
  const layout = selectedSkin?.layout_config?.layout || 'sidebar-right'
  const displayImage = userBlog?.thumbnail_url || profile?.profile_image_url

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      {/* 헤더 */}
      <header className="shrink-0 border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <a href="/" className="text-lg font-bold text-black dark:text-white">
            Snuggle
          </a>
          <nav className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              홈
            </a>
            <span className="text-sm font-medium text-black dark:text-white">
              내 스킨
            </span>
            <a
              href="/marketplace"
              className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            >
              마켓플레이스
            </a>
          </nav>
        </div>
      </header>

      {/* 메인 - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 스킨 목록 */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-black/10 bg-white dark:border-white/10 dark:bg-black">
          <div className="sticky top-0 z-10 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/5 dark:bg-black/80">
            <h2 className="text-sm font-semibold text-black dark:text-white">
              내 스킨
            </h2>
            <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
              {skins.length}개의 스킨
            </p>
          </div>

          <div className="p-3 space-y-2">
            {skins.map((skin) => {
              const isSelected = selectedSkin?.id === skin.id
              const isApplied = appliedSkinId === skin.id
              const bgColor = skin.css_variables['--blog-bg'] || '#ffffff'
              const fgColor = skin.css_variables['--blog-fg'] || '#000000'
              const accentColor = skin.css_variables['--blog-accent'] || '#000000'

              return (
                <button
                  key={skin.id}
                  onClick={() => setSelectedSkin(skin)}
                  className={`w-full text-left rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/10'
                      : 'border-transparent hover:border-black/20 dark:hover:border-white/20'
                  }`}
                >
                  {/* 컬러 프리뷰 */}
                  <div
                    className="relative h-20 rounded-t-lg p-3"
                    style={{ backgroundColor: bgColor }}
                  >
                    {/* 적용됨 뱃지 */}
                    {isApplied && (
                      <div className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-medium text-white">
                        적용됨
                      </div>
                    )}
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-10 rounded-full"
                          style={{ backgroundColor: fgColor }}
                        />
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-1.5 w-16 rounded-full"
                          style={{ backgroundColor: fgColor, opacity: 0.5 }}
                        />
                        <div
                          className="h-1.5 w-12 rounded-full"
                          style={{ backgroundColor: fgColor, opacity: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 스킨 정보 */}
                  <div className="rounded-b-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-black dark:text-white">
                        {skin.name}
                      </span>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black dark:bg-white">
                          <svg className="h-3 w-3 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {skin.description && (
                      <p className="mt-0.5 text-xs text-black/50 dark:text-white/50 line-clamp-1">
                        {skin.description}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* 마켓플레이스 안내 */}
          <div className="mx-3 mb-3 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
            <p className="text-sm text-black/70 dark:text-white/70">
              더 많은 스킨을 찾고 있나요?
            </p>
            <a
              href="/marketplace"
              className="mt-2 inline-block text-sm font-medium text-black hover:underline dark:text-white"
            >
              마켓플레이스 방문하기 →
            </a>
          </div>

          {/* 로그인/블로그 안내 */}
          {!user && (
            <div className="mx-3 mb-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                스킨을 적용하려면 로그인이 필요합니다
              </p>
              <a
                href="/"
                className="mt-2 inline-block text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
              >
                로그인하기 →
              </a>
            </div>
          )}

          {user && !userBlog && (
            <div className="mx-3 mb-3 rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                블로그를 먼저 만들어주세요
              </p>
              <a
                href="/create-blog"
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                블로그 만들기 →
              </a>
            </div>
          )}
        </aside>

        {/* 오른쪽: 미리보기 */}
        <main className="flex-1 overflow-y-auto">
          {selectedSkin && cssVars ? (
            <div className="h-full flex flex-col">
              {/* 미리보기 컨트롤 바 */}
              <div className="shrink-0 flex items-center justify-between border-b border-black/10 bg-white px-6 py-3 dark:border-white/10 dark:bg-black">
                <div>
                  <h1 className="text-lg font-bold text-black dark:text-white">
                    {selectedSkin.name}
                  </h1>
                  <p className="text-sm text-black/50 dark:text-white/50">
                    {selectedSkin.description || '미리보기'}
                  </p>
                </div>
                {appliedSkinId === selectedSkin.id ? (
                  <span className="rounded-lg bg-black/10 px-5 py-2 text-sm font-medium text-black/50 dark:bg-white/10 dark:text-white/50">
                    적용됨
                  </span>
                ) : (
                  <button
                    onClick={handleApplySkin}
                    disabled={applying || !user || !userBlog}
                    className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
                  >
                    {applying ? '적용 중...' : '이 스킨 적용하기'}
                  </button>
                )}
              </div>

              {/* 미리보기 영역 */}
              <div
                className="flex-1 overflow-y-auto flex flex-col"
                style={{
                  backgroundColor: cssVars['--blog-bg'],
                  color: cssVars['--blog-fg'],
                  fontFamily: cssVars['--blog-font-sans'],
                }}
              >
                {/* 블로그 헤더 */}
                <header
                  className="shrink-0 border-b px-6 py-4"
                  style={{ borderColor: cssVars['--blog-border'] }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">Snuggle</span>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm"
                        style={{ color: cssVars['--blog-muted'] }}
                      >
                        홈
                      </span>
                      <button
                        className="rounded-lg px-3 py-1.5 text-sm font-medium"
                        style={{
                          backgroundColor: cssVars['--blog-accent'],
                          color: cssVars['--blog-bg'],
                        }}
                      >
                        새 글 작성
                      </button>
                    </div>
                  </div>
                </header>

                {/* 블로그 본문 - 레이아웃 컴포넌트 사용 */}
                <PreviewBlogLayout
                  layout={layout}
                  cssVars={cssVars}
                  sidebar={
                    <PreviewSidebar
                      cssVars={cssVars}
                      blogName={userBlog?.name}
                      blogDescription={userBlog?.description}
                      displayImage={displayImage}
                      postCount={blogPosts.length}
                    />
                  }
                >
                  <PreviewPostList cssVars={cssVars} posts={blogPosts} />
                </PreviewBlogLayout>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-black/50 dark:text-white/50">
                스킨을 선택해주세요
              </p>
            </div>
          )}
        </main>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  )
}
