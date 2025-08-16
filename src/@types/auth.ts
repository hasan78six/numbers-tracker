import { USER_TYPES } from './users'

export type SignInCredential = {
    email: string
    password: string
}

export type SignInResponse = {
    token: string
    user: User
}

export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    password: string
}

export type UpdateProfile = {
    first_name: string
    last_name: string
}

export type User = {
    id: string
    user_id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    user_type_id: {
        id: string
        type: USER_TYPES
    }
    company_id: {
        id: string
        name: string
        contact: string
        address: string
    } | null
    authority: USER_TYPES[]
    type: USER_TYPES
    email: string
    is_active: boolean
    timezone?: string
}

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = Promise<{
    status: AuthRequestStatus
    message: string
}>

export type Token = {
    accessToken: string
    refereshToken?: string
}
