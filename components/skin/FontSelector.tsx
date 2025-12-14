'use client'

interface FontSelectorProps {
  label: string
  value: string
  onChange: (value: string) => void
}

const FONT_OPTIONS = [
  { value: 'GMarketSans, sans-serif', label: 'GMarket Sans' },
  { value: 'Pretendard, GMarketSans, sans-serif', label: 'Pretendard' },
  { value: '"Noto Sans KR", sans-serif', label: 'Noto Sans KR' },
  { value: '"Nanum Gothic", sans-serif', label: '나눔고딕' },
  { value: '"Nanum Myeongjo", serif', label: '나눔명조' },
  { value: 'system-ui, sans-serif', label: '시스템 기본' },
]

const MONO_FONT_OPTIONS = [
  { value: 'monospace', label: '기본 모노스페이스' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
  { value: '"Fira Code", monospace', label: 'Fira Code' },
  { value: '"Source Code Pro", monospace', label: 'Source Code Pro' },
]

export default function FontSelector({ label, value, onChange }: FontSelectorProps) {
  const isMono = label.toLowerCase().includes('코드') || label.toLowerCase().includes('mono')
  const options = isMono ? MONO_FONT_OPTIONS : FONT_OPTIONS

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-black/80 dark:text-white/80">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-black/10 bg-transparent px-3 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
        style={{ fontFamily: value }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            style={{ fontFamily: option.value }}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
