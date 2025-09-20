import axios from "axios";
import { getAccessToken } from "./token";

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

export { instance }