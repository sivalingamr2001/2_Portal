import { axiosClient } from "./axiosClient";

export const departments = async () => {
  const response = await axiosClient.get('/departments')
  return response.data
}

export const departmentDetails = async (id: number) => {
  const response = await axiosClient.get(`/departments/${id}`)
  return response.data
}

export const createDepartment = async (data: { name: string; hodId: number }) => {
  const response = await axiosClient.post('/departments', data)
  return response.data
}

export const updateDepartment = async (id: number, data: { name?: string; hodId?: number }) => {
  const response = await axiosClient.put(`/departments/${id}`, data)
  return response.data
}

export const deleteDepartment = async (id: number) => {
  const response = await axiosClient.delete(`/departments/${id}`)
  return response.data
} 