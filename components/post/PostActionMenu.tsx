'use client'

import { useState, useRef, useEffect } from 'react'

interface PostActionMenuProps {
    isPrivate: boolean
    onEdit: () => void
    onDelete: () => void
    onToggleVisibility: () => void
    isAuthor: boolean
}

export default function PostActionMenu({
    isPrivate,
    onEdit,
    onDelete,
    onToggleVisibility,
    isAuthor,
}: PostActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // 외부 클릭 시 메뉴 닫기
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    if (!isAuthor) return null

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--blog-muted)] transition-colors hover:bg-[var(--blog-fg)]/10 hover:text-[var(--blog-fg)]"
                aria-label="게시글 메뉴"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-[var(--blog-border)] bg-[var(--blog-bg)] shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                        <button
                            onClick={() => {
                                onEdit()
                                setIsOpen(false)
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-[var(--blog-fg)] hover:bg-[var(--blog-fg)]/5"
                        >
                            수정
                        </button>
                        <button
                            onClick={() => {
                                onToggleVisibility()
                                setIsOpen(false)
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-[var(--blog-fg)] hover:bg-[var(--blog-fg)]/5"
                        >
                            {isPrivate ? '공개로 변경' : '비공개로 변경'}
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('정말로 삭제하시겠습니까?')) {
                                    onDelete()
                                }
                                setIsOpen(false)
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            삭제
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
