'use client'

import { LayoutConfig } from '@/lib/api/skins'

interface LayoutPickerProps {
  value: LayoutConfig
  onChange: (value: LayoutConfig) => void
}

export default function LayoutPicker({ value, onChange }: LayoutPickerProps) {
  const handleLayoutChange = (layout: LayoutConfig['layout']) => {
    onChange({ ...value, layout })
  }

  const handlePostListStyleChange = (postListStyle: LayoutConfig['postListStyle']) => {
    onChange({ ...value, postListStyle })
  }

  const handleThumbnailChange = (showThumbnails: boolean) => {
    onChange({ ...value, showThumbnails })
  }

  return (
    <div className="space-y-6">
      {/* 레이아웃 선택 */}
      <div>
        <label className="mb-3 block text-sm font-medium text-black/80 dark:text-white/80">
          레이아웃
        </label>
        <div className="grid grid-cols-3 gap-3">
          <LayoutOption
            selected={value.layout === 'sidebar-right'}
            onClick={() => handleLayoutChange('sidebar-right')}
            label="사이드바 오른쪽"
          >
            <div className="flex h-full gap-1">
              <div className="flex-1 rounded bg-black/20 dark:bg-white/20" />
              <div className="w-4 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </LayoutOption>

          <LayoutOption
            selected={value.layout === 'sidebar-left'}
            onClick={() => handleLayoutChange('sidebar-left')}
            label="사이드바 왼쪽"
          >
            <div className="flex h-full gap-1">
              <div className="w-4 rounded bg-black/10 dark:bg-white/10" />
              <div className="flex-1 rounded bg-black/20 dark:bg-white/20" />
            </div>
          </LayoutOption>

          <LayoutOption
            selected={value.layout === 'no-sidebar'}
            onClick={() => handleLayoutChange('no-sidebar')}
            label="사이드바 없음"
          >
            <div className="mx-auto h-full w-3/4 rounded bg-black/20 dark:bg-white/20" />
          </LayoutOption>
        </div>
      </div>

      {/* 게시글 목록 스타일 */}
      <div>
        <label className="mb-3 block text-sm font-medium text-black/80 dark:text-white/80">
          게시글 목록 스타일
        </label>
        <div className="grid grid-cols-3 gap-3">
          <LayoutOption
            selected={value.postListStyle === 'cards'}
            onClick={() => handlePostListStyleChange('cards')}
            label="카드형"
          >
            <div className="grid h-full grid-cols-2 gap-1">
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
            </div>
          </LayoutOption>

          <LayoutOption
            selected={value.postListStyle === 'list'}
            onClick={() => handlePostListStyleChange('list')}
            label="리스트형"
          >
            <div className="flex h-full flex-col gap-1">
              <div className="h-2 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-2 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-2 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-2 rounded bg-black/10 dark:bg-white/10" />
            </div>
          </LayoutOption>

          <LayoutOption
            selected={value.postListStyle === 'grid'}
            onClick={() => handlePostListStyleChange('grid')}
            label="그리드형"
          >
            <div className="grid h-full grid-cols-3 gap-1">
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
              <div className="rounded bg-black/10 dark:bg-white/10" />
            </div>
          </LayoutOption>
        </div>
      </div>

      {/* 썸네일 표시 */}
      <div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={value.showThumbnails}
            onChange={(e) => handleThumbnailChange(e.target.checked)}
            className="h-5 w-5 rounded border-black/20 text-black focus:ring-black dark:border-white/20 dark:text-white dark:focus:ring-white"
          />
          <span className="text-sm font-medium text-black/80 dark:text-white/80">
            게시글 썸네일 표시
          </span>
        </label>
      </div>
    </div>
  )
}

interface LayoutOptionProps {
  selected: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}

function LayoutOption({ selected, onClick, label, children }: LayoutOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
        selected
          ? 'border-black bg-black/5 dark:border-white dark:bg-white/5'
          : 'border-black/10 hover:border-black/30 dark:border-white/10 dark:hover:border-white/30'
      }`}
    >
      <div className="h-12 w-full">{children}</div>
      <span className="text-xs font-medium text-black/60 dark:text-white/60">{label}</span>
    </button>
  )
}
