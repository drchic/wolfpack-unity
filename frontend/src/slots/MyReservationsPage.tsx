import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyReservations, cancelReservation, type ReservationView } from '../api/slots'

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<ReservationView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMyReservations()
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
      await cancelReservation(id)
      setReservations(reservations.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation')
    } finally {
      setCancelling(null)
    }
  }

  const timeStr = (hour: number) => String(hour).padStart(2, '0') + ':00'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Reservations</h1>
        <Link to="/" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Book a Spot
        </Link>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

      {loading ? (
        <div>Loading reservations...</div>
      ) : reservations.length === 0 ? (
        <div>No upcoming reservations</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
      )}
    </div>
  )
}
