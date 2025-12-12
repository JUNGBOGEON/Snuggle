'use client'

interface PostCardProps {
  post: {
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
}

// HTML 태그 제거 함수
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\n/g, ' ').trim()
}

export default function PostCard({ post }: PostCardProps) {
  const blogName = post.blog?.name || '알 수 없음'
  const blogImage = post.blog?.thumbnail_url
  const preview = post.content ? stripHtml(post.content).slice(0, 100) : ''
  const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <a href={`/post/${post.id}`} className="block">
      <article className="border-b border-black/10 py-6 transition-colors hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.02]">
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

            {/* 블로그 정보 */}
            <div className="mt-3 flex items-center gap-2">
              {blogImage ? (
                <img
                  src={blogImage}
                  alt={blogName}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-xs dark:bg-white/10">
                  {blogName.charAt(0)}
                </div>
              )}
              <span className="text-xs text-black/50 dark:text-white/50">
                {blogName} · {date}
              </span>
            </div>
          </div>
        </div>
      </article>
    </a>
  )
}
