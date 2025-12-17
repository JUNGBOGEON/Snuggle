'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/common/ToastProvider'
import {
  getCustomSkin,
  saveCustomSkin,
  toggleCustomSkin,
  resetCustomSkin,
  getDefaultTemplates,
  BlogCustomSkin,
  CustomSkinUpdateData,
  TEMPLATE_VARIABLES,
} from '@/lib/api/skins'
import AIChatPanel from '@/components/skin/AIChatPanel'
import type { User } from '@supabase/supabase-js'

// 기본 HTML 템플릿
function getDefaultHTMLTemplate(): string {
  return `<!-- 헤더 -->
<header class="blog-header">
  <img src="{{profile_image}}" alt="프로필" class="profile-img">
  <div class="blog-info">
    <h1 class="blog-title">{{blog_name}}</h1>
    <p class="blog-desc">{{blog_description}}</p>
  </div>
</header>

<!-- 게시글 목록 -->
<section class="post-grid">
  {{#posts}}
    {{> post_item}}
  {{/posts}}
</section>

<!-- 게시글 아이템 (반복) -->
<article class="post-card">
  <a href="{{post_url}}">
    <img src="{{thumbnail_url}}" alt="" class="post-card-thumbnail">
  </a>
  <div class="post-card-content">
    <h3 class="post-card-title"><a href="{{post_url}}">{{post_title}}</a></h3>
    <p class="post-card-excerpt">{{post_excerpt}}</p>
    <time class="post-card-date">{{post_date}}</time>
  </div>
</article>

<!-- 게시글 상세 -->
<article class="post-detail">
  <h1 class="post-detail-title">{{post_title}}</h1>
  <time class="post-detail-date">{{post_date}}</time>
  <div class="post-detail-content">{{{post_content}}}</div>
</article>

<!-- 사이드바 -->
<aside class="sidebar">
  <h3 class="sidebar-title">About</h3>
  <p class="sidebar-text">{{blog_description}}</p>
</aside>

<!-- 푸터 -->
<footer class="blog-footer">
  <p>© {{blog_name}}</p>
</footer>`
}

// 기본 CSS
function getDefaultCSS(): string {
  return `:root {
  --bg: #fafafa;
  --card: #ffffff;
  --text: #18181b;
  --text-secondary: #71717a;
  --accent: #7c3aed;
  --border: #e4e4e7;
  --shadow: rgba(0,0,0,0.05);
}

.custom-skin-wrapper {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  font-family: 'Pretendard', -apple-system, sans-serif;
}

.blog-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: var(--card);
  border-bottom: 1px solid var(--border);
}

.profile-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.blog-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.blog-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.post-card {
  background: var(--card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: 0 4px 6px var(--shadow);
  transition: transform 0.2s;
}

.post-card:hover {
  transform: translateY(-4px);
}

.post-card-thumbnail {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.post-card-content {
  padding: 1rem;
}

.post-card-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.post-card-excerpt {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

.post-card-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.post-detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem;
}

.post-detail-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.post-detail-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  display: block;
}

.post-detail-content {
  line-height: 1.8;
}

.sidebar {
  background: var(--card);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border);
}

.sidebar-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
}

.sidebar-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.blog-footer {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  border-top: 1px solid var(--border);
  background: var(--card);
}`
}

interface Blog {
  id: string
  name: string
  description: string | null
}

type TemplateKey = 'html_template' | 'custom_css'

const TEMPLATE_SECTIONS: { key: TemplateKey; label: string; icon: string; description: string }[] = [
  { key: 'html_template', label: 'HTML', icon: '📄', description: '전체 HTML 템플릿' },
  { key: 'custom_css', label: 'CSS', icon: '🎨', description: '커스텀 스타일시트' },
]

