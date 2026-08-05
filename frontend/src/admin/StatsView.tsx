import { useState, useEffect } from 'react'
import { getStats, type StatsView as StatsViewType } from '../api/admin'
import { Card, Spinner, ErrorMessage } from '../components/ui'

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

  if (loading) return <Spinner />

  return (
    <div>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

      {stats && (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 font-display text-sm font-black uppercase tracking-wide text-ink">Daily Occupancy (Last 30 days)</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Spots Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.dailyOccupancy.slice(0, 10).map((item) => (
                    <tr key={item.date} className="border-b border-edge last:border-0">
                      <td className="px-3 py-2 text-ink">{item.date}</td>
                      <td className="px-3 py-2 text-ink">{item.bookedSpots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-display text-sm font-black uppercase tracking-wide text-ink">Busiest Hours (Top 10)</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2">Hour</th>
                    <th className="px-3 py-2">Spots Booked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.busiestHours.map((item) => (
                    <tr key={item.hour} className="border-b border-edge last:border-0">
                      <td className="px-3 py-2 text-ink">{String(item.hour).padStart(2, '0')}:00</td>
                      <td className="px-3 py-2 text-ink">{item.bookedSpots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <Card className="mt-6 p-4">
            <h3 className="mb-3 font-display text-sm font-black uppercase tracking-wide text-ink">Top Users</h3>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Total Bookings</th>
                </tr>
              </thead>
              <tbody>
                {stats.topUsers.map((user) => (
                  <tr key={user.email} className="border-b border-edge last:border-0">
                    <td className="px-3 py-2 text-ink">{user.name}</td>
                    <td className="px-3 py-2 text-ink">{user.email}</td>
                    <td className="px-3 py-2 text-ink">{user.totalBookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}
