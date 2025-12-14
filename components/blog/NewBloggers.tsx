'use client'

import { useEffect, useState } from 'react'
import { getNewBlogs, BlogItem } from '@/lib/api/blogs'

export default function NewBloggers() {
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchBlogs = async () => {
      const data = await getNewBlogs(3)
      setBlogs(data)
      setLoading(false)
    }
    fetchBlogs()
  }, [])

  const handleImageError = (blogId: string) => {
    setFailedImages((prev) => new Set(prev).add(blogId))
  }

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-black/10 dark:border-white/10">
        <h3 className="px-4 pt-4 text-sm font-semibold text-black/50 dark:text-white/50">
          신규 블로거
        </h3>
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (blogs.length === 0) {
    return null
  }

  return (
    <div className="mt-8 rounded-xl border border-black/10 dark:border-white/10">
      <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-black/50 dark:text-white/50">
        신규 블로거
      </h3>
      <div className="divide-y divide-black/10 dark:divide-white/10">
        {blogs.map((blog) => {
          const thumbnailFailed = failedImages.has(blog.id)
          const imageUrl = thumbnailFailed
            ? blog.profile_image_url
            : blog.thumbnail_url || blog.profile_image_url
          return (
            <a
              key={blog.id}
              href={`/blog/${blog.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={blog.name}
                  className="h-10 w-10 rounded-full object-cover"
                  onError={() => handleImageError(blog.id)}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-sm font-bold text-white">
                  {blog.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-white truncate">
                  {blog.name}
                </p>
                {blog.description && (
                  <p className="mt-0.5 text-xs text-black/50 dark:text-white/50 truncate">
                    {blog.description}
                  </p>
                )}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
