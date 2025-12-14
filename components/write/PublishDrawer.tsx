'use client'

import { useState, useRef } from 'react'
import { uploadTempImage } from '@/lib/api/upload'

interface PublishDrawerProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: {
        isPrivate: boolean
        allowComments: boolean
        thumbnailUrl: string | null
    }) => void
    initialValues?: {
        isPrivate: boolean
        allowComments: boolean
        thumbnailUrl: string | null
    }
}

export default function PublishDrawer({ isOpen, onClose, onConfirm, initialValues }: PublishDrawerProps) {
    const [isPrivate, setIsPrivate] = useState(initialValues?.isPrivate ?? false)
    const [allowComments, setAllowComments] = useState(initialValues?.allowComments ?? true)
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialValues?.thumbnailUrl ?? null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const url = await uploadTempImage(file)
            setThumbnailUrl(url)
        } catch (error) {
            console.error('Thumbnail upload failed:', error)
            alert('이미지 업로드에 실패했습니다.')
        } finally {
            setUploading(false)
        }
    }

    const handleConfirm = () => {
        onConfirm({
            isPrivate,
            allowComments,
            thumbnailUrl,
        })
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-3xl animate-[slideUp_0.3s_ease-out] rounded-t-2xl bg-white p-10 shadow-2xl dark:bg-black"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-4 dark:border-white/10">
                    <h2 className="text-xl font-bold text-black dark:text-white">발행</h2>
                    <span className="text-sm text-black/40 dark:text-white/40">CCL 설정</span>
                </div>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
                    {/* 왼쪽 설정 영역 */}
                    <div className="space-y-8">
                        {/* 공개 설정 */}
                        <div className="flex items-start justify-between">
                            <label className="w-20 font-bold text-black dark:text-white shrink-0">기본</label>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={!isPrivate}
                                            onChange={() => setIsPrivate(false)}
                                            className="h-5 w-5 border-black/20 text-black focus:ring-black dark:border-white/20 dark:bg-black dark:checked:bg-white dark:focus:ring-white"
                                        />
                                        <span className="text-black dark:text-white">공개</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-not-allowed opacity-50 whitespace-nowrap">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            disabled
                                            className="h-5 w-5 border-black/20"
                                        />
                                        <span className="text-black dark:text-white">공개(보호)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                                        <input
                                            type="radio"
                                            name="visibility"
                                            checked={isPrivate}
                                            onChange={() => setIsPrivate(true)}
                                            className="h-5 w-5 border-black/20 text-black focus:ring-black dark:border-white/20 dark:bg-black dark:checked:bg-white dark:focus:ring-white"
                                        />
                                        <span className="text-black dark:text-white">비공개</span>
                                    </label>

                                    {/* 댓글 허용 토글 */}
                                    <label className="flex cursor-pointer items-center gap-2 text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white whitespace-nowrap ml-auto sm:ml-4">
                                        <input
                                            type="checkbox"
                                            checked={allowComments}
                                            onChange={(e) => setAllowComments(e.target.checked)}
                                            className="rounded border-black/20 text-black focus:ring-black dark:border-white/20 dark:bg-black dark:checked:bg-white"
                                        />
                                        댓글 허용
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 홈 주제 (비활성화) */}
                        <div className="flex items-start justify-between opacity-50">
                            <label className="w-20 font-bold text-black dark:text-white">홈주제</label>
                            <div className="flex-1 text-black/40 dark:text-white/40">선택 안 함</div>
                        </div>

                        {/* 발행일 (비활성화) */}
                        <div className="flex items-start justify-between opacity-50">
                            <label className="w-20 font-bold text-black dark:text-white">발행일</label>
                            <div className="flex-1 text-black/40 dark:text-white/40">현재</div>
                        </div>

                        {/* URL (비활성화) */}
                        <div className="flex items-start justify-between opacity-50">
                            <label className="w-20 font-bold text-black dark:text-white">URL</label>
                            <div className="flex-1 text-black/40 dark:text-white/40 text-sm">
                                https://snuggle.dev/entry/...
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽 썸네일 영역 */}
                    <div>
                        <div
                            className="relative aspect-square w-full cursor-pointer overflow-hidden bg-[#f5f5f5] transition-colors hover:bg-[#ebebeb] dark:bg-[#1f1f1f] dark:hover:bg-[#2a2a2a]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {thumbnailUrl ? (
                                <img
                                    src={thumbnailUrl}
                                    alt="대표 이미지"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-[#999] dark:text-[#666]">
                                    {uploading ? (
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                        <>
                                            <svg className="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span className="text-sm">대표이미지 추가</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {thumbnailUrl && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setThumbnailUrl(null)
                                    }}
                                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="mt-12 flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="rounded-full border border-black/10 px-8 py-3 text-sm text-black transition-colors hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="rounded-full bg-black px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-black"
                    >
                        {isPrivate ? '비공개 발행' : '공개 발행'}
                    </button>
                </div>
            </div>
        </div>
    )
}
