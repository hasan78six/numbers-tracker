import { createContext } from 'react'
import type { SignInCredential, AuthResult, User } from '@/@types/auth'

type Auth = {
    authenticated: boolean
    user: Partial<User>
    signIn: (values: SignInCredential) => AuthResult
    signOut: () => void
}

const AuthContext = createContext<Auth | undefined>(undefined)

export default AuthContext