export default function CustomSkinEditorPage() {
  const router = useRouter()
  const toast = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [customSkin, setCustomSkin] = useState<BlogCustomSkin | null>(null)
  const [editedData, setEditedData] = useState<CustomSkinUpdateData>({})
  const [activeSection, setActiveSection] = useState<TemplateKey>('html_template')
  const [hasChanges, setHasChanges] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        toast.showToast('로그인이 필요합니다', 'error')
        router.push('/skins')
        return
      }

      // 블로그 조회
      const { data: blogs } = await supabase
        .from('blogs')
        .select('id, name, description')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!blogs || blogs.length === 0) {
        toast.showToast('블로그를 먼저 만들어주세요', 'error')
        router.push('/create-blog')
        return
      }

      const blogData = blogs[0]
      setBlog(blogData)

      // 커스텀 스킨 조회
      try {
        const skin = await getCustomSkin(blogData.id)
        if (skin) {
          setCustomSkin(skin)
          // 기존 개별 섹션들을 하나의 html_template으로 병합
          const mergedHtml = [
            skin.html_header,
            skin.html_post_list,
            skin.html_post_item,
            skin.html_post_detail,
            skin.html_sidebar,
            skin.html_footer,
          ].filter(Boolean).join('\n\n')

          setEditedData({
            html_template: mergedHtml || getDefaultHTMLTemplate(),
            custom_css: skin.custom_css,
            is_active: skin.is_active,
          })
        } else {
          // 기본 템플릿으로 초기화
          setEditedData({
            html_template: getDefaultHTMLTemplate(),
            custom_css: getDefaultCSS(),
          })
        }
      } catch (err) {
        console.error('Failed to load custom skin:', err)
        setEditedData({
          html_template: getDefaultHTMLTemplate(),
          custom_css: getDefaultCSS(),
        })
      }

      setLoading(false)
    }

    fetchData()
  }, [router, toast])

  // 에디터 값 변경
  const handleEditorChange = useCallback((key: TemplateKey, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }, [])

  // AI 생성 디자인 자동 적용 (HTML + CSS)
  const handleApplyDesign = useCallback((sections: Record<string, string>) => {
    if (sections.html_template) {
      setEditedData(prev => ({ ...prev, html_template: sections.html_template }))
    }
    if (sections.custom_css) {
      setEditedData(prev => ({ ...prev, custom_css: sections.custom_css }))
    }
    setHasChanges(true)
    toast.showToast('디자인이 적용되었습니다')
  }, [toast])

  // 저장
  const handleSave = async () => {
    if (!blog) return

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
      const saved = await saveCustomSkin(blog.id, saveData)
      setCustomSkin(saved)
      setHasChanges(false)
      toast.showToast('저장되었습니다')
    } catch (err) {
      console.error('Save failed:', err)
      toast.showToast('저장에 실패했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 활성화/비활성화 토글
  const handleToggle = async () => {
    if (!blog) return

    // 먼저 저장되지 않은 변경사항이 있으면 저장
    if (hasChanges) {
      await handleSave()
    }

    try {
      const newIsActive = !editedData.is_active
      const updated = await toggleCustomSkin(blog.id, newIsActive)
      setCustomSkin(updated)
      setEditedData(prev => ({ ...prev, is_active: newIsActive }))
      toast.showToast(newIsActive ? '커스텀 스킨이 활성화되었습니다' : '커스텀 스킨이 비활성화되었습니다')
    } catch (err) {
      console.error('Toggle failed:', err)
      toast.showToast('상태 변경에 실패했습니다', 'error')
    }
  }

  // 초기화
  const handleReset = async () => {
    if (!blog) return

    if (!confirm('모든 커스텀 스킨 내용이 삭제됩니다. 계속하시겠습니까?')) {
      return
    }

    try {
      await resetCustomSkin(blog.id)
      setEditedData({
        html_template: getDefaultHTMLTemplate(),
        custom_css: getDefaultCSS(),
      })
      setCustomSkin(null)
      setHasChanges(false)
      toast.showToast('초기화되었습니다')
    } catch (err) {
      console.error('Reset failed:', err)
      toast.showToast('초기화에 실패했습니다', 'error')
    }
  }

  // 기본 템플릿 불러오기
  const handleLoadDefault = (key: TemplateKey) => {
    const defaultValue = key === 'html_template' ? getDefaultHTMLTemplate() : getDefaultCSS()
    handleEditorChange(key, defaultValue)
    toast.showToast('기본 템플릿을 불러왔습니다')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white" />
      </div>
    )
  }

  const currentValue = editedData[activeSection] as string || ''
  const isCSS = activeSection === 'custom_css'

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* 상단 툴바 */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/skins')}
            className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            스킨 설정
          </button>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
          <div>
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-white">
              커스텀 스킨 에디터
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {blog?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 상태 표시 */}
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              저장되지 않은 변경사항
            </span>
          )}

          {/* 활성화 토글 */}
          <button
            onClick={handleToggle}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              editedData.is_active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${editedData.is_active ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
            {editedData.is_active ? '활성화됨' : '비활성화'}
          </button>

          {/* 초기화 */}
          <button
            onClick={handleReset}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            초기화
          </button>

          {/* 저장 */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="rounded-lg bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 사이드바 - 섹션 선택 */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              템플릿 섹션
            </div>
            <div className="space-y-1">
              {TEMPLATE_SECTIONS.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                    activeSection === section.key
                      ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <span className="text-base">{section.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{section.label}</div>
                    <div className="truncate text-xs text-neutral-400">{section.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 변수 참조 버튼 */}
          <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="flex w-full items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                변수 참조
              </span>
              <svg className={`h-4 w-4 transition-transform ${showVariables ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메인 에디터 영역 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 에디터 헤더 */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-100 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-lg">{TEMPLATE_SECTIONS.find(s => s.key === activeSection)?.icon}</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {TEMPLATE_SECTIONS.find(s => s.key === activeSection)?.label}
              </span>
              <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                {isCSS ? 'CSS' : 'HTML'}
              </span>
            </div>
            <button
              onClick={() => handleLoadDefault(activeSection)}
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              기본 템플릿 불러오기
            </button>
          </div>

          {/* 코드 에디터 */}
          <div className="flex-1 overflow-hidden">
            <textarea
              value={currentValue}
              onChange={(e) => handleEditorChange(activeSection, e.target.value)}
              className="h-full w-full resize-none border-0 bg-neutral-900 p-4 font-mono text-sm leading-relaxed text-neutral-100 outline-none"
              placeholder={isCSS ? '/* CSS 코드를 입력하세요 */' : '<!-- HTML 코드를 입력하세요 -->'}
              spellCheck={false}
            />
          </div>
        </div>

        {/* 오른쪽 패널 - 변수 참조 */}
        {showVariables && (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="p-4">
              <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-white">
                사용 가능한 변수
              </h3>

              {/* 블로그 변수 */}
              <div className="mb-6">
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  블로그
                </h4>
                <div className="space-y-1.5">
                  {TEMPLATE_VARIABLES.blog.map((v) => (
                    <div key={v.name} className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                      <code className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {`{{${v.name}}}`}
                      </code>
                      <p className="mt-0.5 text-xs text-neutral-500">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 게시글 변수 */}
              <div className="mb-6">
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  게시글
                </h4>
                <div className="space-y-1.5">
                  {TEMPLATE_VARIABLES.post.map((v) => (
                    <div key={v.name} className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                      <code className="text-xs font-medium text-green-600 dark:text-green-400">
                        {`{{${v.name}}}`}
                      </code>
                      <p className="mt-0.5 text-xs text-neutral-500">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 반복/조건문 */}
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  반복 / 조건문
                </h4>
                <div className="space-y-1.5">
                  {TEMPLATE_VARIABLES.loop.map((v) => (
                    <div key={v.name} className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-800">
                      <code className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        {v.name}
                      </code>
                      <p className="mt-0.5 text-xs text-neutral-500">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        onApplyDesign={handleApplyDesign}
        isOpen={showAIChat}
        onToggle={() => setShowAIChat(!showAIChat)}
        currentSections={editedData}
      />
    </div>
  )
}
