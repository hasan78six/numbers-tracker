export function parseSupabaseError(errorMessage: string): string {
    const message = errorMessage || 'Unknown error'

    // Unique constraint errors
    if (message.includes(`duplicate key value violates unique constraint`)) {
        if (message.includes(`companies_name_key`)) {
            return 'A company with this name already exists.'
        }
        if (message.includes(`companies_contact_key`)) {
            return 'A company with this contact already exists.'
        }
    }

    // Other errors

    if(message === "User already registered"){
        return 'The email address already exists.'
    }

    // Fallback
    return message
}
