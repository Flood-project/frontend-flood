import type { Product } from "../domain/product";
import { instance } from "../../../services/axios";

export const fetchProducts = async (): Promise<Product[]> => {
    const response = await instance.get<Product[]>('/products');
    return response.data
}