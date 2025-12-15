'use client'

import { useState, useRef, useEffect } from 'react'
import { createForum } from '@/lib/api/forum'
import { getMyBlogs } from '@/lib/api/blogs'
import { uploadTempImage } from '@/lib/api/upload'
import { useUserStore } from '@/lib/store/useUserStore'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/common/Modal'

interface ForumWriteProps {
    onPostSuccess?: () => void
    onClose?: () => void
}

interface ImagePreview {
    url: string
    file?: File
}

export default function ForumWrite({ onPostSuccess, onClose }: ForumWriteProps) {
    const router = useRouter()
    const { user } = useUserStore()
    const { showAlert } = useModal()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('블로그 소개')
    const [submitting, setSubmitting] = useState(false)
    const [images, setImages] = useState<ImagePreview[]>([])
    const [isVisible, setIsVisible] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)

    // Animation on mount
    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true))
    }, [])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [])

    const handleClose = () => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (images.length >= 3) {
            showAlert('이미지는 최대 3장까지 첨부 가능합니다.')
            return
        }

        try {
            const url = await uploadTempImage(file)
            if (url) {
                setImages(prev => [...prev, { url, file }])
            }
        } catch (error) {
            console.error('Image upload failed', error)
            showAlert('이미지 업로드 실패')
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!user || !title.trim() || !content.trim() || submitting) return

        setSubmitting(true)
        try {
            const blogs = await getMyBlogs()
            const blog = blogs[0]

            if (!blog) {
                await showAlert('블로그를 먼저 개설해주세요.')
                return
            }

            // Build content with images
            let finalContent = content
            if (images.length > 0) {
                finalContent += '<br/><br/>'
                images.forEach((img, index) => {
                    finalContent += `<img src="${img.url}" alt="Image #${index + 1}" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;" /><br/>`
                })
            }

            await createForum({
                title: title.trim(),
                description: finalContent,
                blog_id: blog.id,
                category
            })

            await showAlert('등록되었습니다.')
            setTitle('')
            setContent('')
            setImages([])

            if (onPostSuccess) {
                onPostSuccess()
            } else {
                window.scrollTo(0, 0)
                router.refresh()
            }
        } catch (error: any) {
            console.error('Create forum failed', error)
            showAlert(error?.message || '등록 실패')
        } finally {
            setSubmitting(false)
        }
    }

    const isValid = title.trim().length > 0 && content.trim().length > 0

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
            handleClose()
        }
    }

    if (!user) return null

    const categories = ['블로그 소개', '블로그 운영팁', '스킨', '질문/기타']

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${
                isVisible ? 'bg-black/50' : 'bg-transparent'
            }`}
            onClick={handleBackdropClick}
        >
            <div
                ref={sheetRef}
                className={`w-full max-w-2xl transform overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-neutral-900 ${
                    isVisible ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                {/* Handle Bar */}
                <div className="flex justify-center py-3">
                    <div className="h-1 w-12 rounded-full bg-black/10 dark:bg-white/10" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-6 pb-4 dark:border-white/5">
                    <button
                        onClick={handleClose}
                        className="text-sm font-medium text-black/50 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white"
                    >
                        취소
                    </button>
                    <h2 className="text-base font-semibold text-black dark:text-white">새 글 작성</h2>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || submitting}
                        className={`text-sm font-semibold transition-colors ${
                            isValid && !submitting
                                ? 'text-black dark:text-white'
                                : 'text-black/30 dark:text-white/30'
                        }`}
                    >
                        {submitting ? '등록 중...' : '등록'}
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto">
                    {/* Category */}
                    <div className="border-b border-black/5 px-6 py-4 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <span className="w-16 shrink-0 text-sm font-medium text-black/40 dark:text-white/40">분류선택</span>
                            <div className="flex flex-wrap gap-3">
                                {categories.map((cat) => (
                                    <label key={cat} className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={category === cat}
                                            onChange={() => setCategory(cat)}
                                            className="h-4 w-4 accent-black dark:accent-white"
                                        />
                                        <span className={`text-sm ${
                                            category === cat
                                                ? 'font-medium text-black dark:text-white'
                                                : 'text-black/60 dark:text-white/60'
                                        }`}>
                                            {cat}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="border-b border-black/5 px-6 py-4 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <span className="w-16 shrink-0 text-sm font-medium text-black/40 dark:text-white/40">제목</span>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력하세요"
                                className="flex-1 bg-transparent text-sm text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
                                maxLength={30}
                            />
                            <span className="text-xs text-black/30 dark:text-white/30">{title.length}/30</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="border-b border-black/5 px-6 py-4 dark:border-white/5">
                        <div className="flex gap-4">
                            <span className="w-16 shrink-0 pt-0.5 text-sm font-medium text-black/40 dark:text-white/40">내용</span>
                            <div className="flex-1">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="내용을 입력하세요 하루에 3개까지 작성 가능합니다"
                                    className="min-h-[120px] w-full resize-none bg-transparent text-sm text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
                                    maxLength={1000}
                                />
                                <div className="flex items-center justify-between">
                                    {!content.trim() && (
                                        <p className="text-xs text-red-500">내용을 입력해주셔야 글 등록이 가능합니다.</p>
                                    )}
                                    <span className="ml-auto text-xs text-black/30 dark:text-white/30">{content.length}/1000</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Attachment */}
                    <div className="px-6 py-4">
                        <div className="flex gap-4">
                            <span className="w-16 shrink-0 pt-0.5 text-sm font-medium text-black/40 dark:text-white/40">파일첨부</span>
                            <div className="flex flex-1 flex-wrap gap-3">
                                {/* Image Previews */}
                                {images.map((img, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={img.url}
                                            alt={`Image #${index + 1}`}
                                            className="h-24 w-24 rounded-lg object-cover"
                                        />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded bg-black text-xs font-bold text-white"
                                        >
                                            −
                                        </button>
                                        <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                            Image #{index + 1}
                                        </div>
                                    </div>
                                ))}

                                {/* Upload Button - Inline with images */}
                                {images.length < 3 && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-black/10 text-black/30 transition-colors hover:border-black/20 hover:text-black/50 dark:border-white/10 dark:text-white/30 dark:hover:border-white/20 dark:hover:text-white/50"
                                    >
                                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-[10px]">{images.length}/3</span>
                                    </button>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
