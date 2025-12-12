'use client'

interface PostCardProps {
  post: {
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
}

export default function PostCard({ post }: PostCardProps) {
  const blogName = post.blogs?.name || '알 수 없음'
  const authorName = post.blogs?.profiles?.nickname || '익명'
  const authorImage = post.blogs?.profiles?.profile_image_url
  const preview = post.content?.slice(0, 100) || ''
  const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <article className="border-b border-black/10 py-6 dark:border-white/10">
      <div className="flex gap-4">
        {/* 썸네일 */}
        {post.thumbnail_url && (
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-black dark:text-white truncate">
            {post.title}
          </h3>
          {preview && (
            <p className="mt-1 text-sm text-black/60 dark:text-white/60 line-clamp-2">
              {preview}...
            </p>
          )}

          {/* 작성자 정보 */}
          <div className="mt-3 flex items-center gap-2">
            {authorImage ? (
              <img
                src={authorImage}
                alt={authorName}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs dark:bg-white/10">
                {authorName.charAt(0)}
              </div>
            )}
            <span className="text-xs text-black/50 dark:text-white/50">
              {blogName} · {date}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
