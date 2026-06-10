import { createContext, useContext, useState, type ReactNode } from 'react'
import { setToken } from '../api/client'

interface AuthUser { userId: string; email: string; role: string }
interface AuthCtx {
  user: AuthUser | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>(null!)

function parseJwt(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split('.')[1]))
  return { userId: payload.sub, email: payload.email, role: payload.role }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  function login(token: string) {
    setToken(token)
    setUser(parseJwt(token))
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
