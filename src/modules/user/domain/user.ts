export interface AccountUser{
    id: number
    name: string
    email: string
    passwordHash: string
    id_user_group: number
    group_name: string;
}


export interface EditingUser {
    id: number
    name: string
    email: string
    id_user_group: number;
}

export interface CreatedUser {
    id: number
    name: string
    email: string
    passwordHash: string
    id_user_group: number
}