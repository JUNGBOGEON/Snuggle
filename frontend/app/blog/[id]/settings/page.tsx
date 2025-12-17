'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/api/upload'
import { getBlogPosts, updatePost, deletePost as deletePostApi, Post } from '@/lib/api/posts'
import { getCategories, createCategory, deleteCategory } from '@/lib/api/categories'
import {
  getSystemSkins,
  getBlogSkin,
  applySkin,
  saveSkinCustomization,
  resetBlogSkin,
  BlogSkin,
  BlogSkinApplication,
  SkinCssVariables,
  LayoutConfig,
} from '@/lib/api/skins'
import type { User } from '@supabase/supabase-js'
import Toast from '@/components/common/Toast'
import SkinCard from '@/components/skin/SkinCard'
import ColorPicker from '@/components/skin/ColorPicker'
import FontSelector from '@/components/skin/FontSelector'
import LayoutPicker from '@/components/skin/LayoutPicker'

interface Blog {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

interface Category {
  id: string
  name: string
  blog_id: string
}

interface PostItem {
  id: string
  title: string
  is_private: boolean
  created_at: string
}

type TabType = 'profile' | 'categories' | 'posts' | 'skin'

const menuItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: '프로필',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'categories',
    label: '카테고리',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: 'posts',
    label: '글 관리',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'skin',
    label: '스킨',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
]

