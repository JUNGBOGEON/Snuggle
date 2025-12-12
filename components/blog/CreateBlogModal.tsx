'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreateBlogModalProps {
  isOpen: boolean
  onClose: () => void
  onBlogCreated: (blog: { id: string; name: string; description: string | null; thumbnail_url: string | null }) => void
  userId: string
}

export default function CreateBlogModal({ isOpen, onClose, onBlogCreated, userId }: CreateBlogModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('블로그 이름을 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: insertError } = await supabase
      .from('blogs')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description.trim() || null,
      })
      .select()
      .single()

    if (insertError) {
      setError('블로그 생성에 실패했습니다')
      setLoading(false)
      return
    }

    onBlogCreated(data)
    setName('')
    setDescription('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-black dark:text-white">
          블로그 만들기
        </h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          나만의 블로그를 시작해보세요
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              블로그 이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="나의 블로그"
              className="mt-1 w-full rounded-lg border border-black/10 bg-transparent px-4 py-2.5 text-black outline-none focus:border-black dark:border-white/10 dark:text-white dark:focus:border-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              블로그 소개
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="블로그를 소개해주세요"
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-black/10 bg-transparent px-4 py-2.5 text-black outline-none focus:border-black dark:border-white/10 dark:text-white dark:focus:border-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {loading ? '생성 중...' : '블로그 만들기'}
          </button>
        </form>
      </div>
    </div>
  )
}
