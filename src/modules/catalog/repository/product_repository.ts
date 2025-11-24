import type { Product } from "../domain/product";
import { getWithPagination, instance } from "../../../services/axios";
import type { ProductWithComponents } from "../domain/productWithComponents";

export const fetchProducts = async (): Promise<Product[]> => {
    const response = await instance.get<Product[]>('/products');
    return response.data
}

export const fetchById = async (id: number): Promise<Product> => {
  try {
    const response = await instance.get<Product>(`/products/${id}`);
    console.log(response.data);
    return response.data;
     
  } catch (error) {
    console.log('Erro ao listar produto por id', error);
    throw error;
  }
  
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

export async function createProduct(product: Product) {
  const response = await instance.post(`/products`, product);
  console.log(product, "chamando create product");
  if (response.status !== 201 && response.status !== 200) {
    throw new Error("Erro ao adicionar produto");
  }
  return response.data; // ← ADICIONE ESTE RETURN!
}

export const fetchWithComponents = async (): Promise<ProductWithComponents[]> => {
  const response = await instance.get<ProductWithComponents[]>(`products/buchas/acionamentos/bases`);
  console.log('rpdoutos do repos: ', response);
  
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
  console.log("reposta WithParams", response)
  return response
}

interface FilterParams {
  tipo_bucha?: string
  tipoacionamento?: string
  tipobase?: string,
  page?: number, 
  limit?: number, 
  search?: Record<string, any>,
  total?: number,
  equals?: Record<string, any>
}

export const filterWithParams = async (params: FilterParams) => {
  const response = await instance.get(`products/params`, {
    params: {
      [`eq[tipo_bucha]`]: params.tipo_bucha,
      [`eq[tipoacionamento]`]: params.tipoacionamento,
      [`eq[tipobase]`]: params.tipobase,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
    
    
  })
  console.log(params);
  console.log(response);
  
  return response.data // <-- garante que retorna o objeto completo
}


export interface FilterResponse {
  limit: number
  page: number
  total: number
  products_with_params: ProductWithComponents[] | null
}
