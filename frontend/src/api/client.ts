import axios from 'axios'

export const client = axios.create({ baseURL: '/api' })

export function setToken(token: string | null) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete client.defaults.headers.common['Authorization']
  }
}
