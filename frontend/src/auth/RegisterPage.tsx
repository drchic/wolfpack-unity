import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { register } from '../api/auth'
import { Button, Card, Input, Label, ErrorMessage } from '../components/ui'

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await register(name, email, password)
      login(token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center font-display text-lg font-black uppercase tracking-wide text-ink">
          🐺 Wolfpack Unity
        </div>
        <h1 className="mb-4 font-display text-2xl font-black uppercase tracking-tight text-ink">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="register-name">Name:</Label>
            <Input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="mb-4">
            <Label htmlFor="register-email">Email:</Label>
            <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-4">
            <Label htmlFor="register-password">Password:</Label>
            <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account? <Link to="/login" className="text-accent hover:text-accent-hi">Login here</Link>
        </p>
      </Card>
    </div>
  )
}
