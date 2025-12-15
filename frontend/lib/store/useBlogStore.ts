import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

export interface Blog {
    id: string
    name: string
    description: string | null
    thumbnail_url: string | null
    user_id?: string
}

const SELECTED_BLOG_KEY = 'snuggle_selected_blog_id'

interface BlogStore {
    blogs: Blog[]
    selectedBlog: Blog | null
    isLoading: boolean
    setBlogs: (blogs: Blog[]) => void
    setSelectedBlog: (blog: Blog | null) => void
    selectBlog: (blog: Blog) => void
    setLoading: (loading: boolean) => void
    fetchBlogs: (userId: string) => Promise<void>
    clear: () => void
}

export const useBlogStore = create<BlogStore>((set, get) => ({
    blogs: [],
    selectedBlog: null,
    isLoading: true,

    setBlogs: (blogs) => set({ blogs }),

    setSelectedBlog: (blog) => set({ selectedBlog: blog }),

    selectBlog: (blog) => {
        set({ selectedBlog: blog })
        // localStorage에 저장
        if (typeof window !== 'undefined') {
            localStorage.setItem(SELECTED_BLOG_KEY, blog.id)
        }
    },

    setLoading: (loading) => set({ isLoading: loading }),

    fetchBlogs: async (userId: string) => {
        set({ isLoading: true })

        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('blogs')
                .select('id, name, description, thumbnail_url, user_id')
                .eq('user_id', userId)
                .is('deleted_at', null)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Failed to fetch blogs:', error)
                set({ blogs: [], selectedBlog: null, isLoading: false })
                return
            }

            if (!data || data.length === 0) {
                set({ blogs: [], selectedBlog: null, isLoading: false })
                return
            }

            set({ blogs: data })

            // localStorage에서 이전 선택 복원
            let savedBlogId: string | null = null
            if (typeof window !== 'undefined') {
                savedBlogId = localStorage.getItem(SELECTED_BLOG_KEY)
            }

            const savedBlog = data.find(b => b.id === savedBlogId)
            const selectedBlog = savedBlog || data[0]

            set({ selectedBlog, isLoading: false })

        } catch (err) {
            console.error('Failed to fetch blogs:', err)
            set({ blogs: [], selectedBlog: null, isLoading: false })
        }
    },

    clear: () => {
        set({ blogs: [], selectedBlog: null, isLoading: false })
        if (typeof window !== 'undefined') {
            localStorage.removeItem(SELECTED_BLOG_KEY)
        }
    },
}))
