'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themes = [
    { id: 'light', icon: SunIcon },
    { id: 'dark', icon: MoonIcon },
  ] as const

  const CurrentIcon = themes.find((t) => t.id === theme)?.icon || MoonIcon

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
        aria-label="테마 변경"
      >
        <CurrentIcon />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 flex gap-1 rounded-full border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-900">
          {themes.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTheme(id)
                setIsOpen(false)
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                theme === id
                  ? 'bg-black/10 text-black dark:bg-white/10 dark:text-white'
                  : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white'
              }`}
              aria-label={id}
            >
              <Icon />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SunIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  )
}

