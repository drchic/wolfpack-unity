import { client } from './client'
import type { ReservationView } from './slots'

export interface UserRecord {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export interface StatsView {
  dailyOccupancy: DailyOccupancy[]
  busiestHours: HourlyOccupancy[]
  topUsers: TopUser[]
}

export interface DailyOccupancy {
  date: string
  bookedSpots: number
}

export interface HourlyOccupancy {
  hour: number
  bookedSpots: number
}

export interface TopUser {
  name: string
  email: string
  totalBookings: number
}

export async function getReservations(date?: string, userId?: string): Promise<ReservationView[]> {
  const params: Record<string, string> = {}
  if (date) params.date = date
  if (userId) params.userId = userId
  const res = await client.get<ReservationView[]>('/admin/reservations', { params })
  return res.data
}

export async function cancelAdminReservation(id: string): Promise<void> {
  await client.delete(`/admin/reservations/${id}`)
}

export async function getUsers(): Promise<UserRecord[]> {
  const res = await client.get<UserRecord[]>('/admin/users')
  return res.data
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  await client.patch(`/admin/users/${userId}/role`, { role })
}

export async function deleteUser(userId: string): Promise<void> {
  await client.delete(`/admin/users/${userId}`)
}

export async function getStats(): Promise<StatsView> {
  const res = await client.get<StatsView>('/admin/stats')
  return res.data
}
