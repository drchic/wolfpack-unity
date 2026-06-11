import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { MyReservationsPage } from '../../slots/MyReservationsPage'
import { vi } from 'vitest'
import * as api from '../../api/reservations'

const sample = { id: 'abc', date: '2026-06-10', hour: 9, spotNumber: 3, status: 'ACTIVE' }

test('shows reservations', async () => {
  vi.spyOn(api, 'getMyReservations').mockResolvedValue([sample])
  render(<MemoryRouter><MyReservationsPage /></MemoryRouter>)
  await waitFor(() => expect(screen.getByText(/Spot #3/)).toBeInTheDocument())
})

test('shows error when cancel fails', async () => {
  vi.spyOn(api, 'getMyReservations').mockResolvedValue([sample])
  vi.spyOn(api, 'cancelReservation').mockRejectedValue({
    response: { data: { message: 'Cancellation deadline has passed.' } }
  })
  render(<MemoryRouter><MyReservationsPage /></MemoryRouter>)
  await waitFor(() => screen.getByText(/Spot #3/))
  await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
  await waitFor(() => expect(screen.getByText('Cancellation deadline has passed.')).toBeInTheDocument())
})
