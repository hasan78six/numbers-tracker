export type Status = 'Active' | 'Blocked'

export type USER_TYPES = 'Administrator' | 'Company' | 'Company User'

export interface AddUserPayload {
    username: string
    email: string
    status: Status
    user_type_id: string
    company_id: string
    password: string
}
