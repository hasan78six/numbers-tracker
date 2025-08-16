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

    try {
        const { data: response, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password,
            })

        if (error) {
            console.error('Supabase auth error:', error)
            throw error
        }

        if (!response.user?.id) {
            throw new Error('No user ID returned from authentication')
        }

        console.log('User authenticated successfully, fetching profile...')
        const profile = await fetchUserProfile(response.user.id)
        console.log('Profile fetched successfully:', profile)

        return {
            token: response.session.access_token,
            user: { ...profile, email },
        }
    } catch (error) {
        console.error('Error in apiSignIn:', error)
        throw error
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
    // First check if profile exists
    const { count, error: countError } = await supabaseClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

    if (countError) {
        console.error('Error checking profile existence:', countError)
        throw new Error(`Failed to check profile existence: ${countError.message}`)
    }

    if (count === null) {
        throw new Error('Unable to determine profile existence. Please try again.')
    }

    if (count === 0) {
        throw new Error('User profile not found. Please contact support to create your profile.')
    }

    if (count > 1) {
        console.warn(`Multiple profiles found for user ${userId}, count: ${count}`)
        // This shouldn't happen due to UNIQUE constraint, but handle it gracefully
    }

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
        .maybeSingle<User>()

    if (error) {
        console.error('Error fetching user profile:', error)
        throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    if (!data) {
        throw new Error('User profile not found. Please contact support.')
    }

    return {
        ...data,
        authority: [data.user_type_id.type],
        type: data.user_type_id.type,
    }
}
