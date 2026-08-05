import { useState } from 'react'
import { book } from '../api/slots'
import { Button, Card, ErrorMessage } from '../components/ui'

interface BookingModalProps {
  date: string
  hour: number
  spotNumber: number
  onClose: () => void
  onSuccess: () => void
}

export function BookingModal({ date, hour, spotNumber, onClose, onSuccess }: BookingModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      await book({ date, hour, spotNumber })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const timeStr = String(hour).padStart(2, '0') + ':00'

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-sm p-6">
        <h2 className="font-display text-xl font-black uppercase tracking-tight text-ink">Confirm Booking</h2>
        <p className="mt-3 text-sm text-ink-muted">Date: {date}</p>
        <p className="text-sm text-ink-muted">Time: {timeStr}</p>
        <p className="text-sm text-ink-muted">Spot: #{spotNumber}</p>

        {error && <div className="mt-3"><ErrorMessage message={error} /></div>}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading} className="flex-1">
            {loading ? 'Booking...' : 'Confirm'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
