'use client'

import { SkinCssVariables } from '@/lib/api/skins'

interface PreviewSidebarProps {
  cssVars: SkinCssVariables
  blogName?: string
  blogDescription?: string | null
  displayImage?: string | null
  postCount?: number
}

export default function PreviewSidebar({
  cssVars,
  blogName = '내 블로그',
  blogDescription,
  displayImage,
  postCount = 0,
}: PreviewSidebarProps) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: cssVars['--blog-border'],
        backgroundColor: cssVars['--blog-card-bg'],
      }}
    >
      {/* 프로필 */}
      <div className="flex flex-col items-center">
        {displayImage ? (
          <img
            src={displayImage}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
            style={{
              backgroundColor: cssVars['--blog-accent'],
              color: cssVars['--blog-bg'],
            }}
          >
            {blogName.charAt(0)}
          </div>
        )}
        <h3
          className="mt-3 font-semibold"
          style={{ color: cssVars['--blog-fg'] }}
        >
          {blogName}
        </h3>
        {blogDescription && (
          <p
            className="mt-1 text-center text-sm"
            style={{ color: cssVars['--blog-muted'] }}
          >
            {blogDescription}
          </p>
        )}
      </div>

      {/* 통계 */}
      <div
        className="mt-4 border-t pt-4 text-center"
        style={{ borderColor: cssVars['--blog-border'] }}
      >
        <p
          className="text-xl font-bold"
          style={{ color: cssVars['--blog-fg'] }}
        >
          {postCount}
        </p>
        <p
          className="text-xs"
          style={{ color: cssVars['--blog-muted'] }}
        >
          게시글
        </p>
      </div>
    </div>
  )
}
