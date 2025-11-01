import type { UserGroup } from "../domain/user_group";
import { instance } from "../../../services/axios";
import type { Base } from "../../catalog/domain/base";

export const fetchGroups = async (): Promise<UserGroup[]> => {
    const response = await instance.get<UserGroup[]>('/bases');
    return response.data
}

export const fetchBaseById = async (id: number): Promise<Base> => {
  const response = await instance.get<Base>(`/bases/${id}`);
  return response.data;
}