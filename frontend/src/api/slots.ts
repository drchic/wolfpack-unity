import { client } from './client'

export interface SlotView {
  hour: number
  spots: SpotView[]
}

export interface SpotView {
  number: number
  available: boolean
  reservationId: string | null
  mine: boolean
}

export interface BookingRequest {
  date: string
  hour: number
  spotNumber: number
}

export interface ReservationView {
  id: string
  date: string
  hour: number
  spotNumber: number
  status: string
}

export async function getSlots(date: string): Promise<SlotView[]> {
  const res = await client.get<SlotView[]>('/slots', { params: { date } })
  return res.data
}

export async function book(req: BookingRequest): Promise<ReservationView> {
  const res = await client.post<ReservationView>('/reservations', req)
  return res.data
}

export async function getMyReservations(): Promise<ReservationView[]> {
  const res = await client.get<ReservationView[]>('/reservations/me')
  return res.data
}

export async function cancelReservation(id: string): Promise<void> {
  await client.delete(`/reservations/${id}`)
}
