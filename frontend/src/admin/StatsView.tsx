import { useState, useEffect } from 'react'
import { getStats, type StatsView as StatsViewType } from '../api/admin'

export function StatsView() {
  const [stats, setStats] = useState<StatsViewType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStats()
      setStats(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading stats...</div>

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <h3>Daily Occupancy (Last 30 days)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Spots Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.dailyOccupancy.slice(0, 10).map((item) => (
                    <tr key={item.date} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{item.date}</td>
                      <td style={{ padding: '10px' }}>{item.bookedSpots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3>Busiest Hours (Top 10)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Hour</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Spots Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.busiestHours.map((item) => (
                    <tr key={item.hour} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{String(item.hour).padStart(2, '0')}:00</td>
                      <td style={{ padding: '10px' }}>{item.bookedSpots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3>Top Users</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Total Bookings</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((user) => (
                  <tr key={user.email} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{user.name}</td>
                    <td style={{ padding: '10px' }}>{user.email}</td>
                    <td style={{ padding: '10px' }}>{user.totalBookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
