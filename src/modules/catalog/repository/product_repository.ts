import type { Product } from "../domain/product";
import { instance } from "../../../services/axios";

export const fetchProducts = async (): Promise<Product[]> => {
    const response = await instance.get<Product[]>('/products');
    return response.data
}

export async function deleteProductById(id: number) {
  const response = await fetch(`/product/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Erro ao excluir produto");
}

export async function updateProduct(product: Product) {
  const response = await fetch(`/product/${product.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error("Erro ao atualizar produto");
  return response.json();
}
