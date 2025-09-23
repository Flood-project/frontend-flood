import { instance } from "../../../services/axios";

export const LoginMethod = async (payload: {
  email: string;
  password_hash: string;
}): Promise<LoginResponse> => {
  const response = await instance.post<LoginResponse>("/login", payload);
  return response.data;
};

export interface LoginResponse {
  token: string;
  refresh_token: string;
}

export interface MyClaims {
  id: number;
  email: string;
  id_user_group: number;
  type: string;
  exp: number;
}
