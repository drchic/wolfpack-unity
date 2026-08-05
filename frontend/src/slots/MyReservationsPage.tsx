import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyReservations, cancelReservation, type ReservationView } from '../api/slots'
import { TopNav } from '../components/TopNav'
import { PageHeader, Button, buttonClasses, ErrorMessage, EmptyState, Spinner } from '../components/ui'

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
    <>
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <PageHeader title="My Reservations" />
          <Link to="/book" className={buttonClasses('ghost')}>
            Book a Spot
          </Link>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {loading ? (
          <Spinner />
        ) : reservations.length === 0 ? (
          <EmptyState message="No upcoming reservations" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-edge">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Spot</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id} className="border-b border-edge last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3 text-ink">{res.date}</td>
                    <td className="px-4 py-3 text-ink">{timeStr(res.hour)}</td>
                    <td className="px-4 py-3 text-ink">#{res.spotNumber}</td>
                    <td className="px-4 py-3 text-ink">{res.status}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="danger"
                        onClick={() => handleCancel(res.id)}
                        disabled={cancelling === res.id}
                        className="px-3 py-1.5 text-xs"
                      >
                        {cancelling === res.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
