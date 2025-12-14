'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMarketplaceSkins, downloadSkin, getUserSkinLibrary, BlogSkin } from '@/lib/api/skins'
import Header from '@/components/common/Header'
import Toast from '@/components/common/Toast'
import type { User } from '@supabase/supabase-js'

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
        try {
          const library = await getUserSkinLibrary()
          setDownloadedSkinIds(library.map(item => item.skin_id))
        } catch (err) {
          console.error('Failed to load skin library:', err)
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <Header />

      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden border-b border-black/10 dark:border-white/10">
        {/* 배경 이미지 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/image/skin_marketplace_banner.jpg)',
            filter: 'blur(2px)',
            transform: 'scale(1.05)',
          }}
        />
        {/* 모션 블러 오버레이 */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.8) 100%)',
            backdropFilter: 'blur(1px)',
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
            backdropFilter: 'blur(1px)',
          }}
        />
        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-600/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 via-zinc-100/50 to-transparent dark:from-zinc-950 dark:via-zinc-950/50" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-white md:text-5xl">
            스킨 마켓플레이스
          </h1>
          <p className="mt-4 max-w-xl text-base text-black/60 dark:text-white/60 md:text-lg">
            다양한 스킨으로 블로그를 나만의 스타일로 꾸며보세요.
            <br />
            마음에 드는 스킨을 다운로드하고 바로 적용할 수 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 dark:bg-white/10">
              <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-sm text-black/80 dark:text-white/80">{skins.length}개의 스킨</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 dark:bg-white/10">
              <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-sm text-black/80 dark:text-white/80">무료 다운로드</span>
            </div>
          </div>
        </div>
      </section>

      {/* 스킨 그리드 */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-12">
        {skins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-6 rounded-full bg-black/5 p-6 dark:bg-white/5">
              <svg className="h-12 w-12 text-black/30 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-lg text-black/50 dark:text-white/50">
              마켓플레이스에 등록된 스킨이 없습니다
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {skins.map((skin) => {
              const isDownloaded = downloadedSkinIds.includes(skin.id)
              const isDownloading = downloading === skin.id
              const cssVars = skin.css_variables
              const bgColor = cssVars['--blog-bg'] || '#ffffff'
              const fgColor = cssVars['--blog-fg'] || '#000000'
              const accentColor = cssVars['--blog-accent'] || '#000000'
              const cardBg = cssVars['--blog-card-bg'] || '#ffffff'

              return (
                <div
                  key={skin.id}
                  className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white transition-all hover:shadow-lg dark:border-white/10 dark:bg-zinc-900"
                >
                  {/* 스킨 미리보기 */}
                  <div
                    className="relative aspect-[4/3] cursor-pointer overflow-hidden"
                    onClick={() => setSelectedSkin(skin)}
                    style={{ backgroundColor: bgColor }}
                  >
                    {/* 미니 블로그 UI */}
                    <div className="absolute inset-0 p-4">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between">
                        <div
                          className="h-2 w-16 rounded-full"
                          style={{ backgroundColor: fgColor }}
                        />
                        <div
                          className="h-6 w-16 rounded-md"
                          style={{ backgroundColor: accentColor }}
                        />
                      </div>
                      {/* 카드들 */}
                      <div className="mt-4 space-y-2">
                        <div
                          className="rounded-lg p-3"
                          style={{ backgroundColor: cardBg }}
                        >
                          <div
                            className="h-2 w-24 rounded-full"
                            style={{ backgroundColor: fgColor }}
                          />
                          <div
                            className="mt-2 h-1.5 w-full rounded-full opacity-50"
                            style={{ backgroundColor: fgColor }}
                          />
                          <div
                            className="mt-1 h-1.5 w-3/4 rounded-full opacity-30"
                            style={{ backgroundColor: fgColor }}
                          />
                        </div>
                        <div
                          className="rounded-lg p-3"
                          style={{ backgroundColor: cardBg }}
                        >
                          <div
                            className="h-2 w-20 rounded-full"
                            style={{ backgroundColor: fgColor }}
                          />
                          <div
                            className="mt-2 h-1.5 w-full rounded-full opacity-50"
                            style={{ backgroundColor: fgColor }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 호버 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                        미리보기
                      </span>
                    </div>

                    {/* 보유 중 뱃지 */}
                    {isDownloaded && (
                      <div className="absolute right-3 top-3 rounded-full bg-green-500 px-2.5 py-1 text-xs font-medium text-white shadow-lg">
                        보유 중
                      </div>
                    )}
                  </div>

                  {/* 스킨 정보 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-black dark:text-white">
                          {skin.name}
                        </h3>
                        {skin.description && (
                          <p className="mt-1 text-sm text-black/50 dark:text-white/50 line-clamp-1">
                            {skin.description}
                          </p>
                        )}
                      </div>
                      {isDownloaded ? (
                        <a
                          href="/skins"
                          className="shrink-0 rounded-full bg-black/5 px-4 py-2 text-xs font-medium text-black/70 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                        >
                          적용
                        </a>
                      ) : (
                        <button
                          onClick={() => handleDownloadSkin(skin)}
                          disabled={isDownloading || !user}
                          className="shrink-0 rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                          {isDownloading ? (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            '다운로드'
                          )}
                        </button>
                      )}
                    </div>

                    {/* 컬러 팔레트 */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <div
                        className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: bgColor }}
                        title="배경색"
                      />
                      <div
                        className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: fgColor }}
                        title="텍스트색"
                      />
                      <div
                        className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: accentColor }}
                        title="강조색"
                      />
                      <div
                        className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                        style={{ backgroundColor: cardBg }}
                        title="카드색"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 로그인 안내 */}
        {!user && skins.length > 0 && (
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 p-6 text-center">
            <p className="text-black/80 dark:text-white/80">
              스킨을 다운로드하려면 로그인이 필요합니다
            </p>
            <a
              href="/"
              className="mt-3 inline-block rounded-full bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              로그인하기
            </a>
          </div>
        )}
      </section>

      {/* 미리보기 모달 */}
      {selectedSkin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedSkin(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white">{selectedSkin.name}</h2>
                <p className="text-sm text-black/50 dark:text-white/50">{selectedSkin.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {downloadedSkinIds.includes(selectedSkin.id) ? (
                  <a
                    href="/skins"
                    className="rounded-full bg-black/5 px-5 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/10 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                  >
                    내 스킨에서 적용
                  </a>
                ) : (
                  <button
                    onClick={() => handleDownloadSkin(selectedSkin)}
                    disabled={downloading === selectedSkin.id || !user}
                    className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {downloading === selectedSkin.id ? '다운로드 중...' : '다운로드'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedSkin(null)}
                  className="rounded-full bg-black/5 p-2 text-black/60 transition-colors hover:bg-black/10 hover:text-black dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20 dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 미리보기 영역 */}
            <div
              className="max-h-[calc(90vh-80px)] overflow-y-auto"
              style={{
                backgroundColor: selectedSkin.css_variables['--blog-bg'],
                color: selectedSkin.css_variables['--blog-fg'],
                fontFamily: selectedSkin.css_variables['--blog-font-sans'],
              }}
            >
              {/* 블로그 헤더 */}
              <header
                className="border-b px-6 py-4"
                style={{ borderColor: selectedSkin.css_variables['--blog-border'] }}
              >
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                  <span className="text-lg font-bold">My Blog</span>
                  <div className="flex items-center gap-3">
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
                      className="rounded-lg px-3 py-1.5 text-sm font-medium"
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
                  {/* 프로필 */}
                  <div
                    className="mb-6 p-6"
                    style={{
                      backgroundColor: selectedSkin.css_variables['--blog-card-bg'],
                      borderRadius: selectedSkin.css_variables['--blog-border-radius'],
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="h-16 w-16 rounded-full"
                        style={{ backgroundColor: selectedSkin.css_variables['--blog-accent'] + '30' }}
                      />
                      <div>
                        <h2 className="text-xl font-bold">블로그 이름</h2>
                        <p style={{ color: selectedSkin.css_variables['--blog-muted'] }}>
                          블로그 소개글이 여기에 표시됩니다
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 포스트 목록 */}
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-5"
                        style={{
                          backgroundColor: selectedSkin.css_variables['--blog-card-bg'],
                          borderRadius: selectedSkin.css_variables['--blog-border-radius'],
                        }}
                      >
                        <h3 className="text-lg font-semibold">
                          예시 포스트 제목 {i}
                        </h3>
                        <p
                          className="mt-2 text-sm"
                          style={{ color: selectedSkin.css_variables['--blog-muted'] }}
                        >
                          포스트 내용 미리보기가 여기에 표시됩니다. 이 스킨을 적용하면 블로그가 이렇게 보입니다.
                        </p>
                        <div
                          className="mt-3 text-xs"
                          style={{ color: selectedSkin.css_variables['--blog-muted'] }}
                        >
                          2024년 1월 {i}일
                        </div>
                      </div>
                    ))}
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
