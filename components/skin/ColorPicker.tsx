'use client'

import { useState, useRef, useEffect } from 'react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // 유효한 색상 값인지 확인
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue) || /^rgba?\(.+\)$/.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  // rgba 값에서 hex로 변환 (color input용)
  const getHexValue = (colorValue: string): string => {
    if (colorValue.startsWith('#')) {
      return colorValue.slice(0, 7)
    }
    // rgba의 경우 기본값 반환
    return '#000000'
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-black/80 dark:text-white/80">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-10 w-10 rounded-lg border border-black/10 dark:border-white/10"
          style={{ backgroundColor: value }}
          aria-label="색상 선택"
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="h-10 flex-1 rounded-lg border border-black/10 bg-transparent px-3 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-white dark:focus:border-white/30"
          placeholder="#000000"
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-black/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-zinc-900">
          <input
            type="color"
            value={getHexValue(value)}
            onChange={handleColorChange}
            className="h-32 w-32 cursor-pointer rounded border-0"
          />
        </div>
      )}
    </div>
  )
}
