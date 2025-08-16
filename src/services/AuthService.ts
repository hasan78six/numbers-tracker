import type {
    SignInCredential,
    ForgotPassword,
    ResetPassword,
    SignInResponse,
    User,
    UpdateProfile,
} from '@/@types/auth'
import supabaseClient from '@/configs/supabase.config'

// Test function to verify Supabase connection
export async function testSupabaseConnection() {
    try {
        console.log('Testing Supabase connection...')
        console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set')
        console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
        
        const { error } = await supabaseClient
            .from('profiles')
            .select('count', { count: 'exact', head: true })
            .limit(1)
        
        if (error) {
            console.error('Supabase connection test failed:', error)
            return { success: false, error: error.message }
        }
        
        console.log('Supabase connection test successful')
        return { success: true }
    } catch (error) {
        console.error('Supabase connection test error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

export async function apiSignIn(
    data: SignInCredential,
): Promise<SignInResponse> {
    const { email, password } = data

<<<<<<< HEAD
    try {
        // Test Supabase connection first
        const connectionTest = await testSupabaseConnection()
        if (!connectionTest.success) {
            throw new Error(`Supabase connection failed: ${connectionTest.error}`)
        }

        const { data: response, error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password,
            })
=======
    const { data: response, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })
>>>>>>> parent of 53f2f73 (fix login)

    if (error) throw error

    const profile = await fetchUserProfile(response.user.id)

<<<<<<< HEAD
        if (!response.session?.access_token) {
            throw new Error('No access token returned from authentication')
        }

        console.log('User authenticated successfully, fetching profile...')
        
        // Ensure the session is set in the client before making profile queries
        const { error: sessionError } = await supabaseClient.auth.setSession(response.session)
        if (sessionError) {
            console.error('Error setting session:', sessionError)
            throw new Error(`Failed to set session: ${sessionError.message}`)
        }

        const profile = await fetchUserProfile(response.user.id)
        console.log('Profile fetched successfully:', profile)

        return {
            token: response.session.access_token,
            user: { ...profile, email },
        }
    } catch (error) {
        console.error('Error in apiSignIn:', error)
        throw error
=======
    return {
        token: response.session.access_token,
        user: { ...profile, email },
>>>>>>> parent of 53f2f73 (fix login)
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
<<<<<<< HEAD
    try {
        // Check if we have a valid session
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
        if (sessionError) {
            console.error('Error getting session:', sessionError)
            throw new Error(`Session error: ${sessionError.message}`)
        }

        if (!session) {
            console.error('No active session found')
            throw new Error('No active session. Please log in again.')
        }

        console.log('Session found, user ID:', session.user.id)
        console.log('Session expires at:', session.expires_at)

        // First check if profile exists
        const { count, error: countError } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        if (countError) {
            console.error('Error checking profile existence:', countError)
            if (countError.code === '406') {
                throw new Error('Authentication error: Please try logging in again')
            }
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
=======
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
>>>>>>> parent of 53f2f73 (fix login)

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
            if (error.code === '406') {
                throw new Error('Authentication error: Please try logging in again')
            }
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
    } catch (error) {
        console.error('Error in fetchUserProfile:', error)
        throw error
    }
}
