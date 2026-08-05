import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button, buttonClasses } from './ui'

const navLinkClass = (active: boolean) =>
  `text-sm font-medium transition-colors ${active ? 'text-accent' : 'text-ink-muted hover:text-ink'}`

export function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-edge bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-sm font-black uppercase tracking-wide text-ink">
            🐺 Wolfpack
          </Link>
          <Link to="/news" className={navLinkClass(location.pathname === '/news')}>News</Link>
          <Link to="/blog" className={navLinkClass(location.pathname === '/blog')}>Blog</Link>
          <Link to="/vlog" className={navLinkClass(location.pathname === '/vlog')}>Vlog</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/book" className={buttonClasses('primary', 'px-4 py-2')}>
                Book a slot
              </Link>
              <Link to="/my-reservations" className={navLinkClass(location.pathname === '/my-reservations')}>
                My Reservations
              </Link>
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Link to="/login" className={buttonClasses('primary', 'px-4 py-2')}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
