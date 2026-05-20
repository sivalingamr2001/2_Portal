import { axiosClient } from "./axiosClient"


export const users = async () => {
  const response = await axiosClient.get('/users')
  return response.data
}

export const userDetails = async (id: number) => {
  const response = await axiosClient.get(`/users/${id}`)
  return response.data
} 

export const createUser = async (data: { name: string; email: string; password: string; role: string; departmentId: number }) => {
  const response = await axiosClient.post('/users', data)
  return response.data
}

export const updateUser = async (id: number, data: { name?: string; email?: string; password?: string; role?: string; departmentId?: number }) => {
  const response = await axiosClient.put(`/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: number) => {
  const response = await axiosClient.delete(`/users/${id}`)
  return response.data
}