export default function BlogSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const blogId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [blog, setBlog] = useState<Blog | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // 프로필 수정 상태
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }))
  }, [])

  // 카테고리 추가 상태
  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  // 스킨 상태
  const [systemSkins, setSystemSkins] = useState<BlogSkin[]>([])
  const [skinApplication, setSkinApplication] = useState<BlogSkinApplication | null>(null)
  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null)
  const [customCssVariables, setCustomCssVariables] = useState<Partial<SkinCssVariables>>({})
  const [customLayoutConfig, setCustomLayoutConfig] = useState<LayoutConfig>({
    layout: 'sidebar-right',
    postListStyle: 'cards',
    showThumbnails: true,
  })
  const [skinSaving, setSkinSaving] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)

  // 카카오 프로필 이미지
  const kakaoProfileImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null

  // 표시할 프로필 이미지 (우선순위: 새 이미지 > 블로그 썸네일 > 카카오 프로필)
  const displayImage = imageRemoved ? null : (imagePreview || kakaoProfileImage)

  // 변경 사항 확인
  const hasProfileChanges = blog && (
    name.trim() !== blog.name ||
    (description.trim() || null) !== blog.description ||
    imageFile !== null ||
    imageRemoved
  )

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)

      const { data: blogData, error: blogError } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', blogId)
        .single()

      if (blogError || !blogData || blogData.user_id !== user.id) {
        router.push('/')
        return
      }

      setBlog(blogData)
      setName(blogData.name)
      setDescription(blogData.description || '')
      if (blogData.thumbnail_url) {
        setImagePreview(blogData.thumbnail_url)
      }

      // 카테고리 로드 (백엔드 API 사용)
      try {
        const categoryData = await getCategories(blogId)
        setCategories(categoryData)
      } catch (err) {
        console.error('Failed to load categories:', err)
      }

      // 글 목록 로드 (백엔드 API 사용)
      try {
        const postData = await getBlogPosts(blogId, true)
        setPosts(postData.map(p => ({
          id: p.id,
          title: p.title,
          is_private: p.is_private || false,
          created_at: p.created_at,
        })))
      } catch (err) {
        console.error('Failed to load posts:', err)
      }

      // 스킨 데이터 로드
      try {
        const [skinsData, skinAppData] = await Promise.all([
          getSystemSkins(),
          getBlogSkin(blogId),
        ])
        setSystemSkins(skinsData)
        setSkinApplication(skinAppData)
        if (skinAppData) {
          setSelectedSkinId(skinAppData.skin_id)
          if (skinAppData.custom_css_variables) {
            setCustomCssVariables(skinAppData.custom_css_variables)
          }
          if (skinAppData.custom_layout_config) {
            setCustomLayoutConfig(prev => ({ ...prev, ...skinAppData.custom_layout_config }))
          }
        }
      } catch (err) {
        console.error('Failed to load skins:', err)
      }

      setLoading(false)
    }

    fetchData()
  }, [blogId, router])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showToast('JPG, PNG, WEBP 파일만 업로드할 수 있습니다', 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('이미지 크기는 5MB 이하여야 합니다', 'error')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageRemoved(false)
    setImageLoading(true)
  }

  const handleImageRemove = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageRemoved(true)
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

  const handleSaveProfile = async () => {
    if (!blog) return

    setSaving(true)

    try {
      let thumbnailUrl: string | null = blog.thumbnail_url

      if (imageRemoved) {
        thumbnailUrl = null
      } else if (imageFile) {
        thumbnailUrl = await handleUploadImage(imageFile)
      }

      const supabase = createClient()

      const { error } = await supabase
        .from('blogs')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl,
        })
        .eq('id', blog.id)

      if (error) throw error

      setBlog({ ...blog, name: name.trim(), description: description.trim() || null, thumbnail_url: thumbnailUrl })
      setImageFile(null)
      setImageRemoved(false)
      showToast('저장되었습니다', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장에 실패했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return

    // 중복 체크
    const trimmedName = newCategory.trim()
    if (categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      showToast('이미 존재하는 카테고리입니다', 'error')
      return
    }

    setAddingCategory(true)

    try {
      const data = await createCategory(blogId, trimmedName)
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCategory('')
      showToast('카테고리가 추가되었습니다', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '카테고리 추가에 실패했습니다'
      showToast(message, 'error')
    }

    setAddingCategory(false)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId)
      setCategories(categories.filter(c => c.id !== categoryId))
      showToast('카테고리가 삭제되었습니다', 'success')
    } catch (err) {
      console.error('Failed to delete category:', err)
      showToast('카테고리 삭제에 실패했습니다', 'error')
    }
  }

  const handleTogglePrivate = async (postId: string, currentIsPrivate: boolean) => {
    try {
      await updatePost(postId, { is_private: !currentIsPrivate })
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, is_private: !currentIsPrivate } : p
      ))
    } catch (err) {
      console.error('Failed to toggle private:', err)
      showToast('상태 변경에 실패했습니다', 'error')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deletePostApi(postId)
      setPosts(posts.filter(p => p.id !== postId))
      showToast('글이 삭제되었습니다', 'success')
    } catch (err) {
      console.error('Failed to delete post:', err)
      showToast('삭제에 실패했습니다', 'error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // 스킨 선택 핸들러
  const handleSelectSkin = async (skinId: string) => {
    setSkinSaving(true)
    try {
      await applySkin(blogId, skinId)
      setSelectedSkinId(skinId)
      setCustomCssVariables({})
      setCustomLayoutConfig({
        layout: 'sidebar-right',
        postListStyle: 'cards',
        showThumbnails: true,
      })
      showToast('스킨이 적용되었습니다', 'success')
    } catch (err) {
      showToast('스킨 적용에 실패했습니다', 'error')
    } finally {
      setSkinSaving(false)
    }
  }

  // 스킨 커스터마이징 저장
  const handleSaveSkinCustomization = async () => {
    setSkinSaving(true)
    try {
      await saveSkinCustomization(blogId, {
        custom_css_variables: customCssVariables,
        custom_layout_config: customLayoutConfig,
      })
      showToast('커스터마이징이 저장되었습니다', 'success')
    } catch (err) {
      showToast('저장에 실패했습니다', 'error')
    } finally {
      setSkinSaving(false)
    }
  }

  // 스킨 초기화
  const handleResetSkin = async () => {
    if (!confirm('스킨 설정을 초기화하시겠습니까?')) return

    setSkinSaving(true)
    try {
      await resetBlogSkin(blogId)
      setSelectedSkinId(null)
      setSkinApplication(null)
      setCustomCssVariables({})
      setCustomLayoutConfig({
        layout: 'sidebar-right',
        postListStyle: 'cards',
        showThumbnails: true,
      })
      showToast('스킨이 초기화되었습니다', 'success')
    } catch (err) {
      showToast('초기화에 실패했습니다', 'error')
    } finally {
      setSkinSaving(false)
    }
  }

  // CSS 변수 업데이트 핸들러
  const handleCssVariableChange = (key: keyof SkinCssVariables, value: string) => {
    setCustomCssVariables(prev => ({ ...prev, [key]: value }))
  }

  // 현재 선택된 스킨
  const currentSkin = systemSkins.find(s => s.id === selectedSkinId)

  if (loading) {
    return <></>
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      {/* 왼쪽 사이드바 */}
      <aside className="w-64 shrink-0 border-r border-black/10 dark:border-white/10">
        <div className="sticky top-0 flex h-screen flex-col">
          {/* 헤더 */}
          <div className="border-b border-black/10 p-4 dark:border-white/10">
            <a
              href={`/blog/${blogId}`}
              className="flex items-center gap-2 text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              블로그로 돌아가기
            </a>
          </div>

          {/* 메뉴 */}
          <nav className="flex-1 p-3">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeTab === item.id
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5'
                    }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

        </div>
      </aside>

      {/* 오른쪽 컨텐츠 */}
      <main className="flex-1 overflow-hidden p-10">
        {/* 프로필 */}
        {activeTab === 'profile' && (
          <div className="max-w-xl animate-[slideIn_0.2s_ease-out]">
            <h1 className="text-2xl font-bold text-black dark:text-white">프로필</h1>
            <p className="mt-1 text-black/50 dark:text-white/50">블로그 프로필을 수정합니다</p>

            <div className="mt-10 space-y-8">
              {/* 프로필 이미지 */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white">
                  프로필 이미지
                </label>
                <div className="mt-4">
                  <div className="flex items-start gap-6">
                    {/* 이미지 프리뷰 */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full"
                    >
                      {displayImage ? (
                        <>
                          {imageLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
                            </div>
                          )}
                          <img
                            src={displayImage}
                            alt="Preview"
                            className={`h-full w-full object-cover transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                            onLoad={() => setImageLoading(false)}
                            onError={() => setImageLoading(false)}
                          />
                        </>
                      ) : (
                        <div className="h-full w-full bg-black/5 dark:bg-white/5" />
                      )}
                      {/* 호버 오버레이 */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {/* 버튼 및 안내 */}
                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                      >
                        이미지 업로드
                      </button>
                      {imagePreview && !imageRemoved && (
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="rounded-lg px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          이미지 삭제
                        </button>
                      )}
                      <p className="text-xs text-black/40 dark:text-white/40">
                        JPG, PNG, WEBP · 최대 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 블로그 이름 */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white">
                  블로그 이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  className="mt-2 w-full rounded-lg border border-black/10 bg-transparent px-4 py-3 text-black outline-none focus:border-black dark:border-white/10 dark:text-white dark:focus:border-white"
                />
                <div className="mt-1 text-right text-xs text-black/30 dark:text-white/30">
                  {name.length}/30
                </div>
              </div>

              {/* 블로그 소개 */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white">
                  블로그 소개
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={200}
                  className="mt-2 w-full resize-none rounded-lg border border-black/10 bg-transparent px-4 py-3 text-black outline-none focus:border-black dark:border-white/10 dark:text-white dark:focus:border-white"
                />
                <div className="mt-1 text-right text-xs text-black/30 dark:text-white/30">
                  {description.length}/200
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || !name.trim() || !hasProfileChanges}
                className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        {/* 카테고리 */}
        {activeTab === 'categories' && (
          <div className="max-w-xl animate-[slideIn_0.2s_ease-out]">
            <h1 className="text-2xl font-bold text-black dark:text-white">카테고리</h1>
            <p className="mt-1 text-black/50 dark:text-white/50">글을 분류할 카테고리를 관리합니다</p>

            <div className="mt-10">
              {/* 카테고리 추가 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="새 카테고리 이름"
                    maxLength={20}
                    className="w-full rounded-lg border border-black/10 bg-transparent px-4 py-2.5 text-black outline-none focus:border-black dark:border-white/10 dark:text-white dark:focus:border-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <div className="mt-1 text-right text-xs text-black/30 dark:text-white/30">
                    {newCategory.length}/20
                  </div>
                </div>
                <button
                  onClick={handleAddCategory}
                  disabled={addingCategory || !newCategory.trim()}
                  className="h-fit rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  추가
                </button>
              </div>

              {/* 카테고리 목록 */}
              <div className="mt-8">
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/20 py-16 dark:border-white/20">
                    <svg className="h-12 w-12 text-black/20 dark:text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <p className="mt-4 text-sm text-black/50 dark:text-white/50">
                      카테고리가 없습니다
                    </p>
                    <p className="mt-1 text-xs text-black/30 dark:text-white/30">
                      위 입력창에서 새 카테고리를 추가해보세요
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="group flex items-center gap-2 rounded-full border border-black/10 bg-black/5 py-2 pl-4 pr-2 transition-colors hover:border-black/20 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
                      >
                        <span className="text-sm font-medium text-black dark:text-white">
                          {category.name}
                        </span>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/10 hover:text-red-500 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-red-400"
                          title="삭제"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 카테고리 개수 표시 */}
              {categories.length > 0 && (
                <p className="mt-4 text-xs text-black/40 dark:text-white/40">
                  총 {categories.length}개의 카테고리
                </p>
              )}
            </div>
          </div>
        )}

        {/* 글 관리 */}
        {activeTab === 'posts' && (
          <div className="animate-[slideIn_0.2s_ease-out]">
            <h1 className="text-2xl font-bold text-black dark:text-white">글 관리</h1>
            <p className="mt-1 text-black/50 dark:text-white/50">작성한 글을 관리합니다</p>

            <div className="mt-10">
              {posts.length === 0 ? (
                <p className="py-12 text-center text-black/50 dark:text-white/50">
                  작성된 글이 없습니다
                </p>
              ) : (
                <div className="rounded-lg border border-black/10 dark:border-white/10">
                  {posts.map((post, index) => (
                    <div
                      key={post.id}
                      className={`flex items-center justify-between px-4 py-4 ${index !== posts.length - 1 ? 'border-b border-black/10 dark:border-white/10' : ''
                        }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/post/${post.id}`}
                            className="truncate font-medium text-black hover:underline dark:text-white"
                          >
                            {post.title}
                          </Link>
                          {post.is_private && (
                            <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              비공개
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePrivate(post.id, post.is_private)}
                          className="rounded-lg px-3 py-1.5 text-sm text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
                        >
                          {post.is_private ? '공개로' : '비공개로'}
                        </button>
                        <a
                          href={`/write?edit=${post.id}`}
                          className="rounded-lg px-3 py-1.5 text-sm text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
                        >
                          수정
                        </a>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="rounded-lg px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 스킨 */}
        {activeTab === 'skin' && (
          <div className="animate-[slideIn_0.2s_ease-out]">
            <h1 className="text-2xl font-bold text-black dark:text-white">스킨</h1>
            <p className="mt-1 text-black/50 dark:text-white/50">블로그 스킨을 선택하고 커스터마이징합니다</p>

            <div className="mt-10">
              {/* 현재 스킨 정보 */}
              {currentSkin && (
                <div className="mb-8 rounded-xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-black/50 dark:text-white/50">현재 적용된 스킨</p>
                      <p className="mt-1 font-medium text-black dark:text-white">{currentSkin.name}</p>
                    </div>
                    <button
                      onClick={handleResetSkin}
                      disabled={skinSaving}
                      className="text-sm text-red-500 hover:underline disabled:opacity-50"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              )}

              {/* 스킨 선택 그리드 */}
              <div>
                <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">스킨 선택</h2>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                  {systemSkins.map((skin) => (
                    <SkinCard
                      key={skin.id}
                      skin={skin}
                      selected={selectedSkinId === skin.id}
                      onSelect={() => handleSelectSkin(skin.id)}
                    />
                  ))}
                </div>
              </div>

              {/* 커스터마이징 토글 */}
              <div className="mt-10">
                <button
                  onClick={() => setShowCustomizer(!showCustomizer)}
                  className="flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${showCustomizer ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  커스터마이징
                </button>

                {showCustomizer && (
                  <div className="mt-6 space-y-8 rounded-xl border border-black/10 p-6 dark:border-white/10">
                    {/* 색상 설정 */}
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">색상</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="배경색"
                          value={customCssVariables['--blog-bg'] || currentSkin?.css_variables['--blog-bg'] || '#ffffff'}
                          onChange={(v) => handleCssVariableChange('--blog-bg', v)}
                        />
                        <ColorPicker
                          label="텍스트색"
                          value={customCssVariables['--blog-fg'] || currentSkin?.css_variables['--blog-fg'] || '#000000'}
                          onChange={(v) => handleCssVariableChange('--blog-fg', v)}
                        />
                        <ColorPicker
                          label="강조색"
                          value={customCssVariables['--blog-accent'] || currentSkin?.css_variables['--blog-accent'] || '#000000'}
                          onChange={(v) => handleCssVariableChange('--blog-accent', v)}
                        />
                        <ColorPicker
                          label="보조 텍스트"
                          value={customCssVariables['--blog-muted'] || currentSkin?.css_variables['--blog-muted'] || 'rgba(0,0,0,0.6)'}
                          onChange={(v) => handleCssVariableChange('--blog-muted', v)}
                        />
                      </div>
                    </div>

                    {/* 다크모드 색상 */}
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">다크모드 색상</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPicker
                          label="배경색 (다크)"
                          value={customCssVariables['--blog-dark-bg'] || currentSkin?.css_variables['--blog-dark-bg'] || '#000000'}
                          onChange={(v) => handleCssVariableChange('--blog-dark-bg', v)}
                        />
                        <ColorPicker
                          label="텍스트색 (다크)"
                          value={customCssVariables['--blog-dark-fg'] || currentSkin?.css_variables['--blog-dark-fg'] || '#ffffff'}
                          onChange={(v) => handleCssVariableChange('--blog-dark-fg', v)}
                        />
                      </div>
                    </div>

                    {/* 폰트 설정 */}
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">폰트</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FontSelector
                          label="본문 폰트"
                          value={customCssVariables['--blog-font-sans'] || currentSkin?.css_variables['--blog-font-sans'] || 'GMarketSans, sans-serif'}
                          onChange={(v) => handleCssVariableChange('--blog-font-sans', v)}
                        />
                        <FontSelector
                          label="코드 폰트"
                          value={customCssVariables['--blog-font-mono'] || currentSkin?.css_variables['--blog-font-mono'] || 'monospace'}
                          onChange={(v) => handleCssVariableChange('--blog-font-mono', v)}
                        />
                      </div>
                    </div>

                    {/* 레이아웃 설정 */}
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">레이아웃</h3>
                      <LayoutPicker
                        value={customLayoutConfig}
                        onChange={setCustomLayoutConfig}
                      />
                    </div>

                    {/* 저장 버튼 */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveSkinCustomization}
                        disabled={skinSaving}
                        className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                      >
                        {skinSaving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => {
                          setCustomCssVariables({})
                          setCustomLayoutConfig({
                            layout: 'sidebar-right',
                            postListStyle: 'cards',
                            showThumbnails: true,
                          })
                        }}
                        className="rounded-lg border border-black/10 px-6 py-2.5 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                      >
                        커스터마이징 초기화
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  )
}
