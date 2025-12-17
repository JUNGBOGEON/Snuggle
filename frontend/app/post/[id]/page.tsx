export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import PostClient from './PostClient'

interface PostPageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params

  return <PostClient postId={id} />
}
