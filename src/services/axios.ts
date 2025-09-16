import axios from "axios";
import { getAccessToken, removeAccessToken } from "./token";
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
    (error) => {
        if (error.response?.status === 401) {
            removeAccessToken();
            console.log('usuário inautorizado, token removido ', removeAccessToken());
            
            router.push('/loginteste')
            //window.location.href = "/loginteste";
        }
        return Promise.reject(error)
    }
)

export { instance }