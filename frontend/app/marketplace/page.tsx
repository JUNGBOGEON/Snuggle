'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import {
  getMarketplaceSkins,
  downloadSkin,
  getUserSkinLibrary,
  getCustomSkin,
  saveCustomSkin,
  toggleCustomSkin,
  getDefaultTemplates,
  publishSkin,
  getPublicSkins,
  downloadPublishedSkin,
  PublishedSkin,
  BlogSkin,
  BlogCustomSkin,
  CustomSkinUpdateData,
  TEMPLATE_VARIABLES,
} from '@/lib/api/skins'
import { getVisitorCount } from '@/lib/api/blogs'
import { renderTemplate, TemplateContext } from '@/lib/utils/templateRenderer'
import { sanitizeHTML, scopeCSS, formatPreviewDate } from '@/lib/utils/sanitize'
import Toast from '@/components/common/Toast'
import AIChatPanel from '@/components/skin/AIChatPanel'
import { TEMPLATE_SECTIONS } from './_constants/templateSections'
import type { User } from '@supabase/supabase-js'
import type { Blog, PreviewPost, PreviewCategory, TabType, TemplateKey } from '@/types/skin'

// Monaco Editor 동적 로드 (SSR 비활성화)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export default function MarketplacePage() {
  const [user, setUser] = useState<User | null>(null)
  const [userBlog, setUserBlog] = useState<Blog | null>(null)
  const [skins, setSkins] = useState<BlogSkin[]>([])
  const [publishedSkins, setPublishedSkins] = useState<PublishedSkin[]>([])
  const [downloadedSkinIds, setDownloadedSkinIds] = useState<string[]>([])
  const [downloadedPublishedIds, setDownloadedPublishedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedSkin, setSelectedSkin] = useState<BlogSkin | null>(null)
  const [selectedPublishedSkin, setSelectedPublishedSkin] = useState<PublishedSkin | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 커스텀 스킨 에디터 뷰 상태
  const [showEditor, setShowEditor] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 리사이즈 상태
  const [editorWidth, setEditorWidth] = useState(50) // 퍼센트
  const [isResizing, setIsResizing] = useState(false)


  // 미리보기용 실제 데이터
  const [previewPosts, setPreviewPosts] = useState<PreviewPost[]>([])
  const [previewCategories, setPreviewCategories] = useState<PreviewCategory[]>([])
  const [subscriberCount, setSubscriberCount] = useState(0)
  const [visitorCount, setVisitorCount] = useState(0)

  // 커스텀 스킨 에디터 상태
  const [customSkin, setCustomSkin] = useState<BlogCustomSkin | null>(null)
  const [editedData, setEditedData] = useState<CustomSkinUpdateData>({})
  const [activeSection, setActiveSection] = useState<TemplateKey>('html_template')
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  // 배포 모달 상태
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [deployData, setDeployData] = useState({
    name: '',
    description: '',
    is_public: false,
  })
  const [deploying, setDeploying] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
  }

  // 통합 기본 HTML 템플릿 생성 헬퍼 (CSS Grid 레이아웃용)
  const getDefaultCombinedTemplate = () => {
    const defaults = getDefaultTemplates()
    // CSS Grid가 레이아웃을 처리하므로 요소들을 직접 나열
    const combinedHtml = `${defaults.html_header}
${defaults.html_post_list}
${defaults.html_sidebar}
${defaults.html_footer}`
    return {
      html_template: combinedHtml,
      custom_css: defaults.custom_css,
      is_active: false,
    }
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

          // 사용자 블로그 조회
          const { data: blogs } = await supabase
            .from('blogs')
            .select('id, name, description, thumbnail_url')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)

          if (blogs && blogs.length > 0) {
            const blog = blogs[0]
            setUserBlog(blog)

            // 커스텀 스킨 조회 (없으면 기본값으로 자동 생성)
            try {
              let skin = await getCustomSkin(blog.id)
              const defaults = getDefaultTemplates()

              if (!skin) {
                // 기본 템플릿으로 커스텀 스킨 생성 (미리보기가 작동하도록)
                skin = await saveCustomSkin(blog.id, defaults)
              } else if (skin.use_default_header || skin.use_default_sidebar || skin.use_default_footer || !skin.custom_css) {
                // 구 버전 스킨 마이그레이션: use_default_* 플래그가 true이거나 CSS가 없으면 새 기본값으로 업데이트
                skin = await saveCustomSkin(blog.id, {
                  ...defaults,
                  is_active: skin.is_active, // 기존 활성화 상태 유지
                })
              }

              setCustomSkin(skin)
              // 기존 개별 섹션들을 하나의 html_template으로 병합
              // CSS Grid 레이아웃을 위해 요소들을 래퍼 없이 직접 나열
              const defaultCombined = getDefaultCombinedTemplate()

              let mergedHtml = ''

              // 통합 모드 감지: html_header에만 내용이 있고 다른 섹션들이 비어있으면 통합 모드
              const isUnifiedMode = skin.html_header && !skin.html_post_list && !skin.html_sidebar && !skin.html_footer

              if (isUnifiedMode) {
                // 통합 모드: html_header를 그대로 사용
                mergedHtml = skin.html_header
              } else if (skin.html_header || skin.html_post_list || skin.html_sidebar) {
                // 개별 섹션 모드: 요소들을 직접 나열 (CSS Grid가 레이아웃 처리)
                mergedHtml = `${skin.html_header || ''}
${skin.html_post_list || ''}
${skin.html_sidebar || ''}
${skin.html_footer || ''}`
              }

              const finalCss = skin.custom_css || defaultCombined.custom_css

              setEditedData({
                html_template: mergedHtml || defaultCombined.html_template,
                custom_css: finalCss,
                is_active: skin.is_active,
              })
            } catch (err) {
              console.error('Failed to load custom skin:', err)
              setEditedData(getDefaultCombinedTemplate())
            }

            // 미리보기용 실제 데이터 조회
            console.log('[Marketplace] Fetching preview data for blog:', blog.id, 'user_id:', user.id)

            // 블로그 게시글 조회 (excerpt 컬럼이 없으므로 content 사용)
            const { data: postsData, count: postCount, error: postsError } = await supabase
              .from('posts')
              .select('id, title, content, thumbnail_url, created_at, view_count, like_count, blog_id', { count: 'exact' })
              .eq('blog_id', blog.id)
              .order('created_at', { ascending: false })
              .limit(10)

            console.log('[Marketplace] Posts query result:', { postsData, postCount, postsError })

            if (postsError) {
              console.error('Failed to load posts:', postsError)
            }

            if (postsData) {
              const transformedPosts: PreviewPost[] = postsData.map((p) => ({
                id: p.id,
                title: p.title,
                content: p.content,
                // excerpt가 없으므로 content에서 첫 100자 추출
                excerpt: p.content ? p.content.replace(/<[^>]*>/g, '').substring(0, 100) : '',
                thumbnail_url: p.thumbnail_url,
                created_at: p.created_at,
                view_count: p.view_count,
                like_count: p.like_count,
                blog_id: p.blog_id,
              }))
              setPreviewPosts(transformedPosts)
              console.log('[Marketplace] Set previewPosts:', transformedPosts.length)
            }

            // 카테고리 조회
            const { data: categoriesData, error: categoriesError } = await supabase
              .from('categories')
              .select('id, name')
              .eq('blog_id', blog.id)
              .order('name')

            console.log('[Marketplace] Categories query result:', { categoriesData, categoriesError })

            if (categoriesData) {
              setPreviewCategories(categoriesData)
            }

            // 구독자 수 조회 (subscribe 테이블, subed_id = user_id 사용)
            const { count: subCount, error: subError } = await supabase
              .from('subscribe')
              .select('*', { count: 'exact', head: true })
              .eq('subed_id', user.id)

            console.log('[Marketplace] Subscribe query result:', { subCount, subError })
            setSubscriberCount(subCount || 0)

            // 방문자 수 조회 (API 함수 사용)
            try {
              const visitorData = await getVisitorCount(blog.id)
              console.log('[Marketplace] Visitor count result:', visitorData)
              setVisitorCount(visitorData.today)
            } catch (visitError) {
              console.error('[Marketplace] Failed to load visitor count:', visitError)
              setVisitorCount(0)
            }
          }
        } catch (err) {
          console.error('Failed to load data:', err)
        }
      }

      try {
        const skinsData = await getMarketplaceSkins()
        setSkins(skinsData)
      } catch (err) {
        console.error('Failed to load marketplace skins:', err)
      }

      // 공개 커뮤니티 스킨 조회
      try {
        const publicSkinsData = await getPublicSkins()
        setPublishedSkins(publicSkinsData)
      } catch (err) {
        console.error('Failed to load public skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // 공식 스킨 필터링
  const filteredOfficialSkins = useMemo(() => {
    let result = skins.filter(skin => skin.is_system)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(skin =>
        skin.name.toLowerCase().includes(query) ||
        skin.description?.toLowerCase().includes(query)
      )
    }
    return result
  }, [skins, searchQuery])

  // 커뮤니티 스킨 필터링 (배포된 스킨)
  const filteredCommunitySkins = useMemo(() => {
    let result = publishedSkins
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(skin =>
        skin.name.toLowerCase().includes(query) ||
        skin.description?.toLowerCase().includes(query) ||
        skin.creator?.nickname?.toLowerCase().includes(query)
      )
    }
    return result
  }, [publishedSkins, searchQuery])

  const stats = useMemo(() => ({
    total: skins.filter(s => s.is_system).length + publishedSkins.length,
    official: skins.filter(s => s.is_system).length,
    community: publishedSkins.length,
  }), [skins, publishedSkins])

  const handleDownloadSkin = async (skin: BlogSkin) => {
    if (!user) {
      showToast('로그인이 필요합니다', 'error')
      return
    }
    setDownloading(skin.id)
    try {
      await downloadSkin(skin.id)
      setDownloadedSkinIds(prev => [...prev, skin.id])
      showToast(`'${skin.name}' 스킨이 추가되었습니다`, 'success')
    } catch {
      showToast('다운로드에 실패했습니다', 'error')
    } finally {
      setDownloading(null)
    }
  }

  // 커뮤니티 스킨 다운로드
  const handleDownloadPublishedSkin = async (skin: PublishedSkin) => {
    if (!user) {
      showToast('로그인이 필요합니다', 'error')
      return
    }
    setDownloading(skin.id)
    try {
      await downloadPublishedSkin(skin.id)
      setDownloadedPublishedIds(prev => [...prev, skin.id])
      showToast(`'${skin.name}' 스킨이 내 스킨에 추가되었습니다`, 'success')
    } catch {
      showToast('다운로드에 실패했습니다', 'error')
    } finally {
      setDownloading(null)
    }
  }

  // 에디터 값 변경
  const handleEditorChange = useCallback((key: TemplateKey, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  // AI 생성 디자인 자동 적용 (CSS만 - HTML은 유지)
  const handleApplyDesign = useCallback((sections: Record<string, string>) => {
    console.log('[handleApplyDesign] Received sections:', sections)

    // CSS만 적용 (HTML 구조는 유지)
    if (sections.custom_css) {
      setEditedData(prev => ({ ...prev, custom_css: sections.custom_css }))
      setHasChanges(true)
      showToast('스타일이 적용되었습니다')
    }
  }, [])

  // 저장
  const handleSave = async () => {
    if (!userBlog) return

    setSaving(true)
    try {
      // html_template을 기존 필드에 매핑 (html_header에 전체 HTML 저장)
      const saveData: CustomSkinUpdateData = {
        html_header: editedData.html_template,
        html_post_list: '',
        html_post_item: '',
        html_post_detail: '',
        html_sidebar: '',
        html_footer: '',
        custom_css: editedData.custom_css,
        is_active: editedData.is_active,
      }
      const saved = await saveCustomSkin(userBlog.id, saveData)
      setCustomSkin(saved)
      setHasChanges(false)
      showToast('저장되었습니다')
    } catch (err) {
      console.error('Save failed:', err)
      showToast('저장에 실패했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 활성화/비활성화
  const handleToggle = async () => {
    if (!userBlog) return

    if (hasChanges) {
      await handleSave()
    }

    try {
      const newIsActive = !editedData.is_active
      const updated = await toggleCustomSkin(userBlog.id, newIsActive)
      setCustomSkin(updated)
      setEditedData(prev => ({ ...prev, is_active: newIsActive }))
      showToast(newIsActive ? '커스텀 스킨이 활성화되었습니다' : '커스텀 스킨이 비활성화되었습니다')
    } catch (err) {
      console.error('Toggle failed:', err)
      showToast('상태 변경에 실패했습니다', 'error')
    }
  }

  // 기본 템플릿 불러오기
  const handleLoadDefault = (key: TemplateKey) => {
    const defaultCombined = getDefaultCombinedTemplate()
    const defaultValue = defaultCombined[key as keyof typeof defaultCombined]
    if (typeof defaultValue === 'string') {
      handleEditorChange(key, defaultValue)
      showToast('기본 템플릿을 불러왔습니다')
    }
  }

  // 배포 모달 열기
  const openDeployModal = async () => {
    // 변경사항이 있으면 먼저 저장
    if (hasChanges && userBlog) {
      setSaving(true)
      try {
        const saved = await saveCustomSkin(userBlog.id, editedData)
        setCustomSkin(saved)
        setHasChanges(false)
      } catch (err) {
        console.error('Save failed:', err)
        showToast('저장에 실패했습니다', 'error')
        setSaving(false)
        return
      }
      setSaving(false)
    }
    setShowDeployModal(true)
  }

  // 스킨 배포
  const handleDeploy = async () => {
    if (!userBlog || !deployData.name.trim()) {
      showToast('스킨 이름을 입력해주세요', 'error')
      return
    }

    setDeploying(true)
    try {
      await publishSkin(userBlog.id, {
        name: deployData.name.trim(),
        description: deployData.description.trim() || undefined,
        is_public: deployData.is_public,
      })

      showToast(
        deployData.is_public
          ? '스킨이 공개 배포되었습니다! 다른 사용자들이 사용할 수 있습니다.'
          : '스킨이 비공개 배포되었습니다. 나만 사용할 수 있습니다.'
      )
      setShowDeployModal(false)
      setDeployData({ name: '', description: '', is_public: false })
    } catch (err) {
      console.error('Deploy failed:', err)
      showToast('배포에 실패했습니다', 'error')
    } finally {
      setDeploying(false)
    }
  }

  // 실시간 미리보기 렌더링
  const previewHtml = useMemo(() => {
    if (!showEditor || !userBlog) return { full: '', css: '', cssVars: {} as Record<string, string> }

    // 첫 번째 게시글 (상세 미리보기용)
    const firstPost = previewPosts[0]

    // 실제 데이터로 컨텍스트 생성
    const context: TemplateContext = {
      blog_id: userBlog.id,
      blog_name: userBlog.name,
      blog_description: userBlog.description || '',
      profile_image: userBlog.thumbnail_url || '',
      post_count: previewPosts.length,
      subscriber_count: subscriberCount,
      visitor_count: visitorCount,
      current_year: new Date().getFullYear(),
      no_posts: previewPosts.length === 0,
      // 게시글 목록
      posts: previewPosts.map(p => ({
        post_id: p.id,
        post_title: p.title,
        post_excerpt: p.excerpt || '',
        post_date: formatPreviewDate(p.created_at),
        thumbnail_url: p.thumbnail_url || undefined,
        view_count: p.view_count || 0,
        like_count: p.like_count || 0,
        blog_id: p.blog_id,
      })),
      // 카테고리 목록
      categories: previewCategories.map(c => ({
        category_id: c.id,
        category_name: c.name,
        blog_id: userBlog.id,
      })),
      // 게시글 상세용 (첫 번째 게시글)
      post_id: firstPost?.id || '',
      post_title: firstPost?.title || '',
      post_content: firstPost?.content || '',
      post_excerpt: firstPost?.excerpt || '',
      post_date: firstPost ? formatPreviewDate(firstPost.created_at) : '',
      thumbnail_url: firstPost?.thumbnail_url || '',
      category_name: firstPost?.category?.name || '',
      view_count: firstPost?.view_count || 0,
      like_count: firstPost?.like_count || 0,
    }

    // html_template에서 post_item 파셜 추출 ({{> post_item}} 사용을 위해)
    // 기본 post_item 템플릿 제공
    const defaultPostItem = `<article class="post-item">
  <a href="/post/{{post_id}}" class="post-link">
    <div class="post-content">
      <h3 class="post-title">{{post_title}}</h3>
      <p class="post-excerpt">{{post_excerpt}}</p>
      <div class="post-meta">
        <span class="post-date">{{post_date}}</span>
        <span class="meta-divider">·</span>
        <span class="post-views">{{view_count}} 조회</span>
        <span class="post-likes">{{like_count}} 좋아요</span>
      </div>
    </div>
    {{#if thumbnail_url}}
    <div class="post-thumbnail">
      <img src="{{thumbnail_url}}" alt="{{post_title}}">
    </div>
    {{/if}}
  </a>
</article>`
    const partials = { post_item: defaultPostItem }

    // CSS에서 :root 변수 추출
    const extractCSSVariables = (css: string): Record<string, string> => {
      const vars: Record<string, string> = {}
      const rootMatch = css.match(/:root\s*\{([^}]+)\}/)
      if (rootMatch) {
        const declarations = rootMatch[1].match(/--[\w-]+\s*:\s*[^;]+/g)
        if (declarations) {
          declarations.forEach(decl => {
            const [name, value] = decl.split(':').map(s => s.trim())
            if (name && value) {
              vars[name] = value
            }
          })
        }
      }
      return vars
    }

    const cssVars = extractCSSVariables(editedData.custom_css || '')

    // 통합 html_template을 렌더링 (HTML 구조 조작 없이 그대로 사용)
    const renderedHtml = sanitizeHTML(renderTemplate(editedData.html_template || '', context, partials))

    return {
      full: renderedHtml,
      css: scopeCSS(editedData.custom_css || '', '.custom-skin-preview-container'),
      cssVars,
    }
  }, [showEditor, editedData, userBlog, previewPosts, previewCategories, subscriberCount, visitorCount])

  // 리사이즈 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // 최소/최대 너비 제한 (25% ~ 75%)
    setEditorWidth(Math.min(Math.max(newWidth, 25), 75))
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // 리사이즈 이벤트 리스너
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] dark:bg-[#09090b]">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-black/10 dark:border-white/10" />
          <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-black dark:border-t-white" />
        </div>
      </div>
    )
  }

  const currentValue = editedData[activeSection] as string || ''
  const isCSS = activeSection === 'custom_css'

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b]">
      {/* 히어로 배너 - 에디터 뷰에서는 숨김 */}
      {!showEditor && (
        <section className="relative h-[280px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url(/image/skin_marketplace_banner.jpg)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/60 to-transparent dark:from-[#09090b] dark:via-[#09090b]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

          <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-10">
            <div className="flex items-end justify-between">
              <div className="max-w-xl">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">
                  Skin Marketplace
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-4xl">
                  스킨 마켓
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  블로그를 당신만의 공간으로. 다양한 테마를 탐색하고 적용해보세요.
                </p>

                <div className="mt-5 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{stats.total}</span>
                    <span className="text-xs text-white/60">전체</span>
                  </div>
                  <div className="h-4 w-px bg-white/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{stats.official}</span>
                    <span className="text-xs text-white/60">공식</span>
                  </div>
                </div>
              </div>

              {/* 커스텀 스킨 만들기 버튼 */}
              {user && userBlog && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="flex items-center gap-2 rounded-xl bg-white/95 px-5 py-3 text-sm font-semibold text-neutral-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
                >
                  <svg className="h-5 w-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  커스텀 스킨 만들기
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 필터 바 - 에디터 뷰가 아닐 때만 표시 */}
      {!showEditor && (
        <section className="sticky top-16 z-20 border-b border-black/5 bg-[#fafafa]/90 backdrop-blur-xl dark:border-white/5 dark:bg-[#09090b]/90">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-1">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'official', label: '공식', icon: true },
                  { key: 'community', label: '커뮤니티' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabType)}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-black dark:text-white'
                        : 'text-black/40 hover:text-black/70 dark:text-white/40 dark:hover:text-white/70'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {tab.icon && (
                        <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {tab.label}
                    </span>
                    {activeTab === tab.key && (
                      <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-black dark:bg-white" />
                    )}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 rounded-full border border-black/10 bg-white px-4 py-2 pl-9 text-sm outline-none transition-all placeholder:text-black/30 focus:w-56 focus:border-black/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
                />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 커스텀 스킨 에디터 */}
      {showEditor && userBlog ? (
        <div className="flex h-[calc(100vh-64px)] flex-col">
          {/* 에디터 상단 바 */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEditor(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                마켓으로 돌아가기
              </button>
              <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
              <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
                <svg className="h-4 w-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                커스텀 스킨 에디터
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  저장되지 않은 변경
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={openDeployModal}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                배포
              </button>
            </div>
          </div>

          {/* 메인 에디터 영역 */}
          <div ref={containerRef} className="flex flex-1 overflow-hidden">
            {/* 왼쪽: 코드 에디터 */}
            <div
              className="flex flex-col border-r border-neutral-200 dark:border-neutral-800"
              style={{ width: `${editorWidth}%` }}
            >
              {/* 섹션 탭 */}
              <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/50">
                {TEMPLATE_SECTIONS.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeSection === section.key
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="mr-1">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>

              {/* 에디터 도구 바 */}
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-[#1e1e1e] px-4 py-2 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-300">
                    {TEMPLATE_SECTIONS.find(s => s.key === activeSection)?.label}
                  </span>
                  <span className="rounded bg-neutral-700 px-1.5 py-0.5 text-xs text-neutral-400">
                    {isCSS ? 'CSS' : 'HTML'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowVariables(!showVariables)}
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      showVariables
                        ? 'bg-violet-900/50 text-violet-400'
                        : 'text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {'{{'} 변수 참조 {'}}'}
                  </button>
                  <button
                    onClick={() => handleLoadDefault(activeSection)}
                    className="rounded px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700"
                  >
                    기본값 불러오기
                  </button>
                </div>
              </div>

              {/* 변수 참조 패널 */}
              {showVariables && (
                <div className="shrink-0 border-b border-neutral-700 bg-[#252526] p-3">
                  <p className="mb-2 text-xs text-neutral-400">사용 가능한 변수 (클릭하여 복사)</p>
                  <div className="flex flex-wrap gap-2">
                    {[...TEMPLATE_VARIABLES.blog, ...TEMPLATE_VARIABLES.post].map((v) => (
                      <code
                        key={v.name}
                        className="cursor-pointer rounded bg-[#1e1e1e] px-2 py-1 text-xs text-violet-400 transition-colors hover:bg-violet-900/30"
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${v.name}}}`)
                          showToast(`{{${v.name}}} 복사됨`)
                        }}
                        title={v.description}
                      >
                        {`{{${v.name}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Monaco 에디터 */}
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  language={isCSS ? 'css' : 'html'}
                  value={currentValue}
                  onChange={(value) => handleEditorChange(activeSection, value || '')}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    padding: { top: 16 },
                    renderLineHighlight: 'line',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                  }}
                />
              </div>
            </div>

            {/* 리사이즈 핸들 */}
            <div
              className={`group relative w-1 shrink-0 cursor-col-resize bg-neutral-200 transition-colors hover:bg-violet-400 dark:bg-neutral-700 dark:hover:bg-violet-500 ${isResizing ? 'bg-violet-500 dark:bg-violet-500' : ''}`}
              onMouseDown={handleMouseDown}
            >
              {/* 드래그 힌트 */}
              <div className="absolute left-1/2 top-1/2 flex h-8 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded bg-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-600">
                <svg className="h-4 w-4 rotate-90 text-neutral-500 dark:text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5h2v14H8V5zm6 0h2v14h-2V5z" />
                </svg>
              </div>
            </div>

            {/* 오른쪽: 실시간 미리보기 */}
            <div
              className="flex flex-col bg-neutral-100 dark:bg-neutral-900"
              style={{ width: `${100 - editorWidth}%` }}
            >
              {/* 렌더링된 미리보기 - 다크모드 격리 */}
              <div className="flex-1 overflow-auto bg-neutral-100 p-4">
                {/*
                  미리보기 영역: 다크모드와 완전히 격리
                  - data-theme="light" 속성으로 라이트 모드 강제
                  - CSS 변수를 명시적으로 설정하여 기본 테마 적용
                  - 내부 스타일이 외부 다크모드 영향 받지 않도록 격리
                */}
                <div
                  className="custom-skin-preview-container mx-auto min-h-full w-full overflow-hidden rounded-lg shadow-2xl ring-1 ring-black/10"
                  data-theme="light"
                  style={{
                    backgroundColor: previewHtml?.cssVars?.['--blog-bg'] || '#ffffff',
                    color: previewHtml?.cssVars?.['--blog-fg'] || '#000000',
                    // CSS 변수 - AI 생성 값 또는 기본값 사용
                    ['--blog-bg' as string]: previewHtml?.cssVars?.['--blog-bg'] || '#ffffff',
                    ['--blog-fg' as string]: previewHtml?.cssVars?.['--blog-fg'] || '#000000',
                    ['--blog-accent' as string]: previewHtml?.cssVars?.['--blog-accent'] || '#000000',
                    ['--blog-muted' as string]: previewHtml?.cssVars?.['--blog-muted'] || '#666666',
                    ['--blog-border' as string]: previewHtml?.cssVars?.['--blog-border'] || '#e5e5e5',
                    ['--blog-card-bg' as string]: previewHtml?.cssVars?.['--blog-card-bg'] || '#fafafa',
                    colorScheme: 'light',
                  }}
                >
                  {/* 커스텀 CSS 주입 - CSS Grid 레이아웃 강제 적용 */}
                  <style>{`
                    .custom-skin-preview-container,
                    .custom-skin-preview-container * {
                      color-scheme: light !important;
                    }
                    /* CSS Grid 레이아웃: HTML 구조와 무관하게 적용 */
                    .custom-skin-preview-container .custom-skin-content {
                      display: grid !important;
                      grid-template-columns: 1fr 320px !important;
                      grid-template-rows: auto 1fr auto !important;
                      grid-template-areas:
                        "header header"
                        "content sidebar"
                        "footer footer" !important;
                      gap: 0 2rem !important;
                      max-width: 1280px !important;
                      margin: 0 auto !important;
                      min-height: 100vh !important;
                    }
                    .custom-skin-preview-container .blog-header {
                      grid-area: header !important;
                      max-width: none !important;
                      width: 100% !important;
                    }
                    .custom-skin-preview-container .blog-sidebar {
                      grid-area: sidebar !important;
                      width: 100% !important;
                      padding-top: 2.5rem !important;
                    }
                    .custom-skin-preview-container .blog-footer {
                      grid-area: footer !important;
                    }
                    .custom-skin-preview-container .post-list,
                    .custom-skin-preview-container .post-detail {
                      grid-area: content !important;
                      padding: 2.5rem 1.5rem !important;
                    }
                    /* blog-main-layout이 있는 경우 기존 flex 레이아웃 유지 */
                    .custom-skin-preview-container .blog-main-layout {
                      grid-column: 1 / -1 !important;
                      grid-row: 2 !important;
                      display: flex !important;
                      flex-direction: row !important;
                      gap: 2rem !important;
                      padding: 2.5rem 1.5rem !important;
                    }
                    .custom-skin-preview-container .blog-main-layout .blog-content-area {
                      flex: 1 !important;
                      min-width: 0 !important;
                    }
                    .custom-skin-preview-container .blog-main-layout .blog-sidebar {
                      width: 320px !important;
                      flex-shrink: 0 !important;
                      padding-top: 0 !important;
                    }
                    ${previewHtml?.css || ''}
                  `}</style>

                  {/* 통합 HTML 템플릿 렌더링 (sanitizeHTML로 정화됨) */}
                  {previewHtml.full ? (
                    <div
                      className="custom-skin-content"
                      // eslint-disable-next-line react/no-danger -- content is sanitized via sanitizeHTML
                      dangerouslySetInnerHTML={{ __html: previewHtml.full }}
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center">
                      <div className="text-center">
                        <div className="mb-2 text-4xl">📝</div>
                        <p className="text-sm" style={{ color: '#999999' }}>
                          HTML 템플릿을 작성하세요
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 미리보기 안내 */}
              <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  코드를 수정하면 실시간으로 미리보기에 반영됩니다. 실제 블로그 데이터(게시글 {previewPosts.length}개, 구독자 {subscriberCount}명, 방문자 {visitorCount}명)로 렌더링됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : showEditor && !userBlog ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="mb-4 text-5xl">📝</div>
          <h3 className="text-lg font-semibold text-black dark:text-white">블로그가 필요합니다</h3>
          <p className="mt-2 text-sm text-black/50 dark:text-white/50">커스텀 스킨을 만들려면 먼저 블로그를 생성해주세요</p>
          <a
            href="/create-blog"
            className="mt-6 rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            블로그 만들기
          </a>
        </div>
      ) : (
        /* 스킨 그리드 */
        <section className="mx-auto max-w-6xl px-6 py-10">
          {/* 공식 스킨 (all 또는 official 탭) */}
          {(activeTab === 'all' || activeTab === 'official') && filteredOfficialSkins.length === 0 && activeTab === 'official' ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="mb-4 text-5xl opacity-20">◇</div>
              <p className="text-black/40 dark:text-white/40">
                {searchQuery ? '검색 결과가 없습니다' : '공식 스킨이 없습니다'}
              </p>
            </div>
          ) : (activeTab === 'all' || activeTab === 'official') && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOfficialSkins.map((skin, index) => {
                const isDownloaded = downloadedSkinIds.includes(skin.id)
                const isDownloading = downloading === skin.id
                const cssVars = skin.css_variables
                const bgColor = cssVars['--blog-bg'] || '#ffffff'
                const fgColor = cssVars['--blog-fg'] || '#000000'
                const accentColor = cssVars['--blog-accent'] || '#000000'
                const mutedColor = cssVars['--blog-muted'] || '#666666'
                const borderColor = cssVars['--blog-border'] || '#e5e5e5'
                const cardBgColor = cssVars['--blog-card-bg'] || '#ffffff'

                return (
                  <div
                    key={skin.id}
                    className="group"
                    style={{
                      opacity: 0,
                      animation: 'fadeSlideUp 0.5s ease forwards',
                      animationDelay: `${index * 60}ms`
                    }}
                  >
                    <div
                      className="relative cursor-pointer overflow-hidden rounded-xl transition-all duration-500 hover:scale-[1.02]"
                      onClick={() => setSelectedSkin(skin)}
                      style={{
                        boxShadow: '0 2px 20px -4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {/* 컬러 프리뷰 */}
                      <div
                        className="relative aspect-[4/3] overflow-hidden"
                        style={{ backgroundColor: bgColor }}
                      >
                        <div
                          className="flex items-center justify-between px-3 py-2"
                          style={{ borderBottom: `1px solid ${borderColor}` }}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: fgColor, opacity: 0.8 }} />
                          </div>
                          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: accentColor }} />
                        </div>

                        <div className="flex gap-2 p-3">
                          <div className="flex-1 space-y-2">
                            {[1, 2].map((i) => (
                              <div key={i} className="rounded-md p-2" style={{ backgroundColor: cardBgColor }}>
                                <div className="h-1 w-12 rounded-full" style={{ backgroundColor: fgColor }} />
                                <div className="mt-1.5 h-0.5 w-full rounded-full" style={{ backgroundColor: mutedColor, opacity: 0.4 }} />
                                <div className="mt-1 h-0.5 w-2/3 rounded-full" style={{ backgroundColor: mutedColor, opacity: 0.3 }} />
                              </div>
                            ))}
                          </div>
                          <div className="w-12 shrink-0 rounded-md p-2" style={{ backgroundColor: cardBgColor }}>
                            <div className="mx-auto h-5 w-5 rounded-md" style={{ backgroundColor: mutedColor, opacity: 0.15 }} />
                            <div className="mx-auto mt-1.5 h-0.5 w-6 rounded-full" style={{ backgroundColor: fgColor, opacity: 0.6 }} />
                            <div className="mx-auto mt-1.5 h-2 w-6 rounded-sm" style={{ backgroundColor: accentColor }} />
                          </div>
                        </div>

                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 50%, ${fgColor}10 100%)`
                          }}
                        />

                        <div className="absolute left-2 top-2 flex items-center gap-1.5">
                          {skin.is_system && (
                            <div
                              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                              style={{ backgroundColor: accentColor, color: bgColor }}
                            >
                              <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Official
                            </div>
                          )}
                        </div>

                        {isDownloaded && (
                          <div className="absolute right-2 top-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        className="relative border-t p-3"
                        style={{ backgroundColor: bgColor, borderColor: borderColor }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold" style={{ color: fgColor }}>
                              {skin.name}
                            </h3>
                            {skin.description && (
                              <p className="mt-0.5 truncate text-xs" style={{ color: mutedColor }}>
                                {skin.description}
                              </p>
                            )}
                          </div>

                          {isDownloaded ? (
                            <a
                              href="/skins"
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-70"
                              style={{ backgroundColor: fgColor + '10', color: fgColor }}
                            >
                              적용하기
                            </a>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadSkin(skin)
                              }}
                              disabled={isDownloading || !user}
                              className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                              style={{ backgroundColor: accentColor, color: bgColor }}
                            >
                              {isDownloading ? (
                                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : '받기'}
                            </button>
                          )}
                        </div>

                        <div className="mt-2.5 flex h-1 overflow-hidden rounded-full">
                          <div className="flex-1" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }} />
                          <div className="flex-1" style={{ backgroundColor: cardBgColor }} />
                          <div className="flex-1" style={{ backgroundColor: fgColor }} />
                          <div className="flex-1" style={{ backgroundColor: accentColor }} />
                          <div className="flex-1" style={{ backgroundColor: mutedColor }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 커뮤니티 스킨 (all 또는 community 탭) */}
          {(activeTab === 'all' || activeTab === 'community') && (
            <>
              {activeTab === 'all' && filteredOfficialSkins.length > 0 && filteredCommunitySkins.length > 0 && (
                <h2 className="mb-6 mt-12 text-lg font-semibold text-black/80 dark:text-white/80">커뮤니티 스킨</h2>
              )}
              {filteredCommunitySkins.length === 0 && activeTab === 'community' ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="mb-4 text-5xl opacity-20">◇</div>
                  <p className="text-black/40 dark:text-white/40">
                    {searchQuery ? '검색 결과가 없습니다' : '커뮤니티 스킨이 없습니다'}
                  </p>
                </div>
              ) : filteredCommunitySkins.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCommunitySkins.map((skin, index) => {
                    const isDownloaded = downloadedPublishedIds.includes(skin.id)
                    const isDownloading = downloading === skin.id
                    // 커뮤니티 스킨은 기본 색상 사용 (스킨의 CSS 변수 기본값과 동일)
                    const bgColor = '#ffffff'
                    const fgColor = '#000000'
                    const accentColor = '#000000'
                    const mutedColor = '#666666'
                    const borderColor = '#e5e5e5'
                    const cardBgColor = '#fafafa'

                    return (
                      <div
                        key={skin.id}
                        className="group"
                        style={{
                          opacity: 0,
                          animation: 'fadeSlideUp 0.5s ease forwards',
                          animationDelay: `${index * 60}ms`
                        }}
                      >
                        <div
                          className="relative cursor-pointer overflow-hidden rounded-xl transition-all duration-500 hover:scale-[1.02]"
                          onClick={() => setSelectedPublishedSkin(skin)}
                          style={{
                            boxShadow: '0 2px 20px -4px rgba(0,0,0,0.1)',
                          }}
                        >
                          {/* 컬러 프리뷰 */}
                          <div
                            className="relative aspect-[4/3] overflow-hidden"
                            style={{ backgroundColor: bgColor }}
                          >
                            <div
                              className="flex items-center justify-between px-3 py-2"
                              style={{ borderBottom: `1px solid ${borderColor}` }}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                                <div className="h-1 w-8 rounded-full" style={{ backgroundColor: fgColor, opacity: 0.8 }} />
                              </div>
                              <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: accentColor }} />
                            </div>

                            <div className="flex gap-2 p-3">
                              <div className="flex-1 space-y-2">
                                {[1, 2].map((i) => (
                                  <div key={i} className="rounded-md p-2" style={{ backgroundColor: cardBgColor }}>
                                    <div className="h-1 w-12 rounded-full" style={{ backgroundColor: fgColor }} />
                                    <div className="mt-1.5 h-0.5 w-full rounded-full" style={{ backgroundColor: mutedColor, opacity: 0.4 }} />
                                    <div className="mt-1 h-0.5 w-2/3 rounded-full" style={{ backgroundColor: mutedColor, opacity: 0.3 }} />
                                  </div>
                                ))}
                              </div>
                              <div className="w-12 shrink-0 rounded-md p-2" style={{ backgroundColor: cardBgColor }}>
                                <div className="mx-auto h-5 w-5 rounded-md" style={{ backgroundColor: mutedColor, opacity: 0.15 }} />
                                <div className="mx-auto mt-1.5 h-0.5 w-6 rounded-full" style={{ backgroundColor: fgColor, opacity: 0.6 }} />
                                <div className="mx-auto mt-1.5 h-2 w-6 rounded-sm" style={{ backgroundColor: accentColor }} />
                              </div>
                            </div>

                            <div
                              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                              style={{
                                background: `linear-gradient(135deg, ${accentColor}20 0%, transparent 50%, ${fgColor}10 100%)`
                              }}
                            />

                            {/* 커뮤니티 뱃지 */}
                            <div className="absolute left-2 top-2 flex items-center gap-1.5">
                              <div
                                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                                style={{ backgroundColor: fgColor, color: bgColor }}
                              >
                                Community
                              </div>
                            </div>

                            {isDownloaded && (
                              <div className="absolute right-2 top-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>

                          <div
                            className="relative border-t p-3"
                            style={{ backgroundColor: bgColor, borderColor: borderColor }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold" style={{ color: fgColor }}>
                                  {skin.name}
                                </h3>
                                {/* 제작자 정보 */}
                                {skin.creator && (
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    {skin.creator.profile_image_url ? (
                                      <img
                                        src={skin.creator.profile_image_url}
                                        alt={skin.creator.nickname || '제작자'}
                                        className="h-4 w-4 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-100 text-[8px] font-bold text-violet-600">
                                        {(skin.creator.nickname || '?')[0]}
                                      </div>
                                    )}
                                    <span className="truncate text-xs" style={{ color: mutedColor }}>
                                      {skin.creator.nickname || '익명'}
                                    </span>
                                    {skin.download_count > 0 && (
                                      <span className="text-[10px]" style={{ color: mutedColor }}>
                                        · {skin.download_count}회 다운로드
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {isDownloaded ? (
                                <a
                                  href="/skins"
                                  onClick={(e) => e.stopPropagation()}
                                  className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-70"
                                  style={{ backgroundColor: fgColor + '10', color: fgColor }}
                                >
                                  적용하기
                                </a>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadPublishedSkin(skin)
                                  }}
                                  disabled={isDownloading || !user}
                                  className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                                  style={{ backgroundColor: fgColor, color: bgColor }}
                                >
                                  {isDownloading ? (
                                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                  ) : '받기'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {!user && skins.length > 0 && (
            <div className="mt-12 rounded-2xl bg-gradient-to-r from-black/[0.02] to-black/[0.04] p-8 text-center dark:from-white/[0.02] dark:to-white/[0.04]">
              <p className="text-black/60 dark:text-white/60">
                스킨을 다운로드하려면 로그인이 필요합니다
              </p>
              <a
                href="/"
                className="mt-4 inline-block rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black"
              >
                로그인
              </a>
            </div>
          )}
        </section>
      )}

      {/* 미리보기 모달 - 풀스크린 슬라이드 패널 */}
      {selectedSkin && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedSkin(null)}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.3s ease' }}
          />

          <div
            className="relative ml-auto flex h-full w-full max-w-5xl flex-col bg-[#fafafa] shadow-2xl dark:bg-[#09090b]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.4s ease' }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedSkin(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-black dark:text-white">{selectedSkin.name}</h2>
                    {selectedSkin.is_system && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: selectedSkin.css_variables['--blog-accent'],
                          color: selectedSkin.css_variables['--blog-bg']
                        }}
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Official
                      </span>
                    )}
                  </div>
                  {selectedSkin.description && (
                    <p className="mt-0.5 text-sm text-black/50 dark:text-white/50">{selectedSkin.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="mr-2 hidden items-center gap-1.5 md:flex">
                  {[
                    selectedSkin.css_variables['--blog-bg'],
                    selectedSkin.css_variables['--blog-fg'],
                    selectedSkin.css_variables['--blog-accent'],
                    selectedSkin.css_variables['--blog-card-bg'],
                    selectedSkin.css_variables['--blog-muted'],
                  ].map((color, i) => (
                    <div
                      key={i}
                      className="h-5 w-5 rounded-md ring-1 ring-black/10 dark:ring-white/10"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {downloadedSkinIds.includes(selectedSkin.id) ? (
                  <a
                    href="/skins"
                    className="rounded-lg bg-black/5 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    적용하기
                  </a>
                ) : (
                  <button
                    onClick={() => handleDownloadSkin(selectedSkin)}
                    disabled={downloading === selectedSkin.id || !user}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {downloading === selectedSkin.id ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        다운로드 중
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        다운로드
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-6">
              <div className="mx-auto h-full max-w-4xl overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
                <div className="flex h-10 items-center gap-2 border-b px-4" style={{ backgroundColor: selectedSkin.css_variables['--blog-card-bg'], borderColor: selectedSkin.css_variables['--blog-border'] }}>
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'], opacity: 0.3 }} />
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'], opacity: 0.3 }} />
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'], opacity: 0.3 }} />
                  </div>
                  <div className="ml-4 flex-1">
                    <div
                      className="mx-auto max-w-md rounded-md px-3 py-1 text-center text-xs"
                      style={{
                        backgroundColor: selectedSkin.css_variables['--blog-bg'],
                        color: selectedSkin.css_variables['--blog-muted']
                      }}
                    >
                      snuggle.blog/my-blog
                    </div>
                  </div>
                </div>

                <div
                  className="h-[calc(100%-40px)] overflow-y-auto"
                  style={{
                    backgroundColor: selectedSkin.css_variables['--blog-bg'],
                    color: selectedSkin.css_variables['--blog-fg'],
                  }}
                >
                  <header
                    className="border-b px-6 py-3"
                    style={{ borderColor: selectedSkin.css_variables['--blog-border'] }}
                  >
                    <div className="mx-auto flex max-w-4xl items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Snuggle</span>
                        <span style={{ color: selectedSkin.css_variables['--blog-muted'] }}>/</span>
                        <span className="font-medium">My Blog</span>
                      </div>
                      <div className="flex items-center gap-5">
                        <span className="text-sm font-medium" style={{ color: selectedSkin.css_variables['--blog-fg'] }}>홈</span>
                        <span className="text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>방명록</span>
                        <button
                          className="rounded-full px-4 py-1.5 text-sm font-medium"
                          style={{
                            backgroundColor: selectedSkin.css_variables['--blog-accent'],
                            color: selectedSkin.css_variables['--blog-bg'],
                          }}
                        >
                          구독
                        </button>
                      </div>
                    </div>
                  </header>

                  <div className="mx-auto flex max-w-4xl gap-8 px-6 py-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between pb-4">
                        <h2 className="text-lg font-semibold">게시글</h2>
                        <span className="text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>3개</span>
                      </div>

                      <div className="border-t" style={{ borderColor: selectedSkin.css_variables['--blog-border'] }}>
                        {[
                          { title: '첫 번째 포스트', excerpt: '블로그의 첫 번째 글입니다. 반갑습니다!', date: '2024년 12월 15일', views: 128, likes: 12 },
                          { title: '개발 이야기', excerpt: '오늘은 새로운 기능을 구현해보았습니다.', date: '2024년 12월 10일', views: 256, likes: 24 },
                          { title: '일상 기록', excerpt: '맛있는 커피를 마시며 코딩하는 하루.', date: '2024년 12월 5일', views: 89, likes: 8 },
                        ].map((post, i) => (
                          <div
                            key={i}
                            className="border-b py-4"
                            style={{ borderColor: i < 2 ? selectedSkin.css_variables['--blog-border'] : 'transparent' }}
                          >
                            <h3 className="font-semibold">{post.title}</h3>
                            <p className="mt-1.5 text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>
                              {post.excerpt}
                            </p>
                            <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: selectedSkin.css_variables['--blog-muted'], opacity: 0.7 }}>
                              <span>{post.date}</span>
                              <span>·</span>
                              <span>조회 {post.views}</span>
                              <span>·</span>
                              <span>좋아요 {post.likes}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <aside className="w-64 shrink-0">
                      <div
                        className="rounded-2xl border p-5"
                        style={{
                          borderColor: selectedSkin.css_variables['--blog-border'],
                          backgroundColor: selectedSkin.css_variables['--blog-card-bg'],
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className="h-20 w-20 rounded-2xl"
                            style={{ backgroundColor: selectedSkin.css_variables['--blog-muted'] + '20' }}
                          />
                          <h3 className="mt-3 text-lg font-bold">내 블로그</h3>
                          <p className="mt-1 text-center text-sm" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>
                            개발과 일상을 기록합니다
                          </p>
                          <button
                            className="mt-3 rounded-full px-4 py-1.5 text-sm font-medium"
                            style={{
                              backgroundColor: selectedSkin.css_variables['--blog-accent'],
                              color: selectedSkin.css_variables['--blog-bg'],
                            }}
                          >
                            구독하기
                          </button>
                        </div>

                        <div className="mt-5 flex justify-center gap-6">
                          <div className="text-center">
                            <div className="text-xl font-bold">3</div>
                            <div className="text-xs" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>게시글</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold">128</div>
                            <div className="text-xs" style={{ color: selectedSkin.css_variables['--blog-muted'] }}>구독자</div>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 배포 모달 */}
      {showDeployModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeployModal(false)}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease' }}
          />

          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeSlideUp 0.3s ease' }}
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                스킨 배포
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                스킨을 배포하여 다른 사용자들과 공유하세요
              </p>
            </div>

            <div className="space-y-4">
              {/* 스킨 이름 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  스킨 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deployData.name}
                  onChange={(e) => setDeployData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: 미니멀 다크 테마"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                />
              </div>

              {/* 스킨 설명 */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  설명 (선택)
                </label>
                <textarea
                  value={deployData.description}
                  onChange={(e) => setDeployData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="스킨에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                />
              </div>

              {/* 공개/비공개 선택 */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  배포 유형
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      deployData.is_public
                        ? 'border-violet-500 bg-violet-50 dark:border-violet-500 dark:bg-violet-900/20'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deploy_type"
                      checked={deployData.is_public}
                      onChange={() => setDeployData(prev => ({ ...prev, is_public: true }))}
                      className="mt-0.5 h-4 w-4 border-neutral-300 text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-white">공개 배포</span>
                        <svg className="h-4 w-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        모든 사용자가 스킨 마켓에서 이 스킨을 다운로드할 수 있습니다
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      !deployData.is_public
                        ? 'border-violet-500 bg-violet-50 dark:border-violet-500 dark:bg-violet-900/20'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deploy_type"
                      checked={!deployData.is_public}
                      onChange={() => setDeployData(prev => ({ ...prev, is_public: false }))}
                      className="mt-0.5 h-4 w-4 border-neutral-300 text-violet-600 focus:ring-violet-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-white">비공개 배포</span>
                        <svg className="h-4 w-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        나만 이 스킨을 사용할 수 있습니다
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeployModal(false)}
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                취소
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying || !deployData.name.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
              >
                {deploying ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    배포 중...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    배포하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 커뮤니티 스킨 미리보기 모달 */}
      {selectedPublishedSkin && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedPublishedSkin(null)}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.3s ease' }}
          />

          <div
            className="relative ml-auto flex h-full w-full max-w-5xl flex-col bg-[#fafafa] shadow-2xl dark:bg-[#09090b]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideInRight 0.4s ease' }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedPublishedSkin(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-black dark:text-white">{selectedPublishedSkin.name}</h2>
                    <span
                      className="flex items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-black"
                    >
                      Community
                    </span>
                  </div>
                  {/* 제작자 정보 */}
                  {selectedPublishedSkin.creator && (
                    <div className="mt-1 flex items-center gap-2">
                      {selectedPublishedSkin.creator.profile_image_url ? (
                        <img
                          src={selectedPublishedSkin.creator.profile_image_url}
                          alt={selectedPublishedSkin.creator.nickname || '제작자'}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-600">
                          {(selectedPublishedSkin.creator.nickname || '?')[0]}
                        </div>
                      )}
                      <span className="text-sm text-black/50 dark:text-white/50">
                        {selectedPublishedSkin.creator.nickname || '익명'}
                      </span>
                      {selectedPublishedSkin.download_count > 0 && (
                        <span className="text-xs text-black/40 dark:text-white/40">
                          · {selectedPublishedSkin.download_count}회 다운로드
                        </span>
                      )}
                    </div>
                  )}
                  {selectedPublishedSkin.description && (
                    <p className="mt-1 text-sm text-black/50 dark:text-white/50">{selectedPublishedSkin.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {downloadedPublishedIds.includes(selectedPublishedSkin.id) ? (
                  <a
                    href="/skins"
                    className="rounded-lg bg-black/5 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                  >
                    적용하기
                  </a>
                ) : (
                  <button
                    onClick={() => handleDownloadPublishedSkin(selectedPublishedSkin)}
                    disabled={downloading === selectedPublishedSkin.id || !user}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-all hover:bg-black/80 disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    {downloading === selectedPublishedSkin.id ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        다운로드 중
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        내 스킨에 추가
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 스킨 미리보기 영역 */}
            <div className="flex-1 overflow-auto bg-neutral-100 p-6 dark:bg-neutral-900">
              <div className="mx-auto max-w-4xl">
                <div className="rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                  {/* 브라우저 바 */}
                  <div className="flex h-10 items-center gap-2 rounded-t-xl border-b border-neutral-200 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1 text-xs text-neutral-400 dark:bg-neutral-900">
                      snuggle.com/blog/preview
                    </div>
                  </div>

                  {/* 커스텀 HTML/CSS 미리보기 - CSS 변수 적용 */}
                  {(() => {
                    // 로그인한 유저의 실제 블로그 데이터 사용
                    if (!userBlog) {
                      return (
                        <div className="aspect-[16/10] flex items-center justify-center rounded-b-xl bg-neutral-100 dark:bg-neutral-800">
                          <p className="text-neutral-500 dark:text-neutral-400">
                            {user ? '블로그를 먼저 생성해주세요' : '로그인 후 미리보기를 확인할 수 있습니다'}
                          </p>
                        </div>
                      )
                    }

                    // 실제 유저 데이터로 템플릿 컨텍스트 생성
                    const userContext: TemplateContext = {
                      blog_id: userBlog.id,
                      blog_name: userBlog.name,
                      blog_description: userBlog.description || '',
                      profile_image: userBlog.thumbnail_url || '',
                      post_count: previewPosts.length,
                      subscriber_count: subscriberCount,
                      visitor_count: visitorCount,
                      current_year: new Date().getFullYear(),
                      no_posts: previewPosts.length === 0,
                      posts: previewPosts.map((p) => ({
                        post_id: p.id,
                        post_title: p.title,
                        post_excerpt: p.excerpt || '',
                        post_date: formatPreviewDate(p.created_at),
                        thumbnail_url: p.thumbnail_url || undefined,
                        view_count: p.view_count || 0,
                        like_count: p.like_count || 0,
                        blog_id: p.blog_id,
                      })),
                      categories: previewCategories.map((c) => ({
                        category_id: c.id,
                        category_name: c.name,
                        blog_id: userBlog.id,
                      })),
                    }

                    // 파셜 정의 (post_item 템플릿)
                    const partials = {
                      post_item: selectedPublishedSkin.html_post_item || '',
                    }

                    const renderedHeader = renderTemplate(selectedPublishedSkin.html_header || '', userContext, partials)
                    const renderedPostList = renderTemplate(selectedPublishedSkin.html_post_list || '', userContext, partials)
                    const renderedSidebar = renderTemplate(selectedPublishedSkin.html_sidebar || '', userContext, partials)
                    const renderedFooter = renderTemplate(selectedPublishedSkin.html_footer || '', userContext, partials)

                    return (
                      <div
                        className="published-skin-preview-container aspect-[16/10] overflow-auto rounded-b-xl"
                        style={{
                          '--blog-bg': '#ffffff',
                          '--blog-fg': '#000000',
                          '--blog-accent': '#000000',
                          '--blog-muted': '#666666',
                          '--blog-border': '#e5e5e5',
                          '--blog-card-bg': '#fafafa',
                          backgroundColor: 'var(--blog-bg)',
                          color: 'var(--blog-fg)',
                        } as React.CSSProperties}
                      >
                        <style>{scopeCSS(selectedPublishedSkin.custom_css || '', '.published-skin-preview-container')}</style>
                        <div
                          className="custom-skin-wrapper"
                          dangerouslySetInnerHTML={{
                            __html: `
                              ${renderedHeader}
                              <main style="max-width: 1280px; margin: 0 auto; padding: 2rem 1.5rem;">
                                <div style="display: flex; gap: 2rem;">
                                  <div style="flex: 1;">
                                    ${renderedPostList}
                                  </div>
                                  <aside style="width: 280px; flex-shrink: 0;">
                                    ${renderedSidebar}
                                  </aside>
                                </div>
                              </main>
                              ${renderedFooter}
                            `
                          }}
                        />
                      </div>
                    )
                  })()}
                </div>

                {/* 스킨 정보 */}
                <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">스킨 정보</h3>
                  <div className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>제작자</span>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {selectedPublishedSkin.creator?.nickname || '익명'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>다운로드 수</span>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {selectedPublishedSkin.download_count || 0}회
                      </span>
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

      {/* 플로팅 AI 디자이너 (에디터 뷰에서만 표시) */}
      {showEditor && userBlog && (
        <AIChatPanel
          onApplyDesign={handleApplyDesign}
          isOpen={showAIChat}
          onToggle={() => setShowAIChat(!showAIChat)}
          currentSections={editedData}
        />
      )}
    </div>
  )
}
