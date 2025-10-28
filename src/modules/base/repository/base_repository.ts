import type { Base } from "../domain/base_domain";
import { instance } from "../../../services/axios";

export const fetchBases = async (): Promise<Base[]> => {
    const response = await instance.get<Base[]>('/bases');
    return response.data
}

export async function deleteBaseById(id: number) {
  const response = await instance.delete(`/bases/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir base");
}

export async function createBase (base: Base) {
  const response = await instance.post(`/bases`, base);
  console.log(base, "chamando create base")
  if (response.status != 200) throw new Error("Erro ao adicionar base");
}