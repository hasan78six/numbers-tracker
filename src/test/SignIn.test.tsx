import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SignIn from '../views/auth/SignIn/SignIn'
import AuthContext from '../auth/AuthContext'
import { MemoryRouter } from 'react-router-dom'
import type { AuthRequestStatus } from '@/@types/auth'

const mockSignIn = vi.fn(async ({ email, password }) => {
  if (email === 'fail@example.com') {
    return { status: 'failed' as AuthRequestStatus, message: 'Login failed' }
  }
  return { status: 'success' as AuthRequestStatus, message: 'Login success' }
})

const mockAuthValue = {
  authenticated: false,
  user: {},
  signIn: mockSignIn,
  signOut: vi.fn(),
}

describe('SignIn Page', () => {
  beforeEach(() => {
    mockSignIn.mockClear()
    cleanup()
  })

  function renderWithProvider() {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthValue as any}>
          <SignIn />
        </AuthContext.Provider>
      </MemoryRouter>
    )
  }

  it('renders login form', () => {
    renderWithProvider()
    expect(screen.getByText(/Welcome back!/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('shows validation errors if fields are empty', async () => {
    renderWithProvider()
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))
    await waitFor(() => {
      expect(screen.getByText(/Please enter your email/i)).toBeInTheDocument()
      expect(screen.getByText(/Please enter your password/i)).toBeInTheDocument()
    })
  })

  it('calls signIn and shows error on failed login', async () => {
    renderWithProvider()
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'fail@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: 'fail@example.com', password: 'wrongpass' })
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument()
    })
  })

  it('calls signIn and does not show error on success', async () => {
    renderWithProvider()
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'success@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'rightpass' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: 'success@example.com', password: 'rightpass' })
      expect(screen.queryByText(/Login failed/i)).not.toBeInTheDocument()
    })
  })
}) 