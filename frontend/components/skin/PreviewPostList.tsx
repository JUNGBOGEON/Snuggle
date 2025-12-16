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
    month: 'long',
    day: 'numeric',
  })
}

function getExcerpt(content: string, maxLength: number = 150) {
  const withoutCode = content.replace(/<pre[\s\S]*?<\/pre>/gi, '')
  const withoutImages = withoutCode.replace(/<img[^>]*>/gi, '')
  const pMatch = withoutImages.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  let firstLine = ''
  if (pMatch) {
    firstLine = pMatch[1].replace(/<[^>]*>/g, '').trim()
  } else {
    firstLine = withoutImages.replace(/<[^>]*>/g, '').trim().split(/\n/)[0] || ''
  }
  if (firstLine.length <= maxLength) return firstLine
  return firstLine.slice(0, maxLength) + '...'
}

export default function PreviewPostList({ cssVars, posts }: PreviewPostListProps) {
  return (
    <div>
      <div className="flex items-center justify-between pb-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: cssVars['--blog-fg'] }}
        >
          게시글
        </h2>
        <span
          className="text-sm"
          style={{ color: cssVars['--blog-muted'] }}
        >
          {posts.length}개
        </span>
      </div>

      {posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="text-3xl">📝</div>
          <p
            className="mt-3"
            style={{ color: cssVars['--blog-muted'] }}
          >
            아직 작성된 글이 없습니다
          </p>
        </div>
      ) : (
        <div
          className="border-t"
          style={{
            borderColor: cssVars['--blog-border'],
          }}
        >
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="py-4 border-b"
              style={{
                borderColor: index < posts.length - 1 ? cssVars['--blog-border'] : 'transparent',
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {post.is_private && (
                      <span
                        className="inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: cssVars['--blog-fg'] + '0a',
                          color: cssVars['--blog-muted'],
                        }}
                      >
                        <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        비공개
                      </span>
                    )}
                    <h3
                      className="truncate font-semibold"
                      style={{ color: cssVars['--blog-fg'] }}
                    >
                      {post.title}
                    </h3>
                  </div>
                  <p
                    className="mt-1.5 line-clamp-1 text-sm"
                    style={{ color: cssVars['--blog-muted'] }}
                  >
                    {getExcerpt(post.content || '')}
                  </p>

                  {/* 날짜 + 통계 */}
                  <div className="mt-2 flex items-center gap-2.5 text-xs">
                    <span
                      style={{ color: cssVars['--blog-muted'], opacity: 0.7 }}
                    >
                      {formatDate(post.created_at)}
                    </span>

                    <span style={{ color: cssVars['--blog-border'] }}>·</span>

                    {/* 조회수 */}
                    <div
                      className="flex items-center gap-1"
                      style={{ color: cssVars['--blog-muted'], opacity: 0.6 }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{(post.view_count || 0).toLocaleString()}</span>
                    </div>

                    {/* 좋아요 */}
                    <div
                      className="flex items-center gap-1"
                      style={{ color: cssVars['--blog-muted'], opacity: 0.6 }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>{(post.like_count || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {post.thumbnail_url && (
                  <img
                    src={post.thumbnail_url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
