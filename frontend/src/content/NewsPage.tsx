import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'
import { Button, PageHeader, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function NewsPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const size = 20

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([
      getPosts({ type: 'NEWS', page, size }),
      getPosts({ type: 'ANNOUNCEMENT', page, size }),
    ])
      .then(([newsPage, announcementPage]) => {
        const merged = [...newsPage.content, ...announcementPage.content]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        setPosts(merged)
        const newsHasMore = (page + 1) * size < newsPage.total
        const announcementHasMore = (page + 1) * size < announcementPage.total
        setHasMore(newsHasMore || announcementHasMore)
      })
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <PageHeader title="News" subtitle="Announcements and news from the gym" />
        <div className="mt-6">
          {loading && <Spinner />}
          {!loading && error && <ErrorMessage message={error} />}
          {!loading && !error && posts.length === 0 && <EmptyState message="No news yet." />}
          {!loading && !error && posts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
          {page > 0 && <Button variant="ghost" onClick={() => setPage(p => p - 1)}>← Previous</Button>}
          {hasMore && <Button variant="ghost" onClick={() => setPage(p => p + 1)}>Next →</Button>}
        </div>
      </div>
    </>
  )
}
