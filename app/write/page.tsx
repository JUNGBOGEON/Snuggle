'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// 분리된 컴포넌트들
import WriteHeader from '@/components/write/WriteHeader'
import EditorToolbar from '@/components/write/EditorToolbar'
import TitleInput from '@/components/write/TitleInput'

// 에디터 전용 스타일
import '@/components/write/editor.css'

interface Blog {
    id: string
    name: string
}

export default function WritePage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [blog, setBlog] = useState<Blog | null>(null)
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Tiptap 에디터 설정
    const editor = useEditor({
        extensions: [
            StarterKit,
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
        },
    })

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
            setLoading(false)
        }

        fetchData()
    }, [router])

    // 임시저장
    const handleSave = () => {
        // TODO: 임시저장 기능 구현
        alert('임시저장 기능은 준비 중입니다.')
    }

    // 발행하기
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
            const supabase = createClient()

            const { error } = await supabase
                .from('posts')
                .insert({
                    blog_id: blog.id,
                    title: title.trim(),
                    content: content,
                    published: true,
                })
                .select()
                .single()

            if (error) throw error

            router.push(`/blog/${blog.id}`)
        } catch (error) {
            console.error('발행 실패:', error)
            alert('발행에 실패했습니다. 다시 시도해주세요.')
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
            />

            {/* 에디터 영역 */}
            <main className="mx-auto max-w-3xl px-6 py-10">
                {/* 제목 입력 */}
                <TitleInput value={title} onChange={setTitle} />

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
