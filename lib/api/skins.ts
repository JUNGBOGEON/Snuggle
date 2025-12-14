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
