import { Link } from 'react-router-dom'
import type { PostView } from '../api/posts'

interface Props { post: PostView }

export function PostCard({ post }: Props) {
  const date = new Date(post.publishedAt).toLocaleDateString()
  return (
    <div style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
      <Link to={`/posts/${post.slug}`} style={{ fontSize: '1.1rem', fontWeight: 600, textDecoration: 'none', color: '#1a1a1a' }}>
        {post.title}
      </Link>
      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
        <span>{post.authorName}</span><span> · </span><span>{date}</span>
      </div>
      {post.type === 'VLOG' && post.youtubeUrl && (
        <div style={{ marginTop: '8px' }}>
          <a href={post.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem' }}>
            Watch on YouTube
          </a>
        </div>
      )}
      {post.type !== 'VLOG' && post.body && (
        <p style={{ marginTop: '8px', color: '#333', fontSize: '0.95rem' }}>
          {post.body.slice(0, 160)}{post.body.length > 160 ? '…' : ''}
        </p>
      )}
    </div>
  )
}
