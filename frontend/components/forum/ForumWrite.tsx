'use client'

import { useState, useRef } from 'react'
import { createForum } from '@/lib/api/forum'
import { getMyBlogs } from '@/lib/api/blogs'
import { uploadTempImage } from '@/lib/api/upload'
import { useUserStore } from '@/lib/store/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useModal } from '@/components/common/Modal'

interface ForumWriteProps {
    onPostSuccess?: () => void
}

export default function ForumWrite({ onPostSuccess }: ForumWriteProps) {
    const router = useRouter()
    const { user } = useUserStore()
    const { showAlert } = useModal()
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('블로그 소개')
    const [submitting, setSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // ... (rest of image upload code) ...

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const url = await uploadTempImage(file)
            if (url) {
                const imgTag = `<br/><img src="${url}" alt="image" style="max-width: 100%; border-radius: 8px;" /><br/>`
                setContent(prev => prev + imgTag)
            }
        } catch (error) {
            console.error('Image upload failed', error)
            showAlert('이미지 업로드 실패')
        }
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

            await createForum({
                title: title.trim(),
                description: content,
                blog_id: blog.id,
                category
            })

            await showAlert('등록되었습니다.')
            setTitle('')
            setContent('')

            if (onPostSuccess) {
                window.scrollTo(0, 0)
                onPostSuccess()
            } else {
                window.scrollTo(0, 0)
                router.refresh()
            }
        } catch (error) {
            console.error('Create forum failed', error)
            showAlert('등록 실패')
        } finally {
            setSubmitting(false)
        }
    }

    const isValid = title.trim().length > 0 && content.trim().length > 0

    const onButtonClick = async () => {
        if (!isValid) {
            await showAlert('빈칸이 있습니다.')
            return
        }
        handleSubmit()
    }

    if (!user) return null // Hide if not logged in

    return (
        <div className="border border-black/10 bg-white p-6 rounded-lg dark:border-white/10 dark:bg-black/20" id="write-form">
            {/* Category Selector (Simple) */}
            <div className="mb-4 flex items-center gap-4 text-sm border-b border-black/10 pb-4 dark:border-white/10">
                <span className="font-bold w-20">분류선택</span>
                <div className="flex gap-4">
                    {['블로그 소개', '블로그 운영팁', '스킨', '질문/기타'].map((cat) => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="forum_category"
                                checked={category === cat}
                                onChange={() => setCategory(cat)}
                                className="text-black focus:ring-black dark:text-white"
                            />
                            {cat}
                        </label>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div className="mb-4 flex items-center gap-4 border-b border-black/10 pb-4 dark:border-white/10">
                <span className="font-bold w-20 text-sm">제목</span>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="flex-1 bg-transparent text-sm placeholder:text-black/30 focus:outline-none dark:text-white dark:placeholder:text-white/30"
                    maxLength={30}
                />
                <span className="text-xs text-black/30 dark:text-white/30">{title.length}/30</span>
            </div>

            {/* Content */}
            <div className="mb-4 flex gap-4 min-h-[120px]">
                <span className="font-bold w-20 text-sm py-2">내용</span>
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="내용을 입력하세요. 하루에 3개까지 작성 가능합니다."
                        className="w-full h-32 bg-transparent text-sm resize-none focus:outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
                        maxLength={1000}
                    />
                    <div className="text-right text-xs text-black/30 dark:text-white/30">
                        {content.length}/1000
                    </div>
                </div>
            </div>

            {/* File Attachment */}
            <div className="mb-6 flex items-center gap-4 border-t border-black/10 pt-4 dark:border-white/10">
                <span className="font-bold w-20 text-sm">파일첨부</span>
                <div className="flex-1 text-xs text-black/40 dark:text-white/40">
                    사진은 3장까지만 첨부 가능합니다 (용량 10MB 미만)
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 flex items-center justify-center rounded border border-black/20 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                />
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-3">
                <button
                    onClick={() => { setTitle(''); setContent(''); }}
                    className="rounded-full border border-black/10 px-8 py-2 text-sm text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                    취소
                </button>
                <button
                    onClick={onButtonClick}
                    disabled={submitting} // Removed !isValid from disabled to allow click for alert, but handle styling manually
                    className={`rounded-full px-8 py-2 text-sm text-white transition-colors disabled:opacity-50 ${isValid
                        ? 'bg-black hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80'
                        : 'bg-[#999] hover:bg-[#888]'
                        }`}
                >
                    등록
                </button>
            </div>
        </div>
    )
}
