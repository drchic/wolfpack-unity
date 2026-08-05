import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSlots, type SlotView } from '../api/slots'
import { SlotRow } from './SlotRow'
import { BookingModal } from './BookingModal'
import { TopNav } from '../components/TopNav'
import { PageHeader, Input, Button, Spinner, ErrorMessage, EmptyState } from '../components/ui'

export function SlotGridPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState<SlotView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<{ hour: number; spotNumber: number } | null>(null)

  useEffect(() => {
    loadSlots()
  }, [date])

  const loadSlots = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSlots(date)
      setSlots(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load slots')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSpot = (hour: number, spotNumber: number) => {
    setSelectedSlot({ hour, spotNumber })
  }

  return (
    <>
      <TopNav />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <PageHeader title="Book a Spot" />
          <Link to="/my-reservations">
            <Button variant="ghost">My Reservations</Button>
          </Link>
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-ink-muted" htmlFor="slot-date">Select Date</label>
          <Input id="slot-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {loading ? (
          <Spinner />
        ) : slots.length === 0 ? (
          <EmptyState message="No slots available" />
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <SlotRow key={slot.hour} slot={slot} onSelectSpot={handleSelectSpot} />
            ))}
          </div>
        )}

        {selectedSlot && (
          <BookingModal
            date={date}
            hour={selectedSlot.hour}
            spotNumber={selectedSlot.spotNumber}
            onClose={() => setSelectedSlot(null)}
            onSuccess={loadSlots}
          />
        )}
      </div>
    </>
  )
}
