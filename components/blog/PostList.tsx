'use client'

import { useEffect, useState } from 'react'
import { getPosts, PostListItem } from '@/lib/api/posts'
import PostCard from './PostCard'

interface Post {
  id: string
  title: string
  content: string | null
  thumbnail_url: string | null
  created_at: string
  blog: {
    name: string
    thumbnail_url: string | null
  } | null
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts(20, 0)
        setPosts(data)
      } catch (err) {
        console.error('Error fetching posts:', err)
      }
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
