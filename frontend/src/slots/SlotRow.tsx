import type { SlotView } from '../api/slots'

interface SlotRowProps {
  slot: SlotView
  onSelectSpot: (hour: number, spotNumber: number) => void
}

export function SlotRow({ slot, onSelectSpot }: SlotRowProps) {
  const timeStr = String(slot.hour).padStart(2, '0') + ':00'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface p-3">
      <div className="min-w-[56px] font-display text-sm font-bold text-ink">{timeStr}</div>
      <div className="flex flex-wrap gap-2">
        {slot.spots.map((spot) => (
          <button
            key={spot.number}
            onClick={() => onSelectSpot(slot.hour, spot.number)}
            disabled={!spot.available}
            title={spot.mine ? 'Your reservation' : (spot.available ? 'Available' : 'Taken')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
              spot.mine
                ? 'border border-accent bg-accent/20 text-accent'
                : spot.available
                ? 'border border-edge bg-surface-2 text-ink hover:border-accent hover:text-accent'
                : 'cursor-not-allowed border border-edge bg-surface text-ink-muted/50'
            }`}
          >
            {spot.number}
          </button>
        ))}
      </div>
    </div>
  )
}
