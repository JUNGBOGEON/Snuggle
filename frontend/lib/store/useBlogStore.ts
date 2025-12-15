import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

export interface Blog {
    id: string
    name: string
    description: string | null
    thumbnail_url: string | null
    user_id?: string
    total_view_count?: number
}

const SELECTED_BLOG_KEY = 'snuggle_selected_blog_id'

interface BlogStore {
    blogs: Blog[]
    selectedBlog: Blog | null
    isLoading: boolean
    hasFetched: boolean
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
    isLoading: false,
    hasFetched: false,

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
                set({ blogs: [], selectedBlog: null, isLoading: false, hasFetched: true })
                return
            }

            if (!data || data.length === 0) {
                set({ blogs: [], selectedBlog: null, isLoading: false, hasFetched: true })
                return
            }

            // 각 블로그의 총 조회수 계산
            const blogsWithStats = await Promise.all(data.map(async (blog) => {
                const { data: posts } = await supabase
                    .from('posts')
                    .select('view_count')
                    .eq('blog_id', blog.id)

                const totalViewCount = posts
                    ? posts.reduce((sum, post) => sum + (post.view_count || 0), 0)
                    : 0

                return {
                    ...blog,
                    total_view_count: totalViewCount
                }
            }))

            set({ blogs: blogsWithStats })

            // localStorage에서 이전 선택 복원
            let savedBlogId: string | null = null
            if (typeof window !== 'undefined') {
                savedBlogId = localStorage.getItem(SELECTED_BLOG_KEY)
            }

            const savedBlog = blogsWithStats.find(b => b.id === savedBlogId)
            const selectedBlog = savedBlog || blogsWithStats[0]

            set({ selectedBlog, isLoading: false, hasFetched: true })

        } catch (err) {
            console.error('Failed to fetch blogs:', err)
            set({ blogs: [], selectedBlog: null, isLoading: false, hasFetched: true })
        }
    },

    clear: () => {
        set({ blogs: [], selectedBlog: null, isLoading: false, hasFetched: false })
        if (typeof window !== 'undefined') {
            localStorage.removeItem(SELECTED_BLOG_KEY)
        }
    },
}))
