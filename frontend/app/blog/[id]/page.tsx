export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import BlogClient from './BlogClient'

interface BlogPageProps {
  params: Promise<{ id: string }>
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { id } = await params

  return <BlogClient blogId={id} />
}
