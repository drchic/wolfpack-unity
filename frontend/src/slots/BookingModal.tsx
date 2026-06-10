import { useState } from 'react'
import { book } from '../api/slots'

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2>Confirm Booking</h2>
        <p>Date: {date}</p>
        <p>Time: {timeStr}</p>
        <p>Spot: #{spotNumber}</p>

        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px' }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Booking...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
