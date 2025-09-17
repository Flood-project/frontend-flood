import type { Login } from "../domain/login";
import { instance } from "../../../services/axios";
import { removeAccessTokens, setAccessToken, setRefreshToken } from "../../../services/token";

export const LoginMethod = async (payload: Login): Promise<Login> => {
    try{
        const response = await instance.post<Login>('/login', payload);  //faz requisição a rota "/login" do backend
        
        if (typeof response.data === 'object') {
            if (response.data.token && response.data.refresh_token) {
                setAccessToken(response.data.token);
                setRefreshToken(response.data.refresh_token)
                console.log("refresh setado: ", response.data.refresh_token);
                
            }
        }
        
        //se o login deu certo, pega o token e o refresh token da resposta e adiciona nas variáveis token e refresh_token
        return {
            success: true,
            data: {
                token: response.data.token,
                refresh_token: response.data.refresh_token
            }
        }
    } catch (error) {
        removeAccessTokens();
        return {
            success: false,
            error: error.response?.data?.message || 'Erro ao fazer login'
        }
    }
}

export const RefreshMethod = async (refreshToken: string): Promise<string> => {
    try {
        if (!refreshToken) {
            throw new Error("Refresh token não existe.")
        }

        //faz requisição a rota "/refresh" do backend
        const response = await instance.post<Login>('/refresh', refreshToken);

        if (response.data.token) {
            setAccessToken(response.data.token);
            return response.data.token
        }

        throw new Error("Token não recebido no refresh")
    } catch (error) {
        removeAccessTokens();
        throw error;
    }
}