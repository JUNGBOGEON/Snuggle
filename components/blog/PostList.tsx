'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PostCard from './PostCard'

interface Post {
  id: string
  title: string
  content: string | null
  thumbnail_url: string | null
  created_at: string
  blogs: {
    name: string
    profiles: {
      nickname: string
      profile_image_url: string | null
    } | null
  } | null
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          thumbnail_url,
          created_at,
          blog_id
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching posts:', error)
        setLoading(false)
        return
      }

      // 각 포스트의 블로그와 프로필 정보 가져오기
      const postsWithDetails = await Promise.all(
        (data || []).map(async (post) => {
          // 블로그 정보 가져오기
          const { data: blog } = await supabase
            .from('blogs')
            .select('name, user_id')
            .eq('id', post.blog_id)
            .single()

          let profiles = null
          if (blog?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('nickname, profile_image_url')
              .eq('id', blog.user_id)
              .single()
            profiles = profile
          }

          return {
            id: post.id,
            title: post.title,
            content: post.content,
            thumbnail_url: post.thumbnail_url,
            created_at: post.created_at,
            blogs: blog ? { name: blog.name, profiles } : null,
          }
        })
      )

      setPosts(postsWithDetails)
      setLoading(false)
    }

    fetchPosts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse border-b border-black/10 py-6 dark:border-white/10">
            <div className="flex gap-4">
              <div className="h-24 w-24 rounded-lg bg-black/10 dark:bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 rounded bg-black/10 dark:bg-white/10" />
                <div className="h-4 w-full rounded bg-black/10 dark:bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-black/50 dark:text-white/50">
          아직 게시된 글이 없습니다
        </p>
      </div>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
