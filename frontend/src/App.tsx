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
import { HomePage } from './content/HomePage'
import { NewsPage } from './content/NewsPage'
import { BlogPage } from './content/BlogPage'
import { VlogPage } from './content/VlogPage'
import { PostPage } from './content/PostPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/vlog" element={<VlogPage />} />
          <Route path="/posts/:slug" element={<PostPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/book" element={<SlotGridPage />} />
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
