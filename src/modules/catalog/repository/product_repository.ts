import type { Product } from "../domain/product";
import { getWithPagination, instance } from "../../../services/axios";
import type { ProductWithComponents } from "../domain/productWithComponents";

export const fetchProducts = async (): Promise<Product[]> => {
    const response = await instance.get<Product[]>('/products');
    return response.data
}

export async function deleteProductById(id: number) {
  const response = await instance.delete(`/products/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir produto");
}

export async function updateProduct(id: number, product: Product) {
  const response = await instance.put(`/products/${id}`, product);
  console.log(product, "no update product", id);
  if (response.status != 200) throw new Error("Erro ao atualizar produto");
  return response.data;
}

export async function createProduct (product: Product) {
  const response = await instance.post(`/products`, product);
  console.log(product, "chamando create product")
  if (response.status != 200) throw new Error("Erro ao adicionar produto");
}

export const fetchWithComponents = async (): Promise<ProductWithComponents[]> => {
  const response = await instance.get<ProductWithComponents[]>(`products/buchas/acionamentos/bases`);
  console.log(response);
  
  return response.data
}

interface Options {
  page?: 1, 
  limit?: 10, 
  search?: Record<string, any>,
  total?: 0,
  equals?: Record<string, any>
}

export const withParams = async (options: Options = {}): Promise<ProductWithComponents[]> => {
  const response = await getWithPagination<ProductWithComponents[]>(`products/params`, options);
  return response
}
