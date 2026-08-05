import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { PostCard } from './PostCard'
import { getPosts, type PostView } from '../api/posts'
import { buttonClasses, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function HomePage() {
  const [announcements, setAnnouncements] = useState<PostView[]>([])
  const [news, setNews] = useState<PostView[]>([])
  const [blogs, setBlogs] = useState<PostView[]>([])
  const [vlogs, setVlogs] = useState<PostView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      .catch(() => setError('Failed to load posts'))
      .finally(() => setLoading(false))
  }, [])

  const isEmpty = announcements.length === 0 && news.length === 0 && blogs.length === 0 && vlogs.length === 0

  return (
    <>
      <TopNav />
      <section className="bg-gradient-to-b from-surface to-bg px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Train with the pack</div>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-none tracking-tight text-ink sm:text-6xl">
            Stronger<br />Every Day.
          </h1>
          <p className="mt-4 text-sm text-ink-muted">24/7 gym · hourly slots · book in seconds</p>
          <Link to="/book" className={buttonClasses('primary', 'mt-6 inline-block px-6 py-3 text-base')}>
            Book your slot →
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {loading && <Spinner />}
        {!loading && error && <ErrorMessage message={error} />}
        {!loading && !error && (
          <>
            {announcements.length > 0 && (
              <div className="mb-8 space-y-2">
                {announcements.map(p => (
                  <Link
                    key={p.id}
                    to={`/posts/${p.slug}`}
                    className="block rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink hover:border-accent"
                  >
                    <span className="mr-2 font-bold text-accent">📣 Announcement</span>
                    {p.title}
                  </Link>
                ))}
              </div>
            )}

            {([
              ['News', news, '/news'],
              ['Blog', blogs, '/blog'],
              ['Vlog', vlogs, '/vlog'],
            ] as const).map(([label, posts, href]) =>
              posts.length > 0 ? (
                <section key={label} className="mb-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-xl font-black uppercase tracking-tight text-ink">{label}</h2>
                    <Link to={href} className="text-sm font-medium text-accent hover:text-accent-hi">View all →</Link>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map(p => <PostCard key={p.id} post={p} />)}
                  </div>
                </section>
              ) : null
            )}

            {isEmpty && <EmptyState message="No posts yet." />}
          </>
        )}
      </div>
    </>
  )
}
