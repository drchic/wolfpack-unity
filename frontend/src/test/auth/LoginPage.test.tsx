import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../../auth/LoginPage'
import { AuthProvider } from '../../auth/AuthContext'
import { vi } from 'vitest'
import * as authApi from '../../api/auth'

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthProvider>
  )
}

test('shows error when login fails', async () => {
  vi.spyOn(authApi, 'login').mockRejectedValue({
    response: { data: { message: 'Invalid credentials' } }
  })
  renderLogin()
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
  await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
})
