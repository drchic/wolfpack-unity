import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { LoginPage } from './auth/LoginPage'
import { RegisterPage } from './auth/RegisterPage'
import { OAuth2Callback } from './auth/OAuth2Callback'
import { SlotGridPage } from './slots/SlotGridPage'
import { MyReservationsPage } from './slots/MyReservationsPage'
import { AdminLayout } from './admin/AdminLayout'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<SlotGridPage />} />
            <Route path="/my-reservations" element={<MyReservationsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
