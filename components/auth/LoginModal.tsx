'use client'

import { useEffect } from 'react'
import KakaoLoginButton from './KakaoLoginButton'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 로고 및 타이틀 */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Snuggle
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            따뜻한 커뮤니티에 오신 것을 환영합니다
          </p>
        </div>

        {/* 로그인 버튼 */}
        <div className="space-y-3">
          <KakaoLoginButton />
        </div>

        {/* 약관 안내 */}
        <p className="mt-6 text-center text-xs text-gray-400">
          로그인 시{' '}
          <a href="#" className="underline hover:text-gray-600">
            이용약관
          </a>{' '}
          및{' '}
          <a href="#" className="underline hover:text-gray-600">
            개인정보처리방침
          </a>
          에 동의하게 됩니다
        </p>
      </div>
    </div>
  )
}
