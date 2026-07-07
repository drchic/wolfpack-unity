import { useState } from 'react'
import type { PostRequest, PostView } from '../api/posts'

interface Props {
  initial?: PostView
  onSave: (req: PostRequest) => void
  onCancel: () => void
}

export function PostForm({ initial, onSave, onCancel }: Props) {
  const [type, setType] = useState<'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'>(initial?.type ?? 'NEWS')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ type, title, slug: slug || undefined, body: body || undefined, youtubeUrl: youtubeUrl || undefined })
  }

  const fieldStyle = { width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'block', marginBottom: '12px' }

  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle}>
        Type
        <select aria-label="Type" value={type} onChange={e => setType(e.target.value as 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT')} style={fieldStyle}>
          <option value="NEWS">NEWS</option>
          <option value="BLOG">BLOG</option>
          <option value="VLOG">VLOG</option>
          <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
        </select>
      </label>
      <label style={labelStyle}>
        Title
        <input aria-label="Title" value={title} onChange={e => setTitle(e.target.value)} required style={fieldStyle} />
      </label>
      <label style={labelStyle}>
        Slug (leave blank to auto-generate)
        <input aria-label="Slug" value={slug} onChange={e => setSlug(e.target.value)} style={fieldStyle} />
      </label>
      <label style={labelStyle}>
        Body
        <textarea aria-label="Body" value={body} onChange={e => setBody(e.target.value)} rows={6} style={fieldStyle} />
      </label>
      {type === 'VLOG' && (
        <label style={labelStyle}>
          YouTube URL
          <input aria-label="YouTube URL" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} style={fieldStyle} />
        </label>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Save
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '8px 20px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}
