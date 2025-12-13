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
  refreshSkin: async () => {},
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
      <div className="blog-skin-container" style={styleVariables as React.CSSProperties}>
        {children}
      </div>
    </BlogSkinContext.Provider>
  )
}
