import axios from "axios";
import { getAccessToken } from "./token";
import { createPaginate } from 'js-query-pagination'

const baseUrl = import.meta.env.VITE_BASE_URL 

const instance = axios.create({
    baseURL:`${baseUrl}`,
    headers: {
        'Authorization': 'Bearer token' 
    },
    timeout: 10000,
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

interface Options {
    page?: number,
    limit?: number,
    search?: Record<string, any>,
    equals?: Record<string, any>,
}

const getWithPagination = async <T = any>(
    endpoint: string,
    options: Options = {}
): Promise<T> => {
    const paginate = createPaginate()
    .page(options.page || 1)
    .limit(options.limit || 10);

    const params = paginate.getParams();

    if(options.search) {
        params['like[codigo]'] = options.search
    }

    const response = await instance.get(endpoint, {params});

    return response.data;
}


export { instance, getWithPagination }