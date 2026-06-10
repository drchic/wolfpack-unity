import { useState, useEffect } from 'react'
import { getUsers, updateUserRole, deleteUser, type UserRecord } from '../api/admin'

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

  if (loading) return <div>Loading users...</div>

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{user.name}</td>
              <td style={{ padding: '10px' }}>{user.email}</td>
              <td style={{ padding: '10px' }}>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={action === user.id}
                  style={{ padding: '5px' }}
                >
                  <option>USER</option>
                  <option>ADMIN</option>
                </select>
              </td>
              <td style={{ padding: '10px' }}>
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={action === user.id}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: action === user.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {action === user.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
