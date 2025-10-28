import type { Acionamento } from "../domain/acionamento_domain";
import { instance } from "../../../services/axios";

export const fetchAcionamentos = async (): Promise<Acionamento[]> => {
    const response = await instance.get<Acionamento[]>('/acionamentos');
    return response.data
}

export async function deleteAcionamentoById(id: number) {
  const response = await instance.delete(`/acionamentos/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir acionamento");
}

export async function createAcionamento (acionamento: Acionamento) {
  const response = await instance.post(`/acionamentos`, acionamento);
  console.log(acionamento, "chamando create product")
  if (response.status != 200) throw new Error("Erro ao adicionar produto");
}