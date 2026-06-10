import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSlots, type SlotView } from '../api/slots'
import { SlotRow } from './SlotRow'
import { BookingModal } from './BookingModal'

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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Book a Spot</h1>
        <Link to="/my-reservations" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          My Reservations
        </Link>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Select Date: </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: '8px' }}
        />
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

      {loading ? (
        <div>Loading slots...</div>
      ) : (
        <div>
          {slots.length === 0 ? (
            <div>No slots available</div>
          ) : (
            slots.map((slot) => (
              <SlotRow key={slot.hour} slot={slot} onSelectSpot={handleSelectSpot} />
            ))
          )}
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
  )
}
