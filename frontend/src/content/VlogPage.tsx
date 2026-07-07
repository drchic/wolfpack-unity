import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function VlogPage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const size = 20

  useEffect(() => {
    setLoading(true)
    getPosts({ type: 'VLOG', page, size })
      .then(p => { setPosts(p.content); setTotal(p.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>Vlog</h1>
        {loading && <p>Loading...</p>}
        {posts.map(p => <PostCard key={p.id} post={p} />)}
        {!loading && posts.length === 0 && <p>No vlogs yet.</p>}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          {page > 0 && <button onClick={() => setPage(p => p - 1)}>← Previous</button>}
          {(page + 1) * size < total && <button onClick={() => setPage(p => p + 1)}>Next →</button>}
        </div>
      </div>
    </>
  )
}
