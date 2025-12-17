import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// CSS 변수 타입
export interface SkinCssVariables {
  '--blog-bg': string
  '--blog-fg': string
  '--blog-accent': string
  '--blog-muted': string
  '--blog-border': string
  '--blog-card-bg': string
  '--blog-dark-bg': string
  '--blog-dark-fg': string
  '--blog-dark-accent': string
  '--blog-dark-muted': string
  '--blog-dark-border': string
  '--blog-dark-card-bg': string
  '--blog-font-sans': string
  '--blog-font-mono': string
  '--blog-content-width': string
  '--blog-border-radius': string
  [key: string]: string
}

// 레이아웃 설정 타입
export interface LayoutConfig {
  layout: 'sidebar-right' | 'sidebar-left' | 'no-sidebar'
  postListStyle: 'cards' | 'list' | 'grid'
  showThumbnails: boolean
}

// 스킨 타입
export interface BlogSkin {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  is_system: boolean
  css_variables: SkinCssVariables
  layout_config: LayoutConfig | null
  created_at: string
}

// 블로그에 적용된 스킨 타입
export interface BlogSkinApplication {
  id: string
  blog_id: string
  skin_id: string | null
  custom_css_variables: Partial<SkinCssVariables> | null
  custom_layout_config: Partial<LayoutConfig> | null
  updated_at: string
  skin?: BlogSkin
}

// 시스템 스킨 목록 조회
export async function getSystemSkins(): Promise<BlogSkin[]> {
  const response = await fetch(`${API_URL}/api/skins`)

  if (!response.ok) {
    throw new Error('Failed to fetch skins')
  }

  return response.json()
}

// 스킨 상세 조회
export async function getSkin(id: string): Promise<BlogSkin> {
  const response = await fetch(`${API_URL}/api/skins/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch skin')
  }

  return response.json()
}

// 블로그에 적용된 스킨 조회
export async function getBlogSkin(blogId: string): Promise<BlogSkinApplication | null> {
  const response = await fetch(`${API_URL}/api/skins/blog/${blogId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch blog skin')
  }

  return response.json()
}

// 블로그에 스킨 적용
export async function applySkin(blogId: string, skinId: string): Promise<BlogSkinApplication> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/skins/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ blog_id: blogId, skin_id: skinId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to apply skin')
  }

  return response.json()
}

// 블로그 스킨 커스터마이징 저장
export async function saveSkinCustomization(
  blogId: string,
  data: {
    custom_css_variables?: Partial<SkinCssVariables>
    custom_layout_config?: Partial<LayoutConfig>
  }
): Promise<BlogSkinApplication> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/skins/customize/${blogId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save customization')
  }

  return response.json()
}

// 블로그 스킨 초기화
export async function resetBlogSkin(blogId: string): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/skins/blog/${blogId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to reset skin')
  }
}

