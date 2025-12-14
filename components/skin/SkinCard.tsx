'use client'

import { BlogSkin } from '@/lib/api/skins'

interface SkinCardProps {
  skin: BlogSkin
  selected?: boolean
  onSelect?: () => void
  onPreview?: () => void
}

export default function SkinCard({ skin, selected, onSelect, onPreview }: SkinCardProps) {
  // 스킨의 주요 색상 추출
  const bgColor = skin.css_variables['--blog-bg'] || '#ffffff'
  const fgColor = skin.css_variables['--blog-fg'] || '#000000'
  const accentColor = skin.css_variables['--blog-accent'] || '#000000'

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
        selected
          ? 'border-black dark:border-white'
          : 'border-black/10 hover:border-black/30 dark:border-white/10 dark:hover:border-white/30'
      }`}
    >
      {/* 스킨 미리보기 */}
      <div
        className="aspect-[4/3] p-3"
        style={{ backgroundColor: bgColor }}
      >
        {/* 미니 레이아웃 미리보기 */}
        <div className="flex h-full flex-col gap-2">
          {/* 헤더 */}
          <div
            className="flex h-4 items-center justify-between rounded px-2"
            style={{ backgroundColor: `${fgColor}10` }}
          >
            <div
              className="h-2 w-8 rounded"
              style={{ backgroundColor: fgColor }}
            />
            <div className="flex gap-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>

          {/* 본문 */}
          <div className="flex flex-1 gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <div
                className="h-2 w-3/4 rounded"
                style={{ backgroundColor: fgColor, opacity: 0.6 }}
              />
              <div
                className="h-2 w-1/2 rounded"
                style={{ backgroundColor: fgColor, opacity: 0.4 }}
              />
              <div
                className="mt-1 h-8 rounded"
                style={{ backgroundColor: `${fgColor}10` }}
              />
            </div>
            {skin.layout_config?.layout !== 'no-sidebar' && (
              <div
                className="w-6 rounded"
                style={{ backgroundColor: `${fgColor}08` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 스킨 정보 */}
      <div className="border-t border-black/10 bg-white p-3 dark:border-white/10 dark:bg-zinc-900">
        <h3 className="font-medium text-black dark:text-white">{skin.name}</h3>
        {skin.description && (
          <p className="mt-1 text-xs text-black/60 dark:text-white/60">
            {skin.description}
          </p>
        )}
      </div>

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white"
          >
            미리보기
          </button>
        )}
        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black/80"
          >
            {selected ? '선택됨' : '선택'}
          </button>
        )}
      </div>

      {/* 선택 표시 */}
      {selected && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black dark:bg-white">
          <svg
            className="h-4 w-4 text-white dark:text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
