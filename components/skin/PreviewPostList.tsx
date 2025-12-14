'use client'

import { SkinCssVariables } from '@/lib/api/skins'
import { Post } from '@/lib/api/posts'

interface PreviewPostListProps {
  cssVars: SkinCssVariables
  posts: Post[]
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function extractText(html: string, maxLength: number = 100) {
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

export default function PreviewPostList({ cssVars, posts }: PreviewPostListProps) {
  return (
    <div>
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ color: cssVars['--blog-fg'] }}
      >
        최근 글
      </h2>

      {posts.length === 0 ? (
        <div
          className="rounded-xl border py-12 text-center"
          style={{
            borderColor: cssVars['--blog-border'],
            backgroundColor: cssVars['--blog-card-bg'],
          }}
        >
          <p style={{ color: cssVars['--blog-muted'] }}>
            아직 작성된 글이 없습니다
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex gap-4 rounded-xl border p-4"
              style={{
                borderColor: cssVars['--blog-border'],
                backgroundColor: cssVars['--blog-card-bg'],
              }}
            >
              {post.thumbnail_url && (
                <img
                  src={post.thumbnail_url}
                  alt=""
                  className="h-20 w-28 shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-medium line-clamp-1"
                  style={{ color: cssVars['--blog-fg'] }}
                >
                  {post.title}
                </h3>
                <p
                  className="mt-1 text-sm line-clamp-2"
                  style={{ color: cssVars['--blog-muted'] }}
                >
                  {extractText(post.content || '')}
                </p>
                <p
                  className="mt-2 text-xs"
                  style={{ color: cssVars['--blog-muted'], opacity: 0.7 }}
                >
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
