import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UsersTable } from './UsersTable'
import { ReservationsTable } from './ReservationsTable'
import { StatsView } from './StatsView'

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState('users')

  const tabStyle = (tab: string) => ({
    padding: '10px 20px',
    backgroundColor: activeTab === tab ? '#007bff' : '#e9ecef',
    color: activeTab === tab ? 'white' : 'black',
    border: 'none',
    borderRadius: activeTab === tab ? '4px 4px 0 0' : '0',
    cursor: 'pointer',
    marginRight: '5px'
  })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admin Panel</h1>
        <Link to="/" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Back to App
        </Link>
      </div>

      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button onClick={() => setActiveTab('users')} style={tabStyle('users')}>
          Users
        </button>
        <button onClick={() => setActiveTab('reservations')} style={tabStyle('reservations')}>
          Reservations
        </button>
        <button onClick={() => setActiveTab('stats')} style={tabStyle('stats')}>
          Stats
        </button>
      </div>

      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '0 4px 4px 4px' }}>
        {activeTab === 'users' && <UsersTable />}
        {activeTab === 'reservations' && <ReservationsTable />}
        {activeTab === 'stats' && <StatsView />}
      </div>
    </div>
  )
}
