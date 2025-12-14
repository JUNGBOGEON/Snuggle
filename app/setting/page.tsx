'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/useUserStore'
import { deleteAccount, deleteBlog, restoreBlog, getDeletedBlogs, DeletedBlog, getAccountStatus, restoreAccount } from '@/lib/api/account'
import ProfileImage from '@/components/common/ProfileImage'

const ThemeToggle = dynamic(() => import('@/components/common/ThemeToggle'), {
    ssr: false,
    loading: () => <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10" />,
})

interface Blog {
    id: string
    name: string
    description: string | null
    thumbnail_url: string | null
}

export default function SettingPage() {
    const router = useRouter()
    const { user } = useUserStore()
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [deletedBlogs, setDeletedBlogs] = useState<DeletedBlog[]>([])
    const [loading, setLoading] = useState(true)
    const [initializing, setInitializing] = useState(true)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBlogDeleteModal, setShowBlogDeleteModal] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [isAccountDeleted, setIsAccountDeleted] = useState(false)
    const [accountDeletedAt, setAccountDeletedAt] = useState<string | null>(null)
    const [restoring, setRestoring] = useState(false)

    // user 상태가 초기화될 때까지 기다림
    useEffect(() => {
        const supabase = createClient()

        const checkUser = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser()
            if (!currentUser) {
                router.push('/')
                return
            }
            setInitializing(false)
        }

        checkUser()
    }, [router])

    const fetchBlogs = async () => {
        if (!user) return

        const supabase = createClient()
        const { data, error } = await supabase
            .from('blogs')
            .select('id, name, description, thumbnail_url')
            .eq('user_id', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: true })

        if (!error && data) {
            setBlogs(data)
        }
    }

    const fetchDeletedBlogs = async () => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
            try {
                const deleted = await getDeletedBlogs(session.access_token)
                setDeletedBlogs(deleted)
            } catch (error) {
                console.error('Failed to fetch deleted blogs:', error)
            }
        }
    }

    const checkAccountStatus = async () => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
            try {
                const status = await getAccountStatus(session.access_token)
                setIsAccountDeleted(status.isDeleted)
                setAccountDeletedAt(status.deletedAt)
            } catch (error) {
                console.error('Failed to check account status:', error)
            }
        }
    }

    useEffect(() => {
        if (!user || initializing) {
            return
        }

        const loadData = async () => {
            await Promise.all([fetchBlogs(), fetchDeletedBlogs(), checkAccountStatus()])
            setLoading(false)
        }

        loadData()
    }, [user, initializing])

    const handleDeleteBlog = async (blogId: string) => {
        setDeleting(true)
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.access_token) {
                await deleteBlog(session.access_token, blogId)
                await Promise.all([fetchBlogs(), fetchDeletedBlogs()])
                setShowBlogDeleteModal(null)
            }
        } catch (error) {
            console.error('Delete blog error:', error)
            alert('블로그 삭제 중 오류가 발생했습니다.')
        }
        setDeleting(false)
    }

    const handleRestoreBlog = async (blogId: string) => {
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.access_token) {
                await restoreBlog(session.access_token, blogId)
                await Promise.all([fetchBlogs(), fetchDeletedBlogs()])
            }
        } catch (error) {
            console.error('Restore blog error:', error)
            alert('블로그 복구 중 오류가 발생했습니다.')
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== '탈퇴합니다') return

        setDeleting(true)
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.access_token) {
                await deleteAccount(session.access_token)
                await supabase.auth.signOut()
                router.push('/')
            }
        } catch (error) {
            console.error('Delete account error:', error)
            alert('계정 탈퇴 중 오류가 발생했습니다.')
        }
        setDeleting(false)
    }

    const handleRestoreAccount = async () => {
        setRestoring(true)
        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (session?.access_token) {
                await restoreAccount(session.access_token)
                setIsAccountDeleted(false)
                setAccountDeletedAt(null)
                await Promise.all([fetchBlogs(), fetchDeletedBlogs()])
                alert('계정이 복구되었습니다!')
            }
        } catch (error) {
            console.error('Restore account error:', error)
            alert('계정 복구 중 오류가 발생했습니다.')
        }
        setRestoring(false)
    }

    // 초기화 중이거나 user가 없으면 로딩 표시
    if (initializing || !user) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="animate-pulse text-black/50 dark:text-white/50">로딩 중...</div>
            </div>
        )
    }

    const kakaoProfileImage = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
    const nickname = user?.user_metadata?.name || user?.user_metadata?.full_name || '사용자'

    const formatDeletedDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Header */}
            <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <Link href="/" className="text-xl font-bold text-black dark:text-white">
                        Snuggle
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main */}
            <main className="mx-auto max-w-2xl px-6 py-12">
                <h1 className="text-2xl font-bold text-black dark:text-white">계정 설정</h1>

                {/* 삭제된 계정 복구 배너 */}
                {isAccountDeleted && (
                    <section className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
                                    계정이 삭제 예정입니다
                                </h2>
                                <p className="mt-1 text-sm text-red-600/70 dark:text-red-400/70">
                                    {accountDeletedAt && `${formatDeletedDate(accountDeletedAt)}에 삭제되었습니다. `}
                                    30일 이내에 복구하지 않으면 모든 데이터가 영구 삭제됩니다.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleRestoreAccount}
                                    disabled={restoring}
                                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                                >
                                    {restoring ? '복구 중...' : '계정 복구하기'}
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* 프로필 정보 */}
                <section className="mt-8 rounded-2xl border border-black/10 p-6 dark:border-white/10">
                    <h2 className="text-lg font-semibold text-black dark:text-white">내 프로필</h2>
                    <div className="mt-4 flex items-center gap-4">
                        <ProfileImage
                            src={kakaoProfileImage}
                            alt={nickname}
                            fallback={nickname}
                            size="lg"
                            rounded="full"
                        />
                        <div>
                            <p className="font-medium text-black dark:text-white">{nickname}</p>
                            <p className="text-sm text-black/50 dark:text-white/50">{user.email}</p>
                        </div>
                    </div>
                </section>

                {/* 내 블로그 */}
                <section className="mt-6 rounded-2xl border border-black/10 p-6 dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-black dark:text-white">내 블로그</h2>
                        <Link
                            href="/create-blog"
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
                        >
                            새 블로그 만들기
                        </Link>
                    </div>

                    {loading ? (
                        <div className="mt-4 space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-16 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
                            ))}
                        </div>
                    ) : blogs.length === 0 ? (
                        <p className="mt-4 text-sm text-black/50 dark:text-white/50">
                            아직 블로그가 없습니다.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {blogs.map((blog) => (
                                <div
                                    key={blog.id}
                                    className="flex items-center justify-between rounded-lg border border-black/10 p-4 dark:border-white/10"
                                >
                                    <Link
                                        href={`/blog/${blog.id}`}
                                        className="flex items-center gap-3 flex-1"
                                    >
                                        <ProfileImage
                                            src={blog.thumbnail_url}
                                            alt={blog.name}
                                            fallback={blog.name}
                                            size="md"
                                            rounded="xl"
                                        />
                                        <div>
                                            <p className="font-medium text-black dark:text-white">{blog.name}</p>
                                            {blog.description && (
                                                <p className="text-sm text-black/50 dark:text-white/50 line-clamp-1">
                                                    {blog.description}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setShowBlogDeleteModal(blog.id)}
                                        className="ml-3 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950"
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 삭제된 블로그 (복구 가능) */}
                {deletedBlogs.length > 0 && (
                    <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-900 dark:bg-orange-950">
                        <h2 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                            삭제된 블로그 ({deletedBlogs.length})
                        </h2>
                        <p className="mt-1 text-sm text-orange-600/70 dark:text-orange-400/70">
                            복구하지 않으면 30일 후 영구 삭제됩니다.
                        </p>

                        <div className="mt-4 space-y-3">
                            {deletedBlogs.map((blog) => (
                                <div
                                    key={blog.id}
                                    className="flex items-center justify-between rounded-lg border border-orange-200 bg-white p-4 dark:border-orange-800 dark:bg-black"
                                >
                                    <div className="flex items-center gap-3">
                                        <ProfileImage
                                            src={blog.thumbnail_url}
                                            alt={blog.name}
                                            fallback={blog.name}
                                            size="md"
                                            rounded="xl"
                                        />
                                        <div>
                                            <p className="font-medium text-black dark:text-white">{blog.name}</p>
                                            <p className="text-xs text-black/50 dark:text-white/50">
                                                삭제됨: {formatDeletedDate(blog.deleted_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRestoreBlog(blog.id)}
                                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
                                    >
                                        복구
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 위험 영역 */}
                <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">위험 영역</h2>
                    <p className="mt-2 text-sm text-red-600/70 dark:text-red-400/70">
                        계정을 탈퇴하면 모든 블로그와 게시글이 영구적으로 삭제됩니다.
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="mt-4 rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                    >
                        계정 탈퇴
                    </button>
                </section>
            </main>

            {/* 블로그 삭제 확인 모달 */}
            {showBlogDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900">
                        <h3 className="text-lg font-bold text-black dark:text-white">
                            블로그를 삭제하시겠습니까?
                        </h3>
                        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                            삭제된 블로그는 30일 이내에 복구할 수 있습니다.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowBlogDeleteModal(null)}
                                className="flex-1 rounded-lg border border-black/10 py-2 text-sm font-medium text-black dark:border-white/10 dark:text-white"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteBlog(showBlogDeleteModal)}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {deleting ? '처리 중...' : '삭제하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 계정 탈퇴 확인 모달 */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-900">
                        <h3 className="text-lg font-bold text-black dark:text-white">
                            정말 탈퇴하시겠습니까?
                        </h3>
                        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                            탈퇴하면 모든 블로그와 게시글이 삭제되며, 이 작업은 되돌릴 수 없습니다.
                        </p>
                        <p className="mt-4 text-sm text-black/80 dark:text-white/80">
                            확인을 위해 <strong>&quot;탈퇴합니다&quot;</strong>를 입력하세요:
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="탈퇴합니다"
                            className="mt-2 w-full rounded-lg border border-black/10 px-4 py-2 text-sm outline-none dark:border-white/10 dark:bg-gray-800 dark:text-white"
                        />
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false)
                                    setDeleteConfirmText('')
                                }}
                                className="flex-1 rounded-lg border border-black/10 py-2 text-sm font-medium text-black dark:border-white/10 dark:text-white"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== '탈퇴합니다' || deleting}
                                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white disabled:opacity-50"
                            >
                                {deleting ? '처리 중...' : '탈퇴하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
