import type { Base } from "../domain/base";
import { instance } from "../../../services/axios";

export const fetchBases = async (): Promise<Base[]> => {
    const response = await instance.get<Base[]>('/bases');
    return response.data
}

export const fetchBaseById = async (id: number): Promise<Base> => {
  const response = await instance.get<Base>(`/bases/${id}`);
  return response.data;
}

export async function deleteBaseById(id: number) {
  const response = await instance.delete(`/bases/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir base");
}

// export async function updateBase(id: number, base: Base) {
//  const response = await instance.put(`/bases/${id}`, base);
//  console.log(base, "no update base", id);
//  if (response.status != 200) throw new Error("Erro ao atualizar base");
//  return response.data;
// }

export async function createBase (base: Base) {
  const response = await instance.post(`/bases`, base);
  console.log(base, "chamando create base")
  if (response.status != 200) throw new Error("Erro ao adicionar base");
}