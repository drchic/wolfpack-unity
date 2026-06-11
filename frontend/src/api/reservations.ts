import { client } from './client'

export interface ReservationView {
  id: string
  date: string
  hour: number
  spotNumber: number
  status: string
}

export async function book(date: string, hour: number, spotNumber: number) {
  const res = await client.post<ReservationView>('/reservations', { date, hour, spotNumber })
  return res.data
}

export async function cancelReservation(id: string) {
  await client.delete(`/reservations/${id}`)
}

export async function getMyReservations(): Promise<ReservationView[]> {
  const res = await client.get<ReservationView[]>('/reservations/me')
  return res.data
}