// 사용자가 사용 가능한 스킨 목록 조회 (기본 제공 + 다운로드한 스킨)
export async function getAvailableSkins(): Promise<BlogSkin[]> {
  const token = await getAuthToken()

  const headers: HeadersInit = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/api/skins`, { headers })

  if (!response.ok) {
    throw new Error('Failed to fetch available skins')
  }

  return response.json()
}

// 마켓플레이스 스킨 목록 조회 (다운로드 가능한 스킨)
export async function getMarketplaceSkins(): Promise<BlogSkin[]> {
  const response = await fetch(`${API_URL}/api/skins/marketplace`)

  if (!response.ok) {
    throw new Error('Failed to fetch marketplace skins')
  }

  return response.json()
}

// 사용자의 스킨 라이브러리 조회 (다운로드한 스킨 ID 목록)
export interface SkinLibraryItem {
  skin_id: string
  downloaded_at: string
}

export async function getUserSkinLibrary(): Promise<SkinLibraryItem[]> {
  const token = await getAuthToken()

  if (!token) {
    return []
  }

  const response = await fetch(`${API_URL}/api/skins/library`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch skin library')
  }

  return response.json()
}

// 스킨 다운로드 (라이브러리에 추가)
export async function downloadSkin(skinId: string): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/skins/download/${skinId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to download skin')
  }
}

// 스킨 라이브러리에서 제거
export async function removeSkinFromLibrary(skinId: string): Promise<void> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/api/skins/library/${skinId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove skin from library')
  }
}

// 스킨 CSS 변수 병합 (기본 스킨 + 커스텀 오버라이드)
export function mergeSkinVariables(
  skin: BlogSkin | null,
  customVariables: Partial<SkinCssVariables> | null
): Partial<SkinCssVariables> {
  if (!skin) {
    return customVariables || {}
  }

  return {
    ...skin.css_variables,
    ...customVariables,
  }
}

// 레이아웃 설정 병합
export function mergeLayoutConfig(
  skin: BlogSkin | null,
  customConfig: Partial<LayoutConfig> | null
): LayoutConfig {
  const defaultConfig: LayoutConfig = {
    layout: 'sidebar-right',
    postListStyle: 'cards',
    showThumbnails: true,
  }

  return {
    ...defaultConfig,
    ...skin?.layout_config,
    ...customConfig,
  }
}

// ========================================
// 커스텀 스킨 (HTML/CSS 직접 편집) API
// ========================================

// 커스텀 스킨 타입
export interface BlogCustomSkin {
  id: string
  blog_id: string
  html_head: string
  html_header: string
  html_post_list: string
  html_post_item: string
  html_post_detail: string
  html_sidebar: string
  html_footer: string
  custom_css: string
  is_active: boolean
  use_default_header: boolean
  use_default_sidebar: boolean
  use_default_footer: boolean
  source_published_skin_id: string | null // 적용된 배포 스킨 ID
  created_at: string
  updated_at: string
}

// 커스텀 스킨 업데이트 데이터 타입
export interface CustomSkinUpdateData {
  html_template?: string  // 통합 HTML 템플릿 (에디터용)
  html_head?: string
  html_header?: string
  html_post_list?: string
  html_post_item?: string
  html_post_detail?: string
  html_sidebar?: string
  html_footer?: string
  custom_css?: string
  is_active?: boolean
  use_default_header?: boolean
  use_default_sidebar?: boolean
  use_default_footer?: boolean
}

// 블로그의 커스텀 스킨 조회 (Supabase 직접 사용)
export async function getCustomSkin(blogId: string): Promise<BlogCustomSkin | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('blog_custom_skins')
    .select('*')
    .eq('blog_id', blogId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 레코드 없음
      return null
    }
    throw new Error('Failed to fetch custom skin')
  }

  return data
}

// 블로그에 적용된 배포 스킨 ID 조회
export async function getAppliedPublishedSkinId(blogId: string): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('blog_custom_skins')
    .select('source_published_skin_id, is_active')
    .eq('blog_id', blogId)
    .single()

  if (error || !data) {
    return null
  }

  // 커스텀 스킨이 활성화되어 있고, 배포 스킨에서 적용된 경우에만 반환
  if (data.is_active && data.source_published_skin_id) {
    return data.source_published_skin_id
  }

  return null
}

// 커스텀 스킨 생성 또는 업데이트 (Supabase 직접 사용)
export async function saveCustomSkin(
  blogId: string,
  data: CustomSkinUpdateData
): Promise<BlogCustomSkin> {
  const supabase = createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // 블로그 소유권 확인
  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .select('user_id')
    .eq('id', blogId)
    .single()

  if (blogError || !blog) {
    throw new Error('Blog not found')
  }

  if (blog.user_id !== user.id) {
    throw new Error('Not authorized')
  }

  // 기존 레코드 확인
  const { data: existing } = await supabase
    .from('blog_custom_skins')
    .select('id')
    .eq('blog_id', blogId)
    .single()

  if (existing) {
    // 업데이트
    // html_template가 있으면 Unified Mode로 처리
    const updateData = { ...data }
    if (updateData.html_template) {
      updateData.html_header = updateData.html_template
      // Unified Mode 감지를 위해 다른 섹션 비우기
      updateData.html_post_list = ''
      updateData.html_sidebar = ''
      updateData.html_footer = ''
      // DB에 없는 필드 제거
      delete updateData.html_template
    }

    const { data: updated, error: updateError } = await supabase
      .from('blog_custom_skins')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('blog_id', blogId)
      .select()
      .single()

    if (updateError) {
      throw new Error('Failed to update custom skin')
    }

    return updated
  } else {
    // 새로 생성
    const defaults = getDefaultTemplates()
    const isUnified = !!data.html_template

    const { data: created, error: createError } = await supabase
      .from('blog_custom_skins')
      .insert({
        blog_id: blogId,
        html_head: data.html_head ?? defaults.html_head,
        // Unified Mode면 html_template 사용, 아니면 html_header
        html_header: isUnified ? data.html_template : (data.html_header ?? defaults.html_header),
        // Unified Mode면 빈 문자열, 아니면 기존 로직
        html_post_list: isUnified ? '' : (data.html_post_list ?? defaults.html_post_list),
        html_post_item: data.html_post_item ?? defaults.html_post_item, // post_item은 partials로 쓰일 수 있음
        html_post_detail: data.html_post_detail ?? defaults.html_post_detail,
        html_sidebar: isUnified ? '' : (data.html_sidebar ?? defaults.html_sidebar),
        html_footer: isUnified ? '' : (data.html_footer ?? defaults.html_footer),
        custom_css: data.custom_css ?? defaults.custom_css,
        is_active: data.is_active ?? false,
        use_default_header: data.use_default_header ?? true,
        use_default_sidebar: data.use_default_sidebar ?? true,
        use_default_footer: data.use_default_footer ?? true,
      })
      .select()
      .single()

    if (createError) {
      throw new Error('Failed to create custom skin')
    }

    return created
  }
}

// 커스텀 스킨 활성화/비활성화 (Supabase 직접 사용)
export async function toggleCustomSkin(blogId: string, isActive: boolean): Promise<BlogCustomSkin> {
  const supabase = createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // 블로그 소유권 확인
  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .select('user_id')
    .eq('id', blogId)
    .single()

  if (blogError || !blog) {
    throw new Error('Blog not found')
  }

  if (blog.user_id !== user.id) {
    throw new Error('Not authorized')
  }

  // 기존 레코드 확인
  const { data: existing } = await supabase
    .from('blog_custom_skins')
    .select('id')
    .eq('blog_id', blogId)
    .single()

  if (existing) {
    // 업데이트
    const { data: updated, error: updateError } = await supabase
      .from('blog_custom_skins')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('blog_id', blogId)
      .select()
      .single()

    if (updateError) {
      throw new Error('Failed to toggle custom skin')
    }

    return updated
  } else {
    // 새로 생성
    const defaults = getDefaultTemplates()
    const { data: created, error: createError } = await supabase
      .from('blog_custom_skins')
      .insert({
        blog_id: blogId,
        html_head: defaults.html_head,
        html_header: defaults.html_header,
        html_post_list: defaults.html_post_list,
        html_post_item: defaults.html_post_item,
        html_post_detail: defaults.html_post_detail,
        html_sidebar: defaults.html_sidebar,
        html_footer: defaults.html_footer,
        custom_css: defaults.custom_css,
        is_active: isActive,
        use_default_header: true,
        use_default_sidebar: true,
        use_default_footer: true,
      })
      .select()
      .single()

    if (createError) {
      throw new Error('Failed to create custom skin')
    }

    return created
  }
}

// 커스텀 스킨 삭제 (초기화)
export async function resetCustomSkin(blogId: string): Promise<void> {
  const supabase = createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // 블로그 소유권 확인
  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .select('user_id')
    .eq('id', blogId)
    .single()

  if (blogError || !blog) {
    throw new Error('Blog not found')
  }

  if (blog.user_id !== user.id) {
    throw new Error('Not authorized')
  }

  const { error } = await supabase
    .from('blog_custom_skins')
    .delete()
    .eq('blog_id', blogId)

  if (error) {
    throw new Error('Failed to reset custom skin')
  }
}

// 기본 템플릿 가져오기 (실제 사이트 디자인 기반)
export function getDefaultTemplates(): Omit<BlogCustomSkin, 'id' | 'blog_id' | 'created_at' | 'updated_at'> {
  return {
    html_head: `<!-- 외부 폰트, 메타태그 등을 추가하세요 -->`,

    html_header: `<header class="blog-header">
  <div class="header-inner">
    <div class="header-left">
      <a href="/" class="logo">Snuggle</a>
      <span class="divider">/</span>
      <a href="/blog/{{blog_id}}" class="blog-name">{{blog_name}}</a>
    </div>
    <div class="header-right">
      <nav class="header-nav">
        <a href="/" class="nav-link">홈</a>
        <a href="/feed" class="nav-link">피드</a>
        <a href="/skins" class="nav-link">스킨</a>
        <a href="/forum" class="nav-link">포럼</a>
      </nav>
      <a href="/blog/{{blog_id}}/write" class="write-btn">글쓰기</a>
    </div>
  </div>
</header>`,

    html_post_list: `<div class="post-list">
  <div class="post-list-header">
    <h2 class="section-title">게시글</h2>
    <span class="post-count">{{post_count}}개</span>
  </div>
  <div class="posts-container">
    {{#posts}}
    {{> post_item}}
    {{/posts}}
  </div>
  {{#if no_posts}}
  <div class="empty-state">
    <div class="empty-icon">📝</div>
    <p>아직 작성된 글이 없습니다</p>
  </div>
  {{/if}}
</div>`,

    html_post_item: `<article class="post-item">
  <a href="/post/{{post_id}}" class="post-link">
    <div class="post-content">
      <h3 class="post-title">{{post_title}}</h3>
      <p class="post-excerpt">{{post_excerpt}}</p>
      <div class="post-meta">
        <span class="post-date">{{post_date}}</span>
        <span class="meta-divider">·</span>
        <span class="post-views">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {{view_count}}
        </span>
        <span class="post-likes">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {{like_count}}
        </span>
      </div>
    </div>
    {{#if thumbnail_url}}
    <div class="post-thumbnail">
      <img src="{{thumbnail_url}}" alt="{{post_title}}">
    </div>
    {{/if}}
  </a>
</article>`,

    html_post_detail: `<article class="post-detail">
  <header class="post-header">
    {{#if category_name}}
    <span class="post-category">{{category_name}}</span>
    {{/if}}
    <h1 class="post-title">{{post_title}}</h1>
    <div class="post-meta">
      <span class="post-date">{{post_date}}</span>
      <span class="meta-divider">·</span>
      <span class="post-views">조회 {{view_count}}</span>
      <span class="meta-divider">·</span>
      <span class="post-likes">좋아요 {{like_count}}</span>
    </div>
  </header>
  {{#if thumbnail_url}}
  <div class="post-thumbnail">
    <img src="{{thumbnail_url}}" alt="{{post_title}}">
  </div>
  {{/if}}
  <div class="post-body">
    {{post_content}}
  </div>
</article>`,

    html_sidebar: `<aside class="blog-sidebar">
  <!-- 프로필 카드 -->
  <div class="profile-card">
    <div class="profile-image-wrap">
      {{#if profile_image}}
      <img src="{{profile_image}}" alt="{{blog_name}}" class="profile-image">
      {{/if}}
    </div>
    <h1 class="profile-name">{{blog_name}}</h1>
    <button class="subscribe-btn">구독하기</button>
    {{#if blog_description}}
    <p class="profile-desc">{{blog_description}}</p>
    {{/if}}
    <div class="profile-stats">
      <div class="stat-item">
        <span class="stat-value">{{post_count}}</span>
        <span class="stat-label">게시글</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{subscriber_count}}</span>
        <span class="stat-label">구독자</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{visitor_count}}</span>
        <span class="stat-label">방문자</span>
      </div>
    </div>
  </div>

  <!-- 블로그 정보 -->
  <div class="info-card">
    <h3 class="info-title">블로그 정보</h3>
    <div class="info-row">
      <span class="info-label">개설일</span>
      <span class="info-value">{{created_date}}</span>
    </div>
    <div class="info-row">
      <span class="info-label">총 게시글</span>
      <span class="info-value">{{post_count}}개</span>
    </div>
  </div>
</aside>`,

    html_footer: `<footer class="blog-footer">
  <p>&copy; {{current_year}} {{blog_name}}. Powered by Snuggle.</p>
</footer>`,

    custom_css: `/* ======================================== */
/* 스킨 기본 스타일 - 실제 사이트 디자인 기반 */
/* CSS 변수를 사용하여 스킨 테마에 맞게 자동 적용 */
/* ======================================== */

/* 페이지 전체 배경 */
.custom-skin-wrapper {
  background-color: var(--blog-bg, #ffffff);
  color: var(--blog-fg, #000000);
}

/* 헤더 */
.blog-header {
  position: relative;
  z-index: 40;
  border-bottom: 1px solid var(--blog-border, #e5e5e5);
  background-color: var(--blog-bg, #ffffff);
}

.blog-header .header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.blog-header .header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.blog-header .logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--blog-fg, #000000);
  text-decoration: none;
  transition: opacity 0.2s;
}

.blog-header .logo:hover {
  opacity: 0.7;
}

.blog-header .divider {
  color: var(--blog-muted, #666666);
  font-size: 1.125rem;
}

.blog-header .blog-name {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--blog-fg, #000000);
  text-decoration: none;
  transition: opacity 0.2s;
}

.blog-header .blog-name:hover {
  opacity: 0.7;
}

.blog-header .header-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.blog-header .nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--blog-muted, #666666);
  text-decoration: none;
  transition: opacity 0.2s;
}

.blog-header .nav-link:hover {
  opacity: 0.7;
}

.blog-header .nav-link.active {
  color: var(--blog-fg, #000000);
  font-weight: 700;
}

.blog-header .header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.blog-header .write-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--blog-bg, #ffffff);
  background-color: var(--blog-accent, #000000);
  border-radius: 0.5rem;
  text-decoration: none;
  transition: opacity 0.2s;
}

.blog-header .write-btn:hover {
  opacity: 0.9;
}

/* 게시글 목록 */
.post-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--blog-fg, #000000);
}

.post-count {
  font-size: 0.875rem;
  color: var(--blog-muted, #666666);
}

.posts-container {
  border-top: 1px solid var(--blog-border, #e5e5e5);
}

.post-item {
  border-bottom: 1px solid var(--blog-border, #e5e5e5);
}

.post-item .post-link {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 0;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;
}

.post-item .post-link:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.post-item .post-content {
  flex: 1;
  min-width: 0;
}

.post-item .post-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--blog-fg, #000000);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.post-item .post-link:hover .post-title {
  opacity: 0.8;
}

.post-item .post-excerpt {
  font-size: 0.875rem;
  color: var(--blog-muted, #666666);
  margin: 0.375rem 0 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  white-space: pre-wrap;
}

.post-item .post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--blog-muted, #666666);
  opacity: 0.7;
}

.post-item .meta-divider {
  color: var(--blog-border, #e5e5e5);
}

.post-item .post-views,
.post-item .post-likes {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  opacity: 0.6;
}

.post-item .icon {
  width: 14px;
  height: 14px;
}

.post-item .post-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  overflow: hidden;
  flex-shrink: 0;
}

.post-item .post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 빈 상태 */
.empty-state {
  padding: 5rem 0;
  text-align: center;
}

.empty-state .empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.empty-state p {
  color: var(--blog-muted, #666666);
}

/* 게시글 상세 */
.post-detail .post-header {
  margin-bottom: 2rem;
}

.post-detail .post-category {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--blog-accent, #000000);
  margin-bottom: 0.5rem;
}

.post-detail .post-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--blog-fg, #000000);
  margin: 0 0 1rem;
  line-height: 1.3;
}

.post-detail .post-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--blog-muted, #666666);
}

.post-detail .meta-divider {
  opacity: 0.5;
}

.post-detail .post-thumbnail {
  margin: 2rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.post-detail .post-thumbnail img {
  width: 100%;
  height: auto;
}

.post-detail .post-body {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--blog-fg, #000000);
}

/* 사이드바 */
.blog-sidebar {
  position: sticky;
  top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 프로필 카드 */
.profile-card {
  border: 1px solid var(--blog-border, #e5e5e5);
  border-radius: 1rem;
  background-color: var(--blog-card-bg, #fafafa);
  padding: 1.5rem;
  text-align: center;
}

.profile-image-wrap {
  width: 96px;
  height: 96px;
  margin: 0 auto;
  border-radius: 1rem;
  background-color: var(--blog-muted, #666666);
  opacity: 0.1;
  overflow: hidden;
}

.profile-image-wrap:has(img) {
  opacity: 1;
  background-color: transparent;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--blog-fg, #000000);
  margin: 1rem 0 0;
}

.subscribe-btn {
  margin-top: 0.5rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--blog-bg, #ffffff);
  background-color: var(--blog-accent, #000000);
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.subscribe-btn:hover {
  opacity: 0.9;
}

.profile-desc {
  font-size: 0.875rem;
  color: var(--blog-muted, #666666);
  margin: 0.75rem 0 0;
}

.profile-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.5rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--blog-fg, #000000);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--blog-muted, #666666);
}

/* 블로그 정보 카드 */
.info-card {
  border: 1px solid var(--blog-border, #e5e5e5);
  border-radius: 1rem;
  background-color: var(--blog-card-bg, #fafafa);
  padding: 1.5rem;
}

.info-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--blog-fg, #000000);
  margin: 0 0 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-top: 0.75rem;
}

.info-row:first-of-type {
  margin-top: 0;
}

.info-label {
  color: var(--blog-muted, #666666);
}

.info-value {
  color: var(--blog-fg, #000000);
}

/* 푸터 */
.blog-footer {
  padding: 2rem;
  border-top: 1px solid var(--blog-border, #e5e5e5);
  text-align: center;
  font-size: 0.875rem;
  color: var(--blog-muted, #666666);
}`,

    is_active: false,
    use_default_header: false,
    use_default_sidebar: false,
    use_default_footer: false,
    source_published_skin_id: null,
  }
}

// ========================================
// 배포된 스킨 (마켓플레이스) API
// ========================================

// 배포된 스킨 타입
export interface PublishedSkin {
  id: string
  source_blog_id: string | null
  creator_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  html_head: string
  html_header: string
  html_post_list: string
  html_post_item: string
  html_post_detail: string
  html_sidebar: string
  html_footer: string
  custom_css: string
  use_default_header: boolean
  use_default_sidebar: boolean
  use_default_footer: boolean
  is_public: boolean
  download_count: number
  created_at: string
  updated_at: string
  // 제작자 정보 (join)
  creator?: {
    nickname: string | null
    profile_image_url: string | null
  }
}

// 스킨 배포 데이터 타입
export interface PublishSkinData {
  name: string
  description?: string
  thumbnail_url?: string
  is_public: boolean // true = 공개, false = 비공개(나만 사용)
}

// 스킨 배포하기 (blog_custom_skins -> published_skins)
export async function publishSkin(
  blogId: string,
  data: PublishSkinData
): Promise<PublishedSkin> {
  const supabase = createClient()

  // 현재 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // 블로그 소유권 확인
  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .select('user_id')
    .eq('id', blogId)
    .single()

  if (blogError || !blog) {
    throw new Error('Blog not found')
  }

  if (blog.user_id !== user.id) {
    throw new Error('Not authorized')
  }

  // 현재 커스텀 스킨 가져오기
  const { data: customSkin, error: skinError } = await supabase
    .from('blog_custom_skins')
    .select('*')
    .eq('blog_id', blogId)
    .single()

  if (skinError || !customSkin) {
    throw new Error('Custom skin not found')
  }

  // 배포된 스킨 생성
  const { data: published, error: publishError } = await supabase
    .from('published_skins')
    .insert({
      source_blog_id: blogId,
      creator_id: user.id,
      name: data.name,
      description: data.description || null,
      thumbnail_url: data.thumbnail_url || null,
      html_head: customSkin.html_head,
      html_header: customSkin.html_header,
      html_post_list: customSkin.html_post_list,
      html_post_item: customSkin.html_post_item,
      html_post_detail: customSkin.html_post_detail,
      html_sidebar: customSkin.html_sidebar,
      html_footer: customSkin.html_footer,
      custom_css: customSkin.custom_css,
      use_default_header: customSkin.use_default_header,
      use_default_sidebar: customSkin.use_default_sidebar,
      use_default_footer: customSkin.use_default_footer,
      is_public: data.is_public,
    })
    .select()
    .single()

  if (publishError) {
    console.error('Publish error:', publishError)
    throw new Error('Failed to publish skin')
  }

  return published
}

// 배포된 스킨 업데이트
export async function updatePublishedSkin(
  skinId: string,
  data: Partial<PublishSkinData>
): Promise<PublishedSkin> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: updated, error } = await supabase
    .from('published_skins')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', skinId)
    .eq('creator_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update published skin')
  }

  return updated
}

// 배포된 스킨 삭제
export async function deletePublishedSkin(skinId: string): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('published_skins')
    .delete()
    .eq('id', skinId)
    .eq('creator_id', user.id)

  if (error) {
    throw new Error('Failed to delete published skin')
  }
}

// 공개 스킨 목록 조회 (마켓플레이스)
export async function getPublicSkins(): Promise<PublishedSkin[]> {
  const supabase = createClient()

  // 먼저 공개 스킨 목록 조회
  const { data: skins, error: skinsError } = await supabase
    .from('published_skins')
    .select('*')
    .eq('is_public', true)
    .order('download_count', { ascending: false })

  if (skinsError) {
    console.error('Error fetching public skins:', skinsError)
    throw new Error('Failed to fetch public skins')
  }

  if (!skins || skins.length === 0) {
    return []
  }

  // 제작자 ID 목록 추출
  const creatorIds = [...new Set(skins.map(s => s.creator_id))]

  // 프로필 정보 조회
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, profile_image_url')
    .in('id', creatorIds)

  // 프로필 맵 생성
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  // 스킨에 제작자 정보 추가
  return skins.map(skin => ({
    ...skin,
    creator: profileMap.get(skin.creator_id) || null,
  }))
}

// 내가 배포한 스킨 목록 조회
export async function getMyPublishedSkins(): Promise<PublishedSkin[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('published_skins')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch my published skins')
  }

  return data || []
}

// 배포된 스킨 상세 조회
export async function getPublishedSkin(skinId: string): Promise<PublishedSkin | null> {
  const supabase = createClient()

  const { data: skin, error } = await supabase
    .from('published_skins')
    .select('*')
    .eq('id', skinId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error('Failed to fetch published skin')
  }

  if (!skin) {
    return null
  }

  // 제작자 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nickname, profile_image_url')
    .eq('id', skin.creator_id)
    .single()

  return {
    ...skin,
    creator: profile || null,
  }
}

// 배포된 스킨을 내 블로그에 적용
export async function applyPublishedSkin(
  blogId: string,
  publishedSkinId: string
): Promise<BlogCustomSkin> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // 블로그 소유권 확인
  const { data: blog, error: blogError } = await supabase
    .from('blogs')
    .select('user_id')
    .eq('id', blogId)
    .single()

  if (blogError || !blog) {
    throw new Error('Blog not found')
  }

  if (blog.user_id !== user.id) {
    throw new Error('Not authorized')
  }

  // 배포된 스킨 가져오기
  const { data: publishedSkin, error: skinError } = await supabase
    .from('published_skins')
    .select('*')
    .eq('id', publishedSkinId)
    .single()

  if (skinError || !publishedSkin) {
    throw new Error('Published skin not found')
  }

  // 기존 커스텀 스킨 확인
  const { data: existing } = await supabase
    .from('blog_custom_skins')
    .select('id')
    .eq('blog_id', blogId)
    .single()

  const skinData = {
    html_head: publishedSkin.html_head,
    html_header: publishedSkin.html_header,
    html_post_list: publishedSkin.html_post_list,
    html_post_item: publishedSkin.html_post_item,
    html_post_detail: publishedSkin.html_post_detail,
    html_sidebar: publishedSkin.html_sidebar,
    html_footer: publishedSkin.html_footer,
    custom_css: publishedSkin.custom_css,
    use_default_header: publishedSkin.use_default_header,
    use_default_sidebar: publishedSkin.use_default_sidebar,
    use_default_footer: publishedSkin.use_default_footer,
    is_active: true,
    source_published_skin_id: publishedSkinId, // 적용된 배포 스킨 ID 저장
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from('blog_custom_skins')
      .update(skinData)
      .eq('blog_id', blogId)
      .select()
      .single()

    if (updateError) {
      throw new Error('Failed to apply skin')
    }

    return updated
  } else {
    const { data: created, error: createError } = await supabase
      .from('blog_custom_skins')
      .insert({
        blog_id: blogId,
        ...skinData,
      })
      .select()
      .single()

    if (createError) {
      throw new Error('Failed to apply skin')
    }

    return created
  }
}

// ========================================
// 커뮤니티 스킨 다운로드 API
// ========================================

// 배포된 스킨 다운로드 (라이브러리에 추가)
export async function downloadPublishedSkin(publishedSkinId: string): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // 이미 다운로드했는지 확인
  const { data: existing } = await supabase
    .from('user_skin_downloads')
    .select('id')
    .eq('user_id', user.id)
    .eq('published_skin_id', publishedSkinId)
    .maybeSingle()

  if (existing) {
    return // 이미 다운로드됨
  }

  // 다운로드 기록 추가
  const { error } = await supabase
    .from('user_skin_downloads')
    .insert({
      user_id: user.id,
      published_skin_id: publishedSkinId,
    })

  if (error) {
    throw new Error('Failed to download skin')
  }

  // 다운로드 카운트 증가
  const { data: skin } = await supabase
    .from('published_skins')
    .select('download_count')
    .eq('id', publishedSkinId)
    .single()

  if (skin) {
    await supabase
      .from('published_skins')
      .update({ download_count: (skin.download_count || 0) + 1 })
      .eq('id', publishedSkinId)
  }
}

// 사용자가 다운로드한 배포 스킨 목록 조회
export async function getMyDownloadedSkins(): Promise<PublishedSkin[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // 다운로드한 스킨 ID 목록 가져오기
  const { data: downloads, error: downloadError } = await supabase
    .from('user_skin_downloads')
    .select('published_skin_id')
    .eq('user_id', user.id)

  if (downloadError || !downloads || downloads.length === 0) {
    return []
  }

  const skinIds = downloads.map(d => d.published_skin_id)

  // 스킨 정보 가져오기
  const { data: skins, error: skinsError } = await supabase
    .from('published_skins')
    .select('*')
    .in('id', skinIds)

  if (skinsError || !skins) {
    return []
  }

  // 제작자 정보 가져오기
  const creatorIds = [...new Set(skins.map(s => s.creator_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, profile_image_url')
    .in('id', creatorIds)

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

  return skins.map(skin => ({
    ...skin,
    creator: profileMap.get(skin.creator_id) || null,
  }))
}

// 다운로드한 스킨 삭제
export async function removeDownloadedSkin(publishedSkinId: string): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // 먼저 삭제할 레코드가 있는지 확인
  const { data: existing } = await supabase
    .from('user_skin_downloads')
    .select('id')
    .eq('user_id', user.id)
    .eq('published_skin_id', publishedSkinId)
    .maybeSingle()

  if (!existing) {
    return // 이미 삭제됨
  }

  const { error } = await supabase
    .from('user_skin_downloads')
    .delete()
    .eq('user_id', user.id)
    .eq('published_skin_id', publishedSkinId)

  if (error) {
    throw new Error('Failed to remove downloaded skin')
  }

  // 다운로드 카운트 감소
  const { data: skin } = await supabase
    .from('published_skins')
    .select('download_count')
    .eq('id', publishedSkinId)
    .single()

  if (skin && skin.download_count > 0) {
    await supabase
      .from('published_skins')
      .update({ download_count: skin.download_count - 1 })
      .eq('id', publishedSkinId)
  }
}

// 템플릿에서 사용 가능한 변수 목록
export const TEMPLATE_VARIABLES = {
  blog: [
    { name: 'blog_id', description: '블로그 ID' },
    { name: 'blog_name', description: '블로그 이름' },
    { name: 'blog_description', description: '블로그 설명' },
    { name: 'profile_image', description: '프로필 이미지 URL' },
    { name: 'post_count', description: '총 게시글 수' },
    { name: 'subscriber_count', description: '구독자 수' },
    { name: 'visitor_count', description: '방문자 수' },
    { name: 'current_year', description: '현재 연도' },
  ],
  post: [
    { name: 'post_id', description: '게시글 ID' },
    { name: 'post_title', description: '게시글 제목' },
    { name: 'post_content', description: '게시글 내용 (HTML)' },
    { name: 'post_excerpt', description: '게시글 요약' },
    { name: 'post_date', description: '작성일' },
    { name: 'thumbnail_url', description: '썸네일 이미지 URL' },
    { name: 'category_name', description: '카테고리 이름' },
    { name: 'view_count', description: '조회수' },
    { name: 'like_count', description: '좋아요 수' },
  ],
  loop: [
    { name: '{{#posts}}...{{/posts}}', description: '게시글 목록 반복' },
    { name: '{{#categories}}...{{/categories}}', description: '카테고리 목록 반복' },
    { name: '{{#if condition}}...{{/if}}', description: '조건부 렌더링' },
    { name: '{{> post_item}}', description: '게시글 아이템 템플릿 삽입' },
  ],
}
