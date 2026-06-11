import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SlotRow } from '../../slots/SlotRow'
import { vi } from 'vitest'

const makeSpots = (overrides: any[] = []) =>
  Array.from({ length: 10 }, (_, i) => ({
    number: i + 1, available: true, reservationId: null, mine: false,
    ...overrides[i]
  }))

test('renders 10 spot buttons', () => {
  render(<table><tbody><SlotRow hour={9} spots={makeSpots()} onSpotClick={() => {}} /></tbody></table>)
  expect(screen.getAllByRole('button')).toHaveLength(10)
})

test('taken spot button is disabled', () => {
  const spots = makeSpots([{ available: false, mine: false }])
  render(<table><tbody><SlotRow hour={9} spots={spots} onSpotClick={() => {}} /></tbody></table>)
  expect(screen.getByLabelText('Spot 1 taken')).toBeDisabled()
})

test('clicking available spot calls onSpotClick', async () => {
  const handler = vi.fn()
  render(<table><tbody><SlotRow hour={9} spots={makeSpots()} onSpotClick={handler} /></tbody></table>)
  await userEvent.click(screen.getByLabelText('Spot 1 available'))
  expect(handler).toHaveBeenCalledWith(expect.objectContaining({ number: 1 }))
})
