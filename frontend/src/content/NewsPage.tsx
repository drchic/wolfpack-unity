import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function NewsPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const size = 20

  useEffect(() => {
    setLoading(true)
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
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>News</h1>
        {loading && <p>Loading...</p>}
        {posts.map(p => <PostCard key={p.id} post={p} />)}
        {!loading && posts.length === 0 && <p>No news yet.</p>}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          {page > 0 && <button onClick={() => setPage(p => p - 1)}>← Previous</button>}
          {hasMore && <button onClick={() => setPage(p => p + 1)}>Next →</button>}
        </div>
      </div>
    </>
  )
}
