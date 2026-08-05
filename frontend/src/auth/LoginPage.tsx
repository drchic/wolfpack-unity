import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { login, googleLoginUrl } from '../api/auth'
import { Button, Card, Input, Label, ErrorMessage } from '../components/ui'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await login(email, password)
      authLogin(token)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
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
        <h1 className="mb-4 font-display text-2xl font-black uppercase tracking-tight text-ink">Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="login-email">Email:</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="login-password">Password:</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 border-t border-edge pt-6">
          <a
            href={googleLoginUrl()}
            className="block rounded-full border border-edge px-5 py-2.5 text-center text-sm font-semibold text-ink hover:border-accent hover:text-accent"
          >
            Login with Google
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Don't have an account? <Link to="/register" className="text-accent hover:text-accent-hi">Register here</Link>
        </p>
      </Card>
    </div>
  )
}
