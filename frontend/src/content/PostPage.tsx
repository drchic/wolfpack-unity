import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { getPost, type PostView } from '../api/posts'
import { Badge, Spinner, ErrorMessage } from '../components/ui'

function extractYoutubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return match ? match[1] : null
}

export function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostView | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) return
    getPost(slug).then(setPost).catch(() => setError(true))
  }, [slug])

  if (error) return (
    <>
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorMessage message="Post not found." />
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-hi">
          Back to home
        </Link>
      </div>
    </>
  )

  if (!post) return (
    <>
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Spinner />
      </div>
    </>
  )

  const date = new Date(post.publishedAt).toLocaleDateString()
  const videoId = post.type === 'VLOG' && post.youtubeUrl ? extractYoutubeId(post.youtubeUrl) : null

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs text-ink-muted">
          <Link to="/" className="hover:text-ink">Home</Link> · {post.type}
        </p>
        <div className="mt-3">
          <Badge type={post.type} />
        </div>
        <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-ink">{post.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{post.authorName} · {date}</p>
        {videoId && (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-xl">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              title={post.title}
            />
          </div>
        )}
        {post.body && (
          <p className="mt-6 whitespace-pre-wrap leading-relaxed text-ink-muted">{post.body}</p>
        )}
      </div>
    </>
  )
}
