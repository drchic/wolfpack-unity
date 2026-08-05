import { useState, useEffect } from 'react'
import { getPosts, createPost, updatePost, deletePost, type PostView } from '../api/posts'
import { PostForm } from './PostForm'
import { Button, Badge, Spinner, ErrorMessage } from '../components/ui'

export function PostsTable() {
  const [posts, setPosts] = useState<PostView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<PostView | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadPosts() }, [])

  const loadPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPosts({ size: 100 })
      setPosts(data.content)
    } catch {
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (req: Parameters<typeof createPost>[0]) => {
    try {
      const created = await createPost(req)
      setPosts(prev => [created, ...prev])
      setCreating(false)
    } catch {
      setError('Failed to create post')
    }
  }

  const handleUpdate = async (req: Parameters<typeof updatePost>[1]) => {
    if (!editing) return
    try {
      const updated = await updatePost(editing.id, req)
      setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditing(null)
    } catch {
      setError('Failed to update post')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(id)
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch {
      setError('Failed to delete post')
    }
  }

  if (creating) return <PostForm onSave={handleCreate} onCancel={() => setCreating(false)} />
  if (editing) return <PostForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />

  return (
    <div>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      <Button onClick={() => setCreating(true)} className="mb-4">New Post</Button>
      {loading && <Spinner />}
      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} className="border-b border-edge last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 text-ink">{post.title}</td>
                <td className="px-4 py-3"><Badge type={post.type} /></td>
                <td className="px-4 py-3 text-ink">{new Date(post.publishedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setEditing(post)} className="px-3 py-1.5 text-xs">Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(post.id)} className="px-3 py-1.5 text-xs">Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && posts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-muted">No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
