import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useAuth from '../auth/useAuth'
import AuthContext from '../auth/AuthContext'
import { ReactNode } from 'react'
import { AuthRequestStatus } from '@/@types/auth'

const mockAuthValue = {
    authenticated: true,
    user: { id: '1', name: 'Test User' }, // id as string
    signIn: async () => ({
        status: 'success' as AuthRequestStatus,
        message: 'Signed in',
    }),
    signOut: () => {},
}

function Wrapper({ children }: { children: ReactNode }) {
    return (
        <AuthContext.Provider value={mockAuthValue}>
            {children}
        </AuthContext.Provider>
    )
}

describe('useAuth', () => {
    it('returns context value when used under AuthProvider', () => {
        const { result } = renderHook(() => useAuth(), { wrapper: Wrapper })
        expect(result.current.authenticated).toBe(true)
        expect(result.current.user).toEqual({ id: '1', name: 'Test User' })
    })

    it('throws error when used outside AuthProvider', () => {
        // Suppress error output for this test
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => renderHook(() => useAuth())).toThrow(
            'useAuth must be used under a AuthProvider',
        )
        spy.mockRestore()
    })
}) 