import { useState, useEffect } from 'react'
import { getPosts, createPost, updatePost, deletePost, type PostView } from '../api/posts'
import { PostForm } from './PostForm'

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
      {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}
      <button onClick={() => setCreating(true)} style={{ marginBottom: '16px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        New Post
      </button>
      {loading && <p>Loading...</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Published</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{post.title}</td>
              <td style={{ padding: '10px' }}>{post.type}</td>
              <td style={{ padding: '10px' }}>{new Date(post.publishedAt).toLocaleDateString()}</td>
              <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditing(post)} style={{ padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(post.id)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
          {!loading && posts.length === 0 && (
            <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No posts yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
