import type { Editor } from '@tiptap/react'
import ToolbarButton from './ToolbarButton'

interface EditorToolbarProps {
    editor: Editor | null
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
    if (!editor) return null

    return (
        <div className="mb-4 flex flex-wrap gap-1 border-b border-black/10 pb-4 dark:border-white/10">
            {/* 텍스트 스타일 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="굵게"
            >
                <span className="font-bold">B</span>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="기울임"
            >
                <span className="italic">I</span>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="밑줄"
            >
                <span className="underline">U</span>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="취소선"
            >
                <span className="line-through">S</span>
            </ToolbarButton>

            <ToolbarDivider />

            {/* 제목 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="제목 1"
            >
                H1
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="제목 2"
            >
                H2
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="제목 3"
            >
                H3
            </ToolbarButton>

            <ToolbarDivider />

            {/* 목록 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="글머리 기호"
            >
                <BulletListIcon />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="번호 목록"
            >
                <OrderedListIcon />
            </ToolbarButton>

            <ToolbarDivider />

            {/* 블록 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="인용구"
            >
                <BlockquoteIcon />
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                title="코드 블록"
            >
                <CodeBlockIcon />
            </ToolbarButton>
        </div>
    )
}

// 구분선 컴포넌트
function ToolbarDivider() {
    return <div className="mx-2 h-6 w-px bg-black/10 dark:bg-white/10" />
}

// 아이콘 컴포넌트들
function BulletListIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
        </svg>
    )
}

function OrderedListIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="20" y2="6" />
            <line x1="10" y1="12" x2="20" y2="12" />
            <line x1="10" y1="18" x2="20" y2="18" />
            <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
            <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
            <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
        </svg>
    )
}

function BlockquoteIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
    )
}

function CodeBlockIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16,18 22,12 16,6" />
            <polyline points="8,6 2,12 8,18" />
        </svg>
    )
}
