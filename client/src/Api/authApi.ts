import { axiosClient } from "./axiosClient";

export const loginApi = async (loginData: { identifier: string; password: string;}) => {
  const response = await axiosClient.post('/auth/login', loginData)
  return response.data
}

export const meApi = async (userId: number) => {
  const response = await axiosClient.post('/auth/me', null, {
    params: { userId },
  })
  return response.data
}