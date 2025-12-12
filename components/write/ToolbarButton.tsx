interface ToolbarButtonProps {
    children: React.ReactNode
    onClick: () => void
    isActive?: boolean
    title: string
}

export default function ToolbarButton({
    children,
    onClick,
    isActive,
    title,
}: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5'
                }`}
        >
            {children}
        </button>
    )
}
