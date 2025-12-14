'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/api/upload'
import { getSystemSkins, applySkin } from '@/lib/api/skins'
import type { User } from '@supabase/supabase-js'

export default function CreateBlogPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // 다중 블로그 지원 - 블로그가 있어도 새로 생성 가능

      setUser(user)
      setCheckingAuth(false)
    }

    checkUser()
  }, [router])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('JPG, PNG, WEBP 파일만 업로드할 수 있습니다')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const handleImageRemove = () => {
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadImage = async (file: File): Promise<string | null> => {
    const url = await uploadImage(file)
    if (!url) {
      throw new Error('이미지 업로드에 실패했습니다')
    }
    return url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('블로그 이름을 입력해주세요')
      return
    }

    if (!user) return

    setLoading(true)
    setError('')

    try {
      let thumbnailUrl: string | null = null

      if (imageFile) {
        thumbnailUrl = await handleUploadImage(imageFile)
      }

      const supabase = createClient()

      const { data: blogData, error: insertError } = await supabase
        .from('blogs')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl,
        })
        .select('id')
        .single()

      if (insertError || !blogData) {
        setError('블로그 생성에 실패했습니다')
        setLoading(false)
        return
      }

      // 기본 스킨 자동 적용
      try {
        const skins = await getSystemSkins()
        const defaultSkin = skins.find(skin => skin.name === '기본')
        if (defaultSkin) {
          await applySkin(blogData.id, defaultSkin.id)
        }
      } catch (skinError) {
        console.error('Failed to apply default skin:', skinError)
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="mx-auto max-w-lg px-6 py-20">
        <button
          onClick={() => router.back()}
          className="mb-8 text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
        >
          ← 돌아가기
        </button>

        <h1 className="text-3xl font-bold text-black dark:text-white">
          블로그 만들기
        </h1>
        <p className="mt-2 text-black/50 dark:text-white/50">
          나만의 블로그를 시작해보세요
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              프로필 이미지
            </label>
            <div className="mt-3 flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-black/20 text-black/40 transition-colors hover:border-black/40 hover:text-black/60 dark:border-white/20 dark:text-white/40 dark:hover:border-white/40 dark:hover:text-white/60"
                >
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="text-sm text-black/50 dark:text-white/50">
                <p>JPG, PNG, WEBP (최대 5MB)</p>
                <p className="mt-1">선택사항</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              블로그 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="나의 블로그"
              className="mt-2 w-full border-b border-black/20 bg-transparent py-3 text-lg text-black outline-none focus:border-black dark:border-white/20 dark:text-white dark:focus:border-white"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white">
              블로그 소개
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="블로그를 소개해주세요 (선택)"
              rows={3}
              className="mt-2 w-full resize-none border-b border-black/20 bg-transparent py-3 text-black outline-none focus:border-black dark:border-white/20 dark:text-white dark:focus:border-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {loading ? '생성 중...' : '블로그 만들기'}
          </button>
        </form>
      </div>
    </div>
  )
}
