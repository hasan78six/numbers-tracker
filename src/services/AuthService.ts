import type {
    SignInCredential,
    ForgotPassword,
    ResetPassword,
    SignInResponse,
    User,
    UpdateProfile,
} from '@/@types/auth'
import supabaseClient from '@/configs/supabase.config'

export async function apiSignIn(
    data: SignInCredential,
): Promise<SignInResponse> {
    const { email, password } = data

    const { data: response, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })

    if (error) throw error

    const profile = await fetchUserProfile(response.user.id)

    return {
        token: response.session.access_token,
        user: { ...profile, email },
    }
}

export async function apiSignOut() {
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
}

export async function apiForgotPassword<T>(data: ForgotPassword): Promise<T> {
    const { email } = data
    const baseUrl = import.meta.env.VITE_APP_BASE_URL
    const { data: response, error } =
        await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/reset-password`,
        })
    if (error) throw error
    return response as T
}

export async function apiResetPassword<T>(data: ResetPassword): Promise<T> {
    const { password } = data
    const { data: response, error } = await supabaseClient.auth.updateUser({
        password,
    })

    if (error) throw error
    return response as T
}

export async function apiUpdateUserProfile<T>(
    data: UpdateProfile,
    userId: string,
): Promise<T> {
    const { first_name, last_name } = data
    const { data: response, error } = await supabaseClient
        .from('profiles')
        .update({ first_name, last_name })
        .eq('id', userId)

    if (error) throw error
    return response as T
}

export async function fetchUserProfile(userId: string) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select(
            `id,
            user_id,
            first_name,
            last_name,
            avatar_url,
            is_active,
            user_type_id (
             id,
             type
            ),
            company_id (
             id,
             name,
             address,
             contact
            )`,
        )
        .eq('user_id', userId)
        .single<User>()

    if (error) {
        throw error.message
    }

    return {
        ...data,
        authority: [data.user_type_id.type],
        type: data.user_type_id.type,
    }
}
