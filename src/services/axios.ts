import axios from "axios";
import { getAccessToken, getRefreshToken, removeAccessTokens, setRefreshToken } from "./token";
import { router } from "../router";

const baseUrl = import.meta.env.VITE_BASE_URL 

const instance = axios.create({
    baseURL:`${baseUrl}`,
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 1000,
});

instance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; 
        }
        
        return config;
    },
    (error) => Promise.reject(error)
)

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        //se houver um erro 401 faz a requisição para o refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const oldToken = getRefreshToken()
                if (!oldToken) {
                    return null;
                }

                const newToken = await setRefreshToken(oldToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return instance(originalRequest);
            } catch (error) {
                removeAccessTokens();
                window.location.href = "/loginteste";
                return Promise.reject(error);
            }
           
        }
        return Promise.reject(error)
    }
)

export { instance }