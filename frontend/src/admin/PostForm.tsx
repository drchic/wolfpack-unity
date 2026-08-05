import { useState, useEffect } from 'react'
import type { PostRequest, PostView } from '../api/posts'
import { Button, Input, Label, Select, Textarea } from '../components/ui'

interface Props {
  initial?: PostView
  onSave: (req: PostRequest) => void
  onCancel: () => void
}

export function PostForm({ initial, onSave, onCancel }: Props) {
  const [type, setType] = useState<'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'>(initial?.type ?? 'NEWS')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [body, setBody] = useState(initial?.body ?? '')
  const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '')

  const deriveSlug = (titleText: string): string => {
    return titleText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  useEffect(() => {
    setSlugManuallyEdited(false)
  }, [initial])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ type, title, slug: slug || undefined, body: body || undefined, youtubeUrl: youtubeUrl || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <Label htmlFor="post-type">Type</Label>
        <Select
          id="post-type"
          aria-label="Type"
          value={type}
          onChange={e => {
            const newType = e.target.value as 'NEWS' | 'BLOG' | 'VLOG' | 'ANNOUNCEMENT'
            setType(newType)
            if (newType !== 'VLOG') {
              setYoutubeUrl('')
            }
          }}
        >
          <option value="NEWS">NEWS</option>
          <option value="BLOG">BLOG</option>
          <option value="VLOG">VLOG</option>
          <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="post-title">Title</Label>
        <Input
          id="post-title"
          aria-label="Title"
          value={title}
          onChange={e => {
            const newTitle = e.target.value
            setTitle(newTitle)
            if (!slugManuallyEdited) {
              setSlug(deriveSlug(newTitle))
            }
          }}
          required
        />
      </div>
      <div>
        <Label htmlFor="post-slug">Slug (auto-filled from title, editable)</Label>
        <Input
          id="post-slug"
          aria-label="Slug"
          value={slug}
          onChange={e => {
            setSlugManuallyEdited(true)
            setSlug(e.target.value)
          }}
        />
      </div>
      <div>
        <Label htmlFor="post-body">Body</Label>
        <Textarea id="post-body" aria-label="Body" value={body} onChange={e => setBody(e.target.value)} rows={6} />
      </div>
      {type === 'VLOG' && (
        <div>
          <Label htmlFor="post-youtube">YouTube URL</Label>
          <Input id="post-youtube" aria-label="YouTube URL" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
