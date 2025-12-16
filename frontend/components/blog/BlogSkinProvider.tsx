'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import {
  getBlogSkin,
  BlogSkinApplication,
  BlogSkin,
  SkinCssVariables,
  LayoutConfig,
  mergeSkinVariables,
  mergeLayoutConfig,
} from '@/lib/api/skins'

// 색상 밝기 계산 (0-255, 높을수록 밝음)
function getColorBrightness(color: string): number {
  // hex 색상 처리
  let r = 0, g = 0, b = 0

  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    }
  }
  // rgb/rgba 색상 처리
  else if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g)
    if (match) {
      r = parseInt(match[0])
      g = parseInt(match[1])
      b = parseInt(match[2])
    }
  }

  // 밝기 계산 (YIQ 공식)
  return (r * 299 + g * 587 + b * 114) / 1000
}

// 어두운 배경인지 확인
function isDarkBackground(bgColor: string): boolean {
  return getColorBrightness(bgColor) < 128
}

interface BlogSkinContextType {
  skinApplication: BlogSkinApplication | null
  skin: BlogSkin | null
  cssVariables: Partial<SkinCssVariables>
  layoutConfig: LayoutConfig
  isLoading: boolean
  refreshSkin: () => Promise<void>
}

const defaultLayoutConfig: LayoutConfig = {
  layout: 'sidebar-right',
  postListStyle: 'cards',
  showThumbnails: true,
}

const BlogSkinContext = createContext<BlogSkinContextType>({
  skinApplication: null,
  skin: null,
  cssVariables: {},
  layoutConfig: defaultLayoutConfig,
  isLoading: true,
  refreshSkin: async () => { },
})

export function useBlogSkin() {
  const context = useContext(BlogSkinContext)
  if (!context) {
    throw new Error('useBlogSkin must be used within a BlogSkinProvider')
  }
  return context
}

interface BlogSkinProviderProps {
  blogId: string
  children: React.ReactNode
}

export default function BlogSkinProvider({ blogId, children }: BlogSkinProviderProps) {
  const [skinApplication, setSkinApplication] = useState<BlogSkinApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSkin = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getBlogSkin(blogId)
      setSkinApplication(data)
    } catch (error) {
      console.error('Failed to fetch blog skin:', error)
      setSkinApplication(null)
    } finally {
      setIsLoading(false)
    }
  }, [blogId])

  useEffect(() => {
    fetchSkin()
  }, [fetchSkin])

  const skin = skinApplication?.skin || null

  const cssVariables = useMemo(() => {
    return mergeSkinVariables(skin, skinApplication?.custom_css_variables || null)
  }, [skin, skinApplication?.custom_css_variables])

  const layoutConfig = useMemo(() => {
    return mergeLayoutConfig(skin, skinApplication?.custom_layout_config || null)
  }, [skin, skinApplication?.custom_layout_config])

  // CSS 변수를 인라인 스타일로 변환
  const styleVariables = useMemo(() => {
    const styles: Record<string, string> = {}
    for (const [key, value] of Object.entries(cssVariables)) {
      if (value) {
        styles[key] = value
      }
    }

    // 배경색 밝기에 따라 코드 하이라이팅 색상 자동 설정
    const bgColor = cssVariables['--blog-bg'] || '#ffffff'
    const isDark = isDarkBackground(bgColor)

    if (isDark) {
      // 어두운 배경용 코드 색상 (GitHub Dark 기반)
      styles['--blog-code-fg'] = '#c9d1d9'
      styles['--blog-code-keyword'] = '#ff7b72'
      styles['--blog-code-function'] = '#d2a8ff'
      styles['--blog-code-attr'] = '#79c0ff'
      styles['--blog-code-string'] = '#a5d6ff'
      styles['--blog-code-builtin'] = '#ffa657'
      styles['--blog-code-comment'] = '#8b949e'
      styles['--blog-code-tag'] = '#7ee787'
    } else {
      // 밝은 배경용 코드 색상 (GitHub Light 기반)
      styles['--blog-code-fg'] = '#24292e'
      styles['--blog-code-keyword'] = '#d73a49'
      styles['--blog-code-function'] = '#6f42c1'
      styles['--blog-code-attr'] = '#005cc5'
      styles['--blog-code-string'] = '#032f62'
      styles['--blog-code-builtin'] = '#e36209'
      styles['--blog-code-comment'] = '#6a737d'
      styles['--blog-code-tag'] = '#22863a'
    }

    return styles
  }, [cssVariables])

  const contextValue = useMemo(
    () => ({
      skinApplication,
      skin,
      cssVariables,
      layoutConfig,
      isLoading,
      refreshSkin: fetchSkin,
    }),
    [skinApplication, skin, cssVariables, layoutConfig, isLoading, fetchSkin]
  )

  return (
    <BlogSkinContext.Provider value={contextValue}>
      {/*
        blog-skin-scope 클래스로 시스템 dark 클래스의 영향을 격리
        스킨은 자체 CSS 변수만 사용하므로 시스템 테마와 독립적으로 동작
      */}
      <div
        className="blog-skin-container blog-skin-scope"
        style={styleVariables as React.CSSProperties}
        data-skin-active="true"
      >
        {children}
      </div>
    </BlogSkinContext.Provider>
  )
}
