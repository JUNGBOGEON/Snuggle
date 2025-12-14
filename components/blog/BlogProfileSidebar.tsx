'use client'

import ProfileImage from '@/components/common/ProfileImage'
import VisitorCounter from './VisitorCounter'

interface Blog {
  id: string
  user_id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  created_at: string
}

interface Profile {
  id: string
  nickname: string | null
  profile_image_url: string | null
}

interface BlogProfileSidebarProps {
  blog: Blog
  profile: Profile | null
  postCount: number
  isOwner: boolean
}

export default function BlogProfileSidebar({
  blog,
  profile,
  postCount,
  isOwner,
}: BlogProfileSidebarProps) {
  const createdDate = new Date(blog.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="sticky top-10 space-y-6">
      {/* 프로필 카드 */}
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        {/* 블로그 썸네일 */}
        <div className="flex flex-col items-center">
          <ProfileImage
            src={blog.thumbnail_url || profile?.profile_image_url}
            alt={blog.name}
            fallback={blog.name}
            size="lg"
            rounded="2xl"
          />

          <h1 className="mt-4 text-xl font-bold text-black dark:text-white">
            {blog.name}
          </h1>

          {blog.description && (
            <p className="mt-3 text-center text-sm text-black/70 dark:text-white/70">
              {blog.description}
            </p>
          )}
        </div>

        {/* 통계 */}
        <div className="mt-6 flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-black dark:text-white">
              {postCount ?? 0}
            </p>
            <p className="text-xs text-black/50 dark:text-white/50">게시글</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-black dark:text-white">0</p>
            <p className="text-xs text-black/50 dark:text-white/50">구독자</p>
          </div>
          <VisitorCounter variant="stat" />
        </div>

        {/* 소유자 전용 버튼 */}
        {isOwner && (
          <div className="mt-6 space-y-2">
            <a
              href={`/blog/${blog.id}/settings`}
              className="block w-full rounded-lg border border-black/10 py-2.5 text-center text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              블로그 설정
            </a>
          </div>
        )}
      </div>

      {/* 블로그 정보 */}
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h3 className="text-sm font-semibold text-black dark:text-white">
          블로그 정보
        </h3>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-black/50 dark:text-white/50">개설일</span>
            <span className="text-black dark:text-white">{createdDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/50 dark:text-white/50">총 게시글</span>
            <span className="text-black dark:text-white">{postCount ?? 0}개</span>
          </div>
        </div>
      </div>
    </div>
  )
}
