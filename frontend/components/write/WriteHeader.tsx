interface WriteHeaderProps {
    onBack: () => void
    onPublish: () => void
    saving: boolean
    isEdit?: boolean
}

export default function WriteHeader({
    onBack,
    onPublish,
    saving,
    isEdit,
}: WriteHeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-black/80">
            <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
                {/* 나가기 버튼 */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-1 text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    나가기
                </button>

                {/* 오른쪽 버튼들 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPublish}
                        disabled={saving}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
                    >
                        {saving ? '저장 중...' : (isEdit ? '수정하기' : '발행하기')}
                    </button>
                </div>
            </div>
        </header>
    )
}
