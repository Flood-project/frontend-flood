import type { Bucha } from "../../bucha/domain/bucha_domain";
import { instance } from "../../../services/axios";

export const fetchBuchas = async (): Promise<Bucha[]> => {
  try {
    const response = await instance.get<Bucha[]>('/buchas');

    if(!response.data) {
      console.warn("Sem resposta. ", response)
      return []
    }
    return response.data
  } catch (error) {
    console.error("Erro ao buscar buchas ", error)
    return []
    
  }
}

export async function deleteBuchaById(id: number) {
  const response = await instance.delete(`/buchas/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir bucha");
}

export async function createBucha (bucha: Bucha) {
  const response = await instance.post(`/buchas`, bucha);
  console.log(bucha, "chamando create bucha")
  if (response.status != 200) throw new Error("Erro ao adicionar bucha");
}