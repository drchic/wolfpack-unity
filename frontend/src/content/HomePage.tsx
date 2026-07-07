import { useState, useEffect } from 'react'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'

export function HomePage() {
  const [announcements, setAnnouncements] = useState<PostView[]>([])
  const [news, setNews] = useState<PostView[]>([])
  const [blogs, setBlogs] = useState<PostView[]>([])
  const [vlogs, setVlogs] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getPosts({ type: 'ANNOUNCEMENT', size: 5 }),
      getPosts({ type: 'NEWS', size: 3 }),
      getPosts({ type: 'BLOG', size: 3 }),
      getPosts({ type: 'VLOG', size: 3 }),
    ])
      .then(([a, n, b, v]) => {
        setAnnouncements(a.content)
        setNews(n.content)
        setBlogs(b.content)
        setVlogs(v.content)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <h1>Wolfpack Unity</h1>
        {loading && <p>Loading...</p>}
        {!loading && (
          <>
            {announcements.length > 0 && (
              <section>
                <h2>Announcements</h2>
                {announcements.map(p => <PostCard key={p.id} post={p} />)}
              </section>
            )}
            {news.length > 0 && (
              <section>
                <h2>News</h2>
                {news.map(p => <PostCard key={p.id} post={p} />)}
              </section>
            )}
            {blogs.length > 0 && (
              <section>
                <h2>Blog</h2>
                {blogs.map(p => <PostCard key={p.id} post={p} />)}
              </section>
            )}
            {vlogs.length > 0 && (
              <section>
                <h2>Vlog</h2>
                {vlogs.map(p => <PostCard key={p.id} post={p} />)}
              </section>
            )}
            {announcements.length === 0 && news.length === 0 && blogs.length === 0 && vlogs.length === 0 && (
              <p>No posts yet.</p>
            )}
          </>
        )}
      </div>
    </>
  )
}
