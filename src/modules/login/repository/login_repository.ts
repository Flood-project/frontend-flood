import type { Login } from "../domain/login";
import { instance } from "../../../services/axios";

export const LoginMethod = async (payload: Login): Promise<Login> => {
    const response = await instance.post<Login>('/login', payload);
    return response.data
}