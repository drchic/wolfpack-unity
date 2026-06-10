import type { SlotView } from '../api/slots'

interface SlotRowProps {
  slot: SlotView
  onSelectSpot: (hour: number, spotNumber: number) => void
}

export function SlotRow({ slot, onSelectSpot }: SlotRowProps) {
  const timeStr = String(slot.hour).padStart(2, '0') + ':00'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
      <div style={{ minWidth: '50px', fontWeight: 'bold' }}>{timeStr}</div>
      <div style={{ display: 'flex', gap: '5px' }}>
        {slot.spots.map((spot) => (
          <button
            key={spot.number}
            onClick={() => onSelectSpot(slot.hour, spot.number)}
            disabled={!spot.available}
            style={{
              width: '40px',
              height: '40px',
              padding: '0',
              backgroundColor: spot.available ? '#007bff' : (spot.mine ? '#28a745' : '#ccc'),
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: spot.available ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
            title={spot.mine ? 'Your reservation' : (spot.available ? 'Available' : 'Taken')}
          >
            {spot.number}
          </button>
        ))}
      </div>
    </div>
  )
}
