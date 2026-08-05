import { useState, useEffect } from 'react'
import { getUsers, updateUserRole, deleteUser, type UserRecord } from '../api/admin'
import { Button, Select, Spinner, ErrorMessage } from '../components/ui'

export function UsersTable() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [action, setAction] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setAction(userId)
    try {
      await updateUserRole(userId, newRole)
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role')
    } finally {
      setAction(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user?')) return
    setAction(userId)
    try {
      await deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setAction(null)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      <div className="overflow-x-auto rounded-xl border border-edge">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-edge last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3 text-ink">{user.name}</td>
                <td className="px-4 py-3 text-ink">{user.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={action === user.id}
                    className="w-auto"
                  >
                    <option>USER</option>
                    <option>ADMIN</option>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(user.id)}
                    disabled={action === user.id}
                    className="px-3 py-1.5 text-xs"
                  >
                    {action === user.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
