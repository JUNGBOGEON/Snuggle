'use client'

import { ReactNode } from 'react'
import { LayoutConfig, SkinCssVariables } from '@/lib/api/skins'

interface PreviewBlogLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  layout: LayoutConfig['layout']
  cssVars: SkinCssVariables
}

export default function PreviewBlogLayout({
  children,
  sidebar,
  layout,
  cssVars,
}: PreviewBlogLayoutProps) {
  // no-sidebar: 사이드바 없이 중앙 배치
  if (layout === 'no-sidebar') {
    return (
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </div>
    )
  }

  // sidebar-left: 왼쪽 사이드바
  if (layout === 'sidebar-left') {
    return (
      <div className="flex flex-1 gap-8 overflow-y-auto px-6 py-8">
        <aside className="w-72 shrink-0">{sidebar}</aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    )
  }

  // sidebar-right (기본값): 오른쪽 사이드바
  return (
    <div className="flex flex-1 gap-8 overflow-y-auto px-6 py-8">
      <div className="flex-1 min-w-0">{children}</div>
      <aside className="w-72 shrink-0">{sidebar}</aside>
    </div>
  )
}
