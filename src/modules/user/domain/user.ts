export interface AccountUser{
    id: number
    name: string
    email: string
    passwordHash: string
    id_user_group: number
    group_name: string
    active: boolean
}


export interface EditingUser {
    id: number
    name: string
    email: string
    id_user_group: number
    active: boolean
}

export interface CreatedUser {
    id: number
    name: string
    email: string
    id_user_group: number
    active: boolean
}