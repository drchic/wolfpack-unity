import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'
import { Button, PageHeader, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function BlogPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const size = 20

  useEffect(() => {
    setLoading(true)
    setError('')
    getPosts({ type: 'BLOG', page, size })
      .then(p => { setPosts(p.content); setTotal(p.total) })
      .catch(() => setError('Failed to load blog posts'))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="Blog" subtitle="Training tips and gym updates" />
        <div className="mt-6">
          {loading && <Spinner />}
          {!loading && error && <ErrorMessage message={error} />}
          {!loading && !error && posts.length === 0 && <EmptyState message="No blog posts yet." />}
          {!loading && !error && posts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
          {page > 0 && <Button variant="ghost" onClick={() => setPage(p => p - 1)}>← Previous</Button>}
          {(page + 1) * size < total && <Button variant="ghost" onClick={() => setPage(p => p + 1)}>Next →</Button>}
        </div>
      </div>
    </>
  )
}
