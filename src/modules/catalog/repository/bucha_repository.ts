import type { Bucha } from "../domain/bucha";
import { instance } from "../../../services/axios";

export const fetchBuchas = async (): Promise<Bucha[]> => {
    const response = await instance.get<Bucha[]>('/buchas');
    return response.data
}

export const fetchBuchaById = async (id: number): Promise<Bucha> => {
  const response = await instance.get<Bucha>(`/buchas/${id}`);
  return response.data;
}

export async function deleteBuchaById(id: number) {
  const response = await instance.delete(`/buchas/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir bucha");
}

export async function updateBucha(id: number, bucha: Bucha) {
 const response = await instance.put(`/buchas/${id}`, bucha);
 console.log(bucha, "no update bucha", id);
 if (response.status != 200) throw new Error("Erro ao atualizar bucha");
 return response.data;
}

export async function createBucha (bucha: Bucha) {
  const response = await instance.post(`/buchas`, bucha);
  console.log(bucha, "chamando create bucha")
  if (response.status != 200) throw new Error("Erro ao adicionar bucha");
}