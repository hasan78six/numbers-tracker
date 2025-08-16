import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type UserType = { id: string; type: string }

export type UserTypeSetPayload = {
    allTypes: UserType[]
    companyTypeId: string
    companyUserTypeId: string
    administratorTypeId: string
}

type UserTypesState = {
    companyTypeId: string
    companyUserTypeId: string
    administratorTypeId: string
    userTypes: UserType[]
    setUserTypes: (payload: UserTypeSetPayload) => void
}

export const useUserTypesStore = create<UserTypesState>()(
    devtools(
        persist(
            (set) => ({
                userTypes: [],
                companyTypeId: '',
                companyUserTypeId: '',
                administratorTypeId: '',
                setUserTypes: (payload: UserTypeSetPayload) => {
                    return set({
                        userTypes: payload.allTypes,
                        companyTypeId: payload.companyTypeId,
                        companyUserTypeId: payload.companyUserTypeId,
                        administratorTypeId: payload.administratorTypeId,
                    })
                },
            }),
            { name: 'userTypes' },
        ),
    ),
)
