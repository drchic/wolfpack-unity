import { useState, useEffect } from 'react'
import { getReservations, cancelAdminReservation } from '../api/admin'
import type { ReservationView } from '../api/slots'
import { Button, Input, Spinner, ErrorMessage } from '../components/ui'

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

  if (loading) return <Spinner />

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-ink-muted" htmlFor="reservations-filter-date">Filter by Date</label>
        <Input
          id="reservations-filter-date"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto"
        />
        {filterDate && (
          <Button variant="ghost" onClick={() => setFilterDate('')} className="px-3 py-1.5 text-xs">Clear</Button>
        )}
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

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
    </div>
  )
}
