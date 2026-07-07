import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { getPost, type PostView } from '../api/posts'

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
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <p>Post not found. <Link to="/">Back to home</Link></p>
      </div>
    </>
  )

  if (!post) return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <p>Loading...</p>
      </div>
    </>
  )

  const date = new Date(post.publishedAt).toLocaleDateString()

  return (
    <>
      <TopNav />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 24px' }}>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          <Link to="/">Home</Link> · {post.type}
        </p>
        <h1>{post.title}</h1>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{post.authorName} · {date}</p>
        {post.type === 'VLOG' && (() => {
          const videoId = post.youtubeUrl ? extractYoutubeId(post.youtubeUrl) : null
          return videoId ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', marginBottom: '24px' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                allowFullScreen
                title={post.title}
              />
            </div>
          ) : null
        })()}
        {post.body && <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.body}</p>}
      </div>
    </>
  )
}
