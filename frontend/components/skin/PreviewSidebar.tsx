'use client'

import { SkinCssVariables } from '@/lib/api/skins'

interface PreviewSidebarProps {
  cssVars: SkinCssVariables
  blogName?: string
  blogDescription?: string | null
  displayImage?: string | null
  postCount?: number
  subscriberCount?: number
  visitorCount?: number
}

export default function PreviewSidebar({
  cssVars,
  blogName = '내 블로그',
  blogDescription,
  displayImage,
  postCount = 0,
  subscriberCount = 0,
  visitorCount = 0,
}: PreviewSidebarProps) {
  return (
    <div className="space-y-4">
      {/* 프로필 카드 */}
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: cssVars['--blog-border'],
          backgroundColor: cssVars['--blog-card-bg'],
        }}
      >
        {/* 프로필 */}
        <div className="flex flex-col items-center">
          <div
            className="h-20 w-20 overflow-hidden rounded-2xl"
            style={{ backgroundColor: cssVars['--blog-muted'] + '15' }}
          >
            {displayImage && (
              <img
                src={displayImage}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <h3
            className="mt-3 text-lg font-bold"
            style={{ color: cssVars['--blog-fg'] }}
          >
            {blogName}
          </h3>

          {/* 구독 버튼 */}
          <button
            className="mt-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: cssVars['--blog-accent'],
              color: cssVars['--blog-bg'],
            }}
          >
            구독하기
          </button>

          {blogDescription && (
            <p
              className="mt-3 text-center text-sm"
              style={{ color: cssVars['--blog-muted'] }}
            >
              {blogDescription}
            </p>
          )}
        </div>

        {/* 통계 */}
        <div
          className="mt-5 flex justify-center gap-6"
        >
          <div className="text-center">
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
          <div className="text-center">
            <p
              className="text-xl font-bold"
              style={{ color: cssVars['--blog-fg'] }}
            >
              {subscriberCount}
            </p>
            <p
              className="text-xs"
              style={{ color: cssVars['--blog-muted'] }}
            >
              구독자
            </p>
          </div>
          <div className="text-center">
            <p
              className="text-xl font-bold"
              style={{ color: cssVars['--blog-fg'] }}
            >
              {visitorCount}
            </p>
            <p
              className="text-xs"
              style={{ color: cssVars['--blog-muted'] }}
            >
              방문자
            </p>
          </div>
        </div>
      </div>

      {/* 블로그 정보 */}
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: cssVars['--blog-border'],
          backgroundColor: cssVars['--blog-card-bg'],
        }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: cssVars['--blog-fg'] }}
        >
          블로그 정보
        </h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: cssVars['--blog-muted'] }}>개설일</span>
            <span style={{ color: cssVars['--blog-fg'] }}>2024년 1월 1일</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: cssVars['--blog-muted'] }}>총 게시글</span>
            <span style={{ color: cssVars['--blog-fg'] }}>{postCount}개</span>
          </div>
        </div>
      </div>
    </div>
  )
}
