'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMarketplaceSkins, downloadSkin, getUserSkinLibrary, BlogSkin } from '@/lib/api/skins'
import Header from '@/components/common/Header'
import Toast from '@/components/common/Toast'
import type { User } from '@supabase/supabase-js'

interface Blog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

interface Post {
  id: string
  title: string
  content: string
  created_at: string
}

interface Profile {
  id: string
  nickname: string | null
  profile_image_url: string | null
}

function SkinCard({
  skin,
  isOwned,
  isDownloading,
  user,
  onPreview,
  onDownload,
}: {
  skin: BlogSkin
  isOwned: boolean
  isDownloading: boolean
  user: User | null
  onPreview: () => void
  onDownload: () => void
}) {
  const cssVars = skin.css_variables
  const bgColor = cssVars['--blog-bg'] || '#ffffff'
  const fgColor = cssVars['--blog-fg'] || '#000000'
  const accentColor = cssVars['--blog-accent'] || '#000000'
  const cardBg = cssVars['--blog-card-bg'] || '#ffffff'
  const mutedColor = cssVars['--blog-muted'] || '#666666'

  return (
    <div className="group relative">
      {/* 스킨 프리뷰 */}
      <div
        className="relative aspect-[16/10] cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:ring-black/10 dark:ring-white/10 dark:group-hover:ring-white/20"
        onClick={onPreview}
        style={{ backgroundColor: bgColor }}
      >
        {/* 미니 블로그 레이아웃 */}
        <div className="absolute inset-0 p-5">
          {/* 상단 네비게이션 */}
          <div className="flex items-center justify-between">
            <div
              className="h-2.5 w-20 rounded-full"
              style={{ backgroundColor: fgColor }}
            />
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-8 rounded-full opacity-50"
                style={{ backgroundColor: fgColor }}
              />
              <div
                className="h-2 w-8 rounded-full opacity-50"
                style={{ backgroundColor: fgColor }}
              />
              <div
                className="h-6 w-14 rounded-md"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>

          {/* 본문 영역 */}
          <div className="mt-5 flex gap-4">
            {/* 사이드바 */}
            <div
              className="w-24 shrink-0 rounded-lg p-3"
              style={{ backgroundColor: cardBg }}
            >
              <div
                className="mx-auto h-10 w-10 rounded-full"
                style={{ backgroundColor: accentColor + '40' }}
              />
              <div
                className="mx-auto mt-2 h-2 w-14 rounded-full"
                style={{ backgroundColor: fgColor }}
              />
              <div
                className="mx-auto mt-1 h-1.5 w-12 rounded-full opacity-40"
                style={{ backgroundColor: mutedColor }}
              />
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 space-y-2">
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: cardBg }}
              >
                <div
                  className="h-2.5 w-28 rounded-full"
                  style={{ backgroundColor: fgColor }}
                />
                <div
                  className="mt-2 h-1.5 w-full rounded-full opacity-40"
                  style={{ backgroundColor: mutedColor }}
                />
                <div
                  className="mt-1 h-1.5 w-4/5 rounded-full opacity-40"
                  style={{ backgroundColor: mutedColor }}
                />
              </div>
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: cardBg }}
              >
                <div
                  className="h-2.5 w-24 rounded-full"
                  style={{ backgroundColor: fgColor }}
                />
                <div
                  className="mt-2 h-1.5 w-full rounded-full opacity-40"
                  style={{ backgroundColor: mutedColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}
            className="flex translate-y-2 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black opacity-0 shadow-lg transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 hover:bg-zinc-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            미리보기
          </button>
          {!isOwned && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}
              disabled={isDownloading || !user}
              className="flex translate-y-2 items-center gap-2 rounded-full bg-white/20 px-5 py-2.5 text-sm font-medium text-white opacity-0 backdrop-blur-sm transition-all delay-75 duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 hover:bg-white/30 disabled:opacity-50"
            >
              {isDownloading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {isDownloading ? '추가 중...' : '라이브러리에 추가'}
            </button>
          )}
        </div>

        {/* 보유 표시 */}
        {isOwned && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            보유 중
          </div>
        )}
      </div>

      {/* 스킨 정보 */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-black dark:text-white">
            {skin.name}
          </h3>
          {skin.description && (
            <p className="mt-0.5 truncate text-sm text-black/50 dark:text-white/50">
              {skin.description}
            </p>
          )}
        </div>
        {/* 컬러 팔레트 */}
        <div className="flex shrink-0 items-center gap-1">
          {[bgColor, fgColor, accentColor, cardBg].map((color, i) => (
            <div
              key={i}
              className="h-5 w-5 rounded-full ring-1 ring-black/10 dark:ring-white/10"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// HTML에서 텍스트만 추출
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').slice(0, 100)
}

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null)
  const [skins, setSkins] = useState<BlogSkin[]>([])
  const [downloadedSkinIds, setDownloadedSkinIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedSkin, setSelectedSkin] = useState<BlogSkin | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  // 유저 블로그 데이터
  const [userBlog, setUserBlog] = useState<Blog | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [userProfile, setUserProfile] = useState<Profile | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        try {
          const library = await getUserSkinLibrary()
          setDownloadedSkinIds(library.map(item => item.skin_id))
        } catch (err) {
          console.error('Failed to load skin library:', err)
        }

        // 유저 블로그 정보 가져오기
        try {
          const { data: blog } = await supabase
            .from('blogs')
            .select('id, name, description, thumbnail_url')
            .eq('user_id', user.id)
            .single()

          if (blog) {
            setUserBlog(blog)

            // 블로그 포스트 가져오기
            const { data: posts } = await supabase
              .from('posts')
              .select('id, title, content, created_at')
              .eq('blog_id', blog.id)
              .eq('published', true)
              .order('created_at', { ascending: false })
              .limit(4)

            setUserPosts(posts || [])
          }

          // 프로필 정보
          const response = await fetch(`${API_URL}/api/blogs/${user.id}`)
          if (response.ok) {
            const blogData = await response.json()
            setUserProfile(blogData.profile)
          }
        } catch (err) {
          console.error('Failed to load user blog:', err)
        }
      }

      try {
        const skinsData = await getMarketplaceSkins()
        setSkins(skinsData)
      } catch (err) {
        console.error('Failed to load marketplace skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleDownloadSkin = async (skin: BlogSkin) => {
    if (!user) {
      showToast('로그인이 필요합니다', 'error')
      return
    }

    setDownloading(skin.id)
    try {
      await downloadSkin(skin.id)
      setDownloadedSkinIds(prev => [...prev, skin.id])
      showToast(`'${skin.name}' 스킨이 라이브러리에 추가되었습니다!`, 'success')
    } catch (err) {
      showToast('스킨 다운로드에 실패했습니다', 'error')
    } finally {
      setDownloading(null)
    }
  }

  const systemSkins = skins.filter(s => s.is_system)
  const userSkins = skins.filter(s => !s.is_system)

  // 미리보기용 데이터
  const previewBlogName = userBlog?.name || '내 블로그'
  const previewBlogDesc = userBlog?.description || '블로그 소개글'
  const previewPosts = userPosts.length > 0 ? userPosts : [
    { id: '1', title: '첫 번째 포스트', content: '포스트 내용이 여기에 표시됩니다.', created_at: new Date().toISOString() },
    { id: '2', title: '두 번째 포스트', content: '스킨을 적용하면 블로그가 이렇게 보입니다.', created_at: new Date().toISOString() },
    { id: '3', title: '세 번째 포스트', content: '다양한 색상과 스타일을 확인해보세요.', created_at: new Date().toISOString() },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {/* 히어로 */}
      <section className="relative overflow-hidden border-b border-black/5 dark:border-white/5">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/image/skin_marketplace_banner.jpg)',
            transform: 'scale(1.05)',
          }}
        />
        {/* 왼쪽 → 오른쪽 모션블러 */}
        <div
          className="absolute inset-0"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            maskImage: 'linear-gradient(90deg, black 0%, black 40%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 40%, transparent 80%)',
          }}
        />
        {/* 라이트 모드 오버레이 */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.25) 100%)',
          }}
        />
        {/* 다크 모드 오버레이 */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)',
          }}
        />
        {/* 하단 페이드 */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-black" />

        <div className="relative mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white md:text-4xl">
            스킨 마켓플레이스
          </h1>
          <p className="mt-3 max-w-lg text-black/60 dark:text-white/60">
            블로그에 적용할 수 있는 다양한 스킨을 둘러보세요. 마음에 드는 스킨을 라이브러리에 추가하고 언제든 적용할 수 있습니다.
          </p>
          <div className="mt-6 flex items-center gap-4 text-sm">
            <span className="text-black/40 dark:text-white/40">
              {skins.length}개의 스킨
            </span>
            {user && downloadedSkinIds.length > 0 && (
              <>
                <span className="text-black/20 dark:text-white/20">•</span>
                <a href="/skins" className="text-black/60 underline-offset-4 hover:underline dark:text-white/60">
                  내 라이브러리 ({downloadedSkinIds.length})
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 스킨 목록 */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        {skins.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-black/40 dark:text-white/40">
              아직 등록된 스킨이 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* 기본 제공 */}
            {systemSkins.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-black dark:text-white">기본 제공</h2>
                  <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
                    {systemSkins.length}
                  </span>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {systemSkins.map((skin) => (
                    <SkinCard
                      key={skin.id}
                      skin={skin}
                      isOwned={downloadedSkinIds.includes(skin.id)}
                      isDownloading={downloading === skin.id}
                      user={user}
                      onPreview={() => setSelectedSkin(skin)}
                      onDownload={() => handleDownloadSkin(skin)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 커뮤니티 */}
            {userSkins.length > 0 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-black dark:text-white">커뮤니티</h2>
                  <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs text-black/50 dark:bg-white/10 dark:text-white/50">
                    {userSkins.length}
                  </span>
                </div>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {userSkins.map((skin) => (
                    <SkinCard
                      key={skin.id}
                      skin={skin}
                      isOwned={downloadedSkinIds.includes(skin.id)}
                      isDownloading={downloading === skin.id}
                      user={user}
                      onPreview={() => setSelectedSkin(skin)}
                      onDownload={() => handleDownloadSkin(skin)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 로그인 안내 */}
      {!user && skins.length > 0 && (
        <section className="border-t border-black/5 bg-zinc-50 dark:border-white/5 dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-6 py-12 text-center">
            <p className="text-black/60 dark:text-white/60">
              스킨을 라이브러리에 추가하려면 로그인이 필요합니다
            </p>
            <a
              href="/"
              className="mt-4 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              로그인
            </a>
          </div>
        </section>
      )}

      {/* 미리보기 모달 */}
      {selectedSkin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedSkin(null)}
        >
          <div
            className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-black dark:text-white">{selectedSkin.name}</h2>
                  {selectedSkin.description && (
                    <p className="text-sm text-black/50 dark:text-white/50">{selectedSkin.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {userBlog && (
                  <span className="text-xs text-black/40 dark:text-white/40">
                    내 블로그로 미리보기
                  </span>
                )}
                {downloadedSkinIds.includes(selectedSkin.id) ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      라이브러리에 있음
                    </span>
                    <a
                      href="/skins"
                      className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                      적용하러 가기
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownloadSkin(selectedSkin)}
                    disabled={downloading === selectedSkin.id || !user}
                    className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {downloading === selectedSkin.id ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        추가 중...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        라이브러리에 추가
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setSelectedSkin(null)}
                  className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 미리보기 영역 */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                backgroundColor: selectedSkin.css_variables['--blog-bg'],
                color: selectedSkin.css_variables['--blog-fg'],
              }}
            >
              {/* 블로그 헤더 */}
              <header
                className="sticky top-0 z-10 border-b px-6 py-4"
                style={{
                  borderColor: selectedSkin.css_variables['--blog-border'],
                  backgroundColor: selectedSkin.css_variables['--blog-bg'],
                }}
              >
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                  <span className="text-lg font-bold">{previewBlogName}</span>
                  <div className="flex items-center gap-4">
                    <span
                      className="text-sm"
                      style={{ color: selectedSkin.css_variables['--blog-muted'] }}
                    >
                      홈
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: selectedSkin.css_variables['--blog-muted'] }}
                    >
                      소개
                    </span>
                    <button
                      className="rounded-lg px-4 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: selectedSkin.css_variables['--blog-accent'],
                        color: selectedSkin.css_variables['--blog-bg'],
                      }}
                    >
                      새 글 작성
                    </button>
                  </div>
                </div>
              </header>

              {/* 블로그 본문 */}
              <div className="p-6">
                <div className="mx-auto max-w-4xl">
                  <div className="flex gap-8">
                    {/* 사이드바 */}
                    <div className="w-64 shrink-0">
                      <div
                        className="sticky top-24 p-6"
                        style={{
                          backgroundColor: selectedSkin.css_variables['--blog-card-bg'],
                          borderRadius: selectedSkin.css_variables['--blog-border-radius'],
                        }}
                      >
                        {userProfile?.profile_image_url ? (
                          <img
                            src={userProfile.profile_image_url}
                            alt="프로필"
                            className="mx-auto h-20 w-20 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="mx-auto h-20 w-20 rounded-full"
                            style={{ backgroundColor: selectedSkin.css_variables['--blog-accent'] + '30' }}
                          />
                        )}
                        <h2 className="mt-4 text-center text-lg font-bold">{previewBlogName}</h2>
                        <p
                          className="mt-1 text-center text-sm"
                          style={{ color: selectedSkin.css_variables['--blog-muted'] }}
                        >
                          {previewBlogDesc}
                        </p>
                        <div
                          className="mt-4 border-t pt-4"
                          style={{ borderColor: selectedSkin.css_variables['--blog-border'] }}
                        >
                          <div className="text-center text-sm">
                            <span style={{ color: selectedSkin.css_variables['--blog-muted'] }}>게시글</span>
                            <span className="ml-2 font-semibold">{previewPosts.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 포스트 목록 */}
                    <div className="flex-1 space-y-4">
                      {previewPosts.map((post) => (
                        <article
                          key={post.id}
                          className="p-5"
                          style={{
                            backgroundColor: selectedSkin.css_variables['--blog-card-bg'],
                            borderRadius: selectedSkin.css_variables['--blog-border-radius'],
                          }}
                        >
                          <h3 className="text-lg font-semibold">
                            {post.title}
                          </h3>
                          <p
                            className="mt-2 text-sm leading-relaxed"
                            style={{ color: selectedSkin.css_variables['--blog-muted'] }}
                          >
                            {stripHtml(post.content)}...
                          </p>
                          <div
                            className="mt-4 text-xs"
                            style={{ color: selectedSkin.css_variables['--blog-muted'] }}
                          >
                            {new Date(post.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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
