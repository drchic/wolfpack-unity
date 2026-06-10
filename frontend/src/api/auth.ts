import { client } from './client'

export interface AuthResponse {
  token: string
}

export async function register(name: string, email: string, password: string): Promise<string> {
  const res = await client.post<AuthResponse>('/auth/register', { name, email, password })
  return res.data.token
}

export async function login(email: string, password: string): Promise<string> {
  const res = await client.post<AuthResponse>('/auth/login', { email, password })
  return res.data.token
}

export function googleLoginUrl(): string {
  return '/login/oauth2/authorization/google'
}
