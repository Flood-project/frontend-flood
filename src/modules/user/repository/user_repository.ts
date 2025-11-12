import { getWithPagination, instance } from "../../../services/axios";
import { type AccountUser } from "../domain/user";
import { type CreatedUser } from '../domain/user';

export const getUsers = async (): Promise<AccountUser[]> => {
    const response = await instance.get<AccountUser[]>('/accounts/groupid');
    return response.data
}

export async function deleteUserById(id: number) {
  const response = await instance.delete(`/accounts/${id}`);
  if (response.status != 200) throw new Error("Erro ao excluir usuário");
}

export async function updateUser(id: number, accountUser: AccountUser) {
  const response = await instance.put(`/accounts/${id}`, accountUser);
  console.log(accountUser, "no update product", id);
  if (response.status != 200) throw new Error("Erro ao atualizar usuário");
  return response.data;
}

export async function createUser (accountUser: CreatedUser) {
  const response = await instance.post(`/accounts`, accountUser);
  console.log(accountUser, "chamando create create User")
  if (response.status != 200) throw new Error("Erro ao adicionar usuário");
}

interface Options {
  page?: 1, 
  limit?: 10, 
  search?: Record<string, any>,
  total?: 0,
  equals?: Record<string, any>
}


export const withParams = async (options: Options = {}): Promise<AccountUser[]> => {
  const response = await getWithPagination<AccountUser[]>(`accounts/groupid`, options);
  return response
}