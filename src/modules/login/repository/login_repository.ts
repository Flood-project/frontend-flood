import { instance } from "../../../services/axios";
import { removeAccessTokens, setAccessToken, setRefreshToken } from "../../../services/token";
import type { Login } from "../domain/login";
import type { LoginResponse } from "../domain/login_response";

export const LoginMethod = async (payload: Login): Promise<LoginResponse> => {
    try{
        const response = await instance.post<LoginResponse>('/login', payload);
        
        if (typeof response.data === 'object') {
            if (response.data.token && response.data.refresh_token) {
                setAccessToken(response.data.token);
                setRefreshToken(response.data.refresh_token)
            }
        }
    
        return response.data;
    } catch (error: any) {
        removeAccessTokens();
        throw new Error(error.response?.data?.message || 'Erro ao fazer login')
    }
}

export const RefreshMethod = async (refreshToken: string): Promise<string> => {
    try {  
        if (!refreshToken) {
            throw new Error("Refresh token não existe.")
        }
        
        const response = await instance.post<LoginResponse>('/login/refresh', {
            refresh_token: refreshToken
        });

        if (response.data.token && response.data.refresh_token) {
            setAccessToken(response.data.token);
            setRefreshToken(response.data.refresh_token)

            return response.data.token
        }

        throw new Error("Token não recebido no refresh")
    } catch (error: any) {
        removeAccessTokens();
        throw new Error(error.response?.data?.message || "Erro ao realizar refresh token");
    }
}
