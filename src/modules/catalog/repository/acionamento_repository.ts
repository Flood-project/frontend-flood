import type { Acionamento } from "../domain/acionamento";
import { instance } from "../../../services/axios";

export const fetchAcionamentos = async (): Promise<Acionamento[]> => {
    const response = await instance.get<Acionamento[]>('/acionamentos');
    return response.data
}

export const fetchAcionamentoById = async (id: number): Promise<Acionamento> => {
  const response = await instance.get<Acionamento>(`/acionamentos/${id}`);
  return response.data;
}

export async function deleteAcionamentoById(id: number) {
  const response = await instance.delete(`/acionamentos/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir acionamento");
}

export async function updateAcionamento(id: number, acionamento: Acionamento) {
 const response = await instance.put(`/acionamentos/${id}`, acionamento);
 console.log(acionamento, "no update product", id);
 if (response.status != 200) throw new Error("Erro ao atualizar produto");
 return response.data;
}

export async function createAcionamento (acionamento: Acionamento) {
  const response = await instance.post(`/acionamentos`, acionamento);
  console.log(acionamento, "chamando create product")
  if (response.status != 200) throw new Error("Erro ao adicionar produto");
}