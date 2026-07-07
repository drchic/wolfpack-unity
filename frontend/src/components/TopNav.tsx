import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const linkStyle = { color: '#1a1a1a', textDecoration: 'none', padding: '0 12px' }

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px', borderBottom: '1px solid #ddd', backgroundColor: '#fff'
    }}>
      <div>
        <Link to="/" style={{ ...linkStyle, fontWeight: 700, fontSize: '1.1rem' }}>Wolfpack Unity</Link>
        <Link to="/news" style={linkStyle}>News</Link>
        <Link to="/blog" style={linkStyle}>Blog</Link>
        <Link to="/vlog" style={linkStyle}>Vlog</Link>
      </div>
      <div>
        {user ? (
          <>
            <Link to="/book" style={linkStyle}>Book a slot</Link>
            <Link to="/my-reservations" style={linkStyle}>My Reservations</Link>
            <button onClick={handleLogout} style={{ marginLeft: '12px', padding: '6px 14px', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{ ...linkStyle, padding: '6px 14px', border: '1px solid #ccc', borderRadius: '4px' }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
