'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEditor, EditorContent, ReactNodeViewRenderer, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import CodeBlockComponent from '@/components/write/CodeBlockComponent'
import { uploadTempImage, deleteTempImage } from '@/lib/api/upload'
import { createPost, getPost, updatePost } from '@/lib/api/posts'
import { getCategories, createCategory } from '@/lib/api/categories'

// highlight.js 커스텀 테마 (라이트/다크 모드 지원)
import '@/styles/highlight-theme.css'

// lowlight 인스턴스 생성 (모든 언어 포함)
const lowlight = createLowlight(all)

// localStorage 키
const DRAFT_STORAGE_KEY = 'snuggle_draft'

// temp 이미지 URL 패턴 (R2 public URL)
const TEMP_IMAGE_PATTERN = /temp\/[^/]+\/[^"'\s]+/

// HTML에서 이미지 URL 추출
function extractImageUrls(html: string): string[] {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g
    const urls: string[] = []
    let match

    while ((match = imgRegex.exec(html)) !== null) {
        if (TEMP_IMAGE_PATTERN.test(match[1])) {
            urls.push(match[1])
        }
    }

    return urls
}

// 분리된 컴포넌트들
import WriteHeader from '@/components/write/WriteHeader'
import EditorToolbar from '@/components/write/EditorToolbar'
import TitleInput from '@/components/write/TitleInput'
import CategorySelector from '@/components/write/CategorySelector'

// 에디터 전용 스타일
import '@/components/write/editor.css'

interface Blog {
    id: string
    name: string
}

interface Category {
    id: string
    name: string
}

interface DraftData {
    title: string
    content: string
    categoryIds: string[]
    uploadedImages: string[]
    lastSaved: number
}

function WriteContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editPostId = searchParams.get('id')
    const isEditMode = !!editPostId

    const [user, setUser] = useState<User | null>(null)
    const [blog, setBlog] = useState<Blog | null>(null)
    const [title, setTitle] = useState('')
    const [categoryIds, setCategoryIds] = useState<string[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [initialContent, setInitialContent] = useState('')

    // 업로드된 이미지 URL 추적
    const uploadedImagesRef = useRef<Set<string>>(new Set())
    const isInitializedRef = useRef(false)

    // 초기 데이터 로딩 (인증 체크 & 수정 모드일 때 데이터 가져오기)
    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            setUser(user)

            // 블로그 정보 가져오기
            const { data: blogData } = await supabase
                .from('blogs')
                .select('id, name')
                .eq('user_id', user.id)
                .single()

            if (!blogData) {
                router.push('/create-blog')
                return
            }

            setBlog(blogData)

            // 카테고리 정보 가져오기
            try {
                const categoryData = await getCategories(blogData.id)
                setCategories(categoryData.map(c => ({ id: c.id, name: c.name })))
            } catch (err) {
                console.error('Failed to load categories:', err)
            }

            // 수정 모드: 기존 글 데이터 불러오기
            if (isEditMode) {
                try {
                    const postData = await getPost(editPostId)
                    if (postData) {
                        // 본인 글인지 확인
                        if (postData.user_id !== user.id) {
                            alert('수정 권한이 없습니다.')
                            router.back()
                            return
                        }
                        setTitle(postData.title)
                        setInitialContent(postData.content)
                        setCategoryIds(postData.category ? [postData.category.id] : [])

                        // 기존 이미지들도 추적 대상에 추가
                        const existingImages = extractImageUrls(postData.content)
                        existingImages.forEach(url => uploadedImagesRef.current.add(url))
                    }
                } catch (err) {
                    console.error('Failed to load post for edit:', err)
                    alert('게시글을 불러오는데 실패했습니다.')
                    router.back()
                    return
                }
            } else {
                // 작성 모드: 로컬 스토리지 임시저장 불러오기
                try {
                    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
                    if (saved) {
                        const draft: DraftData = JSON.parse(saved)
                        if (confirm('임시 저장된 글이 있습니다. 불러오시겠습니까?')) {
                            setTitle(draft.title || '')
                            setInitialContent(draft.content || '')
                            setCategoryIds(draft.categoryIds || [])
                            uploadedImagesRef.current = new Set(draft.uploadedImages || [])
                        } else {
                            // 불러오지 않으면 임시저장 삭제
                            localStorage.removeItem(DRAFT_STORAGE_KEY)
                        }
                    }
                } catch (error) {
                    console.error('Failed to load draft:', error)
                }
            }

            setLoading(false)
        }

        init()
    }, [router, isEditMode, editPostId])

    // 에디터에 초기 콘텐츠 설정
    useEffect(() => {
        if (editor && initialContent && !isInitializedRef.current) {
            editor.commands.setContent(initialContent)
            isInitializedRef.current = true
        }
    }, [initialContent])

    // Tiptap 에디터 설정
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // CodeBlockLowlight 사용을 위해 비활성화
            }),
            CodeBlockLowlight.extend({
                addNodeView() {
                    return ReactNodeViewRenderer(CodeBlockComponent)
                },
                addKeyboardShortcuts() {
                    return {
                        'Mod-a': ({ editor }) => {
                            const { $from } = editor.state.selection
                            const node = $from.node($from.depth)

                            // 코드블록 안에 있는지 확인
                            if (node.type.name === 'codeBlock') {
                                const pos = $from.before($from.depth)
                                const nodeSize = node.nodeSize
                                editor.commands.setTextSelection({
                                    from: pos + 1,
                                    to: pos + nodeSize - 1,
                                })
                                return true
                            }
                            return false
                        },
                    }
                },
            }).configure({
                lowlight,
                defaultLanguage: 'javascript',
            }),
            Underline,
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full rounded-lg',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                },
            }),
            Placeholder.configure({
                placeholder: '내용을 입력하세요...',
            }),
        ],
        content: '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px]',
            },
            handleDrop: (view, event, _slice, moved) => {
                if (!moved && event.dataTransfer?.files.length) {
                    const files = Array.from(event.dataTransfer.files)
                    const imageFiles = files.filter(file => file.type.startsWith('image/'))

                    if (imageFiles.length > 0) {
                        event.preventDefault()

                        imageFiles.forEach(async (file) => {
                            const url = await uploadTempImage(file)
                            if (url && view.state) {
                                // 업로드된 이미지 추적
                                uploadedImagesRef.current.add(url)

                                const { schema } = view.state
                                const coordinates = view.posAtCoords({
                                    left: event.clientX,
                                    top: event.clientY,
                                })

                                if (coordinates) {
                                    const node = schema.nodes.image.create({ src: url })
                                    const transaction = view.state.tr.insert(coordinates.pos, node)
                                    view.dispatch(transaction)
                                }
                            }
                        })

                        return true
                    }
                }
                return false
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items
                if (!items) return false

                const imageItems = Array.from(items).filter(
                    item => item.type.startsWith('image/')
                )

                if (imageItems.length > 0) {
                    event.preventDefault()

                    imageItems.forEach(async (item) => {
                        const file = item.getAsFile()
                        if (file) {
                            const url = await uploadTempImage(file)
                            if (url && view.state) {
                                // 업로드된 이미지 추적
                                uploadedImagesRef.current.add(url)

                                const { schema } = view.state
                                const node = schema.nodes.image.create({ src: url })
                                const transaction = view.state.tr.replaceSelectionWith(node)
                                view.dispatch(transaction)
                            }
                        }
                    })

                    return true
                }

                return false
            },
        },
        onUpdate: ({ editor }) => {
            // 수정 모드에서는 자동 저장(임시저장)을 하지 않거나, 별도 키로 저장할 수 있음. 
            // 여기서는 작성 모드일 때만 로컬 스토리지 저장
            if (!isEditMode) {
                // 현재 에디터의 이미지 URL 추출
                const currentContent = editor.getHTML()
                const currentImages = new Set(extractImageUrls(currentContent))

                // 삭제된 이미지 찾기 및 R2에서 삭제
                uploadedImagesRef.current.forEach(url => {
                    if (!currentImages.has(url)) {
                        deleteTempImage(url)
                        uploadedImagesRef.current.delete(url)
                    }
                })

                // localStorage에 저장 (디바운스 효과를 위해 setTimeout 사용)
                saveDraftDebounced(editor.getHTML())
            }
        },
    })

    // 에디터 초기화 Effect (중복 제거됨, 위 useEffect 통합)
    useEffect(() => {
        if (editor && initialContent && !isInitializedRef.current) {
            editor.commands.setContent(initialContent)
            isInitializedRef.current = true
        }
    }, [editor, initialContent])

    // localStorage에 저장 (작성 모드용)
    const saveDraft = useCallback((content: string) => {
        if (typeof window === 'undefined' || isEditMode) return

        const draft: DraftData = {
            title,
            content,
            categoryIds,
            uploadedImages: Array.from(uploadedImagesRef.current),
            lastSaved: Date.now(),
        }

        try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
        } catch (error) {
            console.error('Failed to save draft:', error)
        }
    }, [title, categoryIds, isEditMode])

    // 디바운스된 저장 함수
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const saveDraftDebounced = useCallback((content: string) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveDraft(content)
        }, 500)
    }, [saveDraft])

    // 제목/카테고리 변경 시 저장 (작성 모드만)
    useEffect(() => {
        if (editor && isInitializedRef.current && !isEditMode) {
            saveDraftDebounced(editor.getHTML())
        }
    }, [title, categoryIds, editor, saveDraftDebounced, isEditMode])

    // 초안 삭제
    const clearDraft = useCallback(() => {
        if (typeof window === 'undefined') return
        localStorage.removeItem(DRAFT_STORAGE_KEY)
    }, [])

    // 사용자 및 블로그 정보 가져오기
    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/')
                return
            }

            setUser(user)

            // 블로그 정보 가져오기 (다중 블로그 지원)
            const { data: blogList } = await supabase
                .from('blogs')
                .select('id, name')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: true })

            if (!blogList || blogList.length === 0) {
                router.push('/create-blog')
                return
            }

            // 활성 블로그 또는 첫 번째 블로그 사용
            const savedBlogId = typeof window !== 'undefined' ? localStorage.getItem('activeBlogId') : null
            const activeBlog = blogList.find(b => b.id === savedBlogId) || blogList[0]
            setBlog(activeBlog)

            // 카테고리 정보 가져오기 (백엔드 API 사용)
            try {
                const categoryData = await getCategories(activeBlog.id)
                setCategories(categoryData.map(c => ({ id: c.id, name: c.name })))
            } catch (err) {
                console.error('Failed to load categories:', err)
            }

            setLoading(false)
        }

        fetchData()
    }, [router])

    // 새 카테고리 추가
    const handleAddCategory = async (name: string): Promise<Category | null> => {
        if (!blog) return null

        try {
            const data = await createCategory(blog.id, name)
            const newCategory = { id: data.id, name: data.name }
            setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
            return newCategory
        } catch (err) {
            const message = err instanceof Error ? err.message : '카테고리 추가 실패'
            alert(message)
            return null
        }
    }

    // 임시저장 (작성 모드 전용)
    const handleSave = () => {
        if (isEditMode) {
            alert('수정 모드에서는 임시저장을 지원하지 않습니다.')
            return
        }
        if (editor) {
            saveDraft(editor.getHTML())
            alert('임시저장되었습니다.')
        }
    }

    // 발행하기 / 수정하기
    const handlePublish = async () => {
        if (!editor || !blog || !title.trim()) {
            alert('제목을 입력해주세요.')
            return
        }

        const content = editor.getHTML()
        if (content === '<p></p>' || !content.trim()) {
            alert('내용을 입력해주세요.')
            return
        }

        setSaving(true)

        try {
            if (isEditMode && editPostId) {
                // 수정
                await updatePost(editPostId, {
                    title: title.trim(),
                    content: content,
                    category_ids: categoryIds,
                    // published, is_private 등은 여기서 변경 안함 (기존 유지)
                })
                alert('게시글이 수정되었습니다.')
            } else {
                // 생성
                await createPost({
                    blog_id: blog.id,
                    title: title.trim(),
                    content: content,
                    category_ids: categoryIds,
                    published: true, // 기본 공개
                })

                // 발행 성공 시 초안 삭제
                clearDraft()
            }

            // 블로그 홈 또는 해당 글 상세로 이동
            if (isEditMode) {
                router.push(`/post/${editPostId}`)
            } else {
                router.push(`/blog/${blog.id}`)
            }

        } catch (error) {
            console.error(isEditMode ? '수정 실패:' : '발행 실패:', error)
            alert((isEditMode ? '수정' : '발행') + '에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setSaving(false)
        }
    }

    // 로딩 상태
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* 상단 헤더 */}
            <WriteHeader
                onBack={() => router.back()}
                onSave={handleSave}
                onPublish={handlePublish}
                saving={saving}
                isEdit={isEditMode} // 헤더에 수정 모드 전달 (버튼 텍스트 변경 등)
            />

            {/* 에디터 영역 */}
            <main className="mx-auto max-w-3xl px-6 py-10">
                {/* 제목 입력 */}
                <TitleInput value={title} onChange={setTitle} />

                {/* 카테고리 선택 */}
                <div className="mt-4">
                    <CategorySelector
                        categories={categories}
                        selectedIds={categoryIds}
                        onChange={setCategoryIds}
                        onAddCategory={handleAddCategory}
                        maxSelection={5}
                    />
                </div>

                {/* 구분선 */}
                <div className="my-6 h-px bg-black/10 dark:bg-white/10" />

                {/* 툴바 */}
                <EditorToolbar editor={editor} />

                {/* Tiptap 에디터 */}
                <EditorContent editor={editor} className="min-h-[500px]" />
            </main>
        </div>
    )
}

export default function WritePage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
            </div>
        }>
            <WriteContent />
        </Suspense>
    )
}
