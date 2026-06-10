import { useState, useEffect } from 'react'
import { getReservations, cancelAdminReservation } from '../api/admin'
import type { ReservationView } from '../api/slots'

export function ReservationsTable() {
  const [reservations, setReservations] = useState<ReservationView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    loadReservations()
  }, [filterDate])

  const loadReservations = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getReservations(filterDate || undefined)
      setReservations(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try {
      await cancelAdminReservation(id)
      setReservations(reservations.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setCancelling(null)
    }
  }

  const timeStr = (hour: number) => String(hour).padStart(2, '0') + ':00'

  if (loading) return <div>Loading reservations...</div>

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label>Filter by Date: </label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ padding: '8px' }}
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} style={{ marginLeft: '10px', padding: '8px' }}>
            Clear
          </button>
        )}
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Time</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Spot</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((res) => (
            <tr key={res.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{res.date}</td>
              <td style={{ padding: '10px' }}>{timeStr(res.hour)}</td>
              <td style={{ padding: '10px' }}>#{res.spotNumber}</td>
              <td style={{ padding: '10px' }}>{res.status}</td>
              <td style={{ padding: '10px' }}>
                <button
                  onClick={() => handleCancel(res.id)}
                  disabled={cancelling === res.id}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: cancelling === res.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {cancelling === res.id ? 'Cancelling...' : 'Cancel'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
