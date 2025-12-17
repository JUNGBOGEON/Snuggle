// 공통 타입 정의

export interface Blog {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

export interface Profile {
  id: string
  nickname: string | null
  profile_image_url: string | null
}

// 미리보기용 데이터 타입
export interface PreviewPost {
  id: string
  title: string
  content?: string
  excerpt?: string
  thumbnail_url?: string | null
  created_at: string
  view_count?: number
  like_count?: number
  blog_id: string
  category?: { id: string; name: string }
}

export interface PreviewCategory {
  id: string
  name: string
}

export type TabType = 'all' | 'official' | 'community'
export type TemplateKey = 'html_template' | 'custom_css'
