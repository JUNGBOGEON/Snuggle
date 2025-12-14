'use client'

import { ReactNode } from 'react'
import { LayoutConfig } from '@/lib/api/skins'

interface BlogLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  layout: LayoutConfig['layout']
  className?: string
}

export default function BlogLayout({
  children,
  sidebar,
  layout,
  className = '',
}: BlogLayoutProps) {
  // no-sidebar: 사이드바 없이 중앙 배치
  if (layout === 'no-sidebar') {
    return (
      <div className={`mx-auto max-w-3xl ${className}`}>
        {children}
      </div>
    )
  }

  // sidebar-left: 왼쪽 사이드바
  if (layout === 'sidebar-left') {
    return (
      <div className={`flex gap-10 ${className}`}>
        <aside className="w-80 shrink-0">{sidebar}</aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    )
  }

  // sidebar-right (기본값): 오른쪽 사이드바
  return (
    <div className={`flex gap-10 ${className}`}>
      <main className="flex-1 min-w-0">{children}</main>
      <aside className="w-80 shrink-0">{sidebar}</aside>
    </div>
  )
}
