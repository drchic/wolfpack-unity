import { Link } from 'react-router-dom'
import type { PostView } from '../api/posts'
import { Badge, Card } from '../components/ui'

interface Props { post: PostView }

function extractYoutubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return match ? match[1] : null
}

export function PostCard({ post }: Props) {
  const date = new Date(post.publishedAt).toLocaleDateString()
  const thumbnailId = post.type === 'VLOG' && post.youtubeUrl ? extractYoutubeId(post.youtubeUrl) : null

  return (
    <Card className="overflow-hidden">
      {thumbnailId && (
        <img
          src={`https://img.youtube.com/vi/${thumbnailId}/hqdefault.jpg`}
          alt=""
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="p-4">
        <Badge type={post.type} />
        <div className="mt-2">
          <Link to={`/posts/${post.slug}`} className="font-display text-lg font-black text-ink hover:text-accent">
            {post.title}
          </Link>
        </div>
        <div className="mt-1 text-xs text-ink-muted">
          <span>{post.authorName}</span><span> · </span><span>{date}</span>
        </div>
        {post.type === 'VLOG' && post.youtubeUrl && (
          <div className="mt-2">
            <a
              href={post.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent hover:text-accent-hi"
            >
              Watch on YouTube
            </a>
          </div>
        )}
        {post.type !== 'VLOG' && post.body && (
          <p className="mt-2 text-sm text-ink-muted">
            {post.body.slice(0, 160)}{post.body.length > 160 ? '…' : ''}
          </p>
        )}
      </div>
    </Card>
  )
}
