import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function HomePage() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPosts({ size: 10 })
      .then(p => setPosts(p.content))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>Wolfpack Unity</h1>
        {loading && <p>Loading...</p>}
        {posts.map(p => <PostCard key={p.id} post={p} />)}
        {!loading && posts.length === 0 && <p>No posts yet.</p>}
      </div>
    </>
  )
}
