import type { Login } from "../domain/login";
import { instance } from "../../../services/axios";
import { removeAccessToken, setAccessToken } from "../../../services/token";

export const LoginMethod = async (payload: Login): Promise<Login> => {
    try{
        const response = await instance.post<Login>('/login', payload);
        
        if (typeof response.data === 'object') {
            if (response.data.token && response.data.refresh_token) {
                setAccessToken(response.data.token);
            }
        }
        
        return {
            success: true,
            data: {
                token: response.data.token,
                refresh_token: response.data.refresh_token
            }
        }
    } catch (error) {
        removeAccessToken();
        return {
            success: false,
            error: error.response?.data?.message || 'Erro ao fazer login'
        }
    }
}