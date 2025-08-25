import { instance } from "../../../services/axios";
import { type AccountUser } from "../domain/user";

export const getUsers = async (): Promise<AccountUser[]> => {
    const response = await instance.get<AccountUser[]>('/accounts');
    return response.data
}