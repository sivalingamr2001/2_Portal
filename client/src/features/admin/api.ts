import { axiosClient } from "@/Api/axiosClient"

import type {
  AdminRole,
  AdminUserRecord,
  AuditLogRecord,
  DepartmentRecord,
  FolderMappingRecord,
  HodRecord,
  PagedResponse,
} from "./types"

type AdminUserCreatePayload = {
  identifier: string
  userRole: AdminRole
  location: string
}

type AdminUserUpdatePayload = {
  userRole: AdminRole
  location: string
}

type DepartmentPayload = {
  deptId?: number
  deptName: string
  hodUserId?: number | null
}

type FolderMappingPayload = {
  folderPath: string
  primaryHodUserId: number
  secondaryHodUserId?: number | null
  isActive: boolean
}

function parseApiError(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const responseData = error.response.data
    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "message" in responseData &&
      typeof responseData.message === "string"
    ) {
      return new Error(responseData.message)
    }
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(fallback)
}

export async function getAdminUsers(params?: {
  search?: string
  role?: string
}) {
  try {
    const response = await axiosClient.get<AdminUserRecord[]>("/users", { params })
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to load employees.")
  }
}

export async function createAdminUser(payload: AdminUserCreatePayload) {
  try {
    const response = await axiosClient.post<AdminUserRecord>("/users", payload)
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to create employee.")
  }
}

export async function updateAdminUser(userId: number, payload: AdminUserUpdatePayload) {
  try {
    const response = await axiosClient.put<AdminUserRecord>(`/users/${userId}`, payload)
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to update employee.")
  }
}

export async function deleteAdminUser(userId: number) {
  try {
    await axiosClient.delete(`/users/${userId}`)
  } catch (error) {
    throw parseApiError(error, "Unable to delete employee.")
  }
}

export async function getDepartments() {
  try {
    const response = await axiosClient.get<DepartmentRecord[]>("/departments")
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to load departments.")
  }
}

export async function createDepartment(payload: DepartmentPayload) {
  try {
    const response = await axiosClient.post<DepartmentRecord>("/departments", payload)
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to create department.")
  }
}

export async function updateDepartment(deptId: number, payload: DepartmentPayload) {
  try {
    const response = await axiosClient.put<DepartmentRecord>(`/departments/${deptId}`, {
      departmentCode: `DEPT-${deptId}`,
      deptName: payload.deptName,
      hodUserId: payload.hodUserId ?? null,
    })
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to update department.")
  }
}

export async function deleteDepartment(deptId: number) {
  try {
    await axiosClient.delete(`/departments/${deptId}`)
  } catch (error) {
    throw parseApiError(error, "Unable to delete department.")
  }
}

export async function getHods() {
  try {
    const response = await axiosClient.get<HodRecord[]>("/hods")
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to load HOD users.")
  }
}

export async function getFolderMappings() {
  try {
    const response = await axiosClient.get<FolderMappingRecord[]>("/folder-mappings")
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to load folder mappings.")
  }
}

export async function getFolderOptions() {
  try {
    const response = await axiosClient.get<string[]>("/folder-mappings/folder-options")
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to load folder options.")
  }
}

export async function createFolderMapping(payload: FolderMappingPayload) {
  try {
    const response = await axiosClient.post<FolderMappingRecord>("/folder-mappings", payload)
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to create folder mapping.")
  }
}

export async function updateFolderMapping(id: number, payload: FolderMappingPayload) {
  try {
    const response = await axiosClient.put<FolderMappingRecord>(`/folder-mappings/${id}`, payload)
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to update folder mapping.")
  }
}

export async function deleteFolderMapping(id: number) {
  try {
    await axiosClient.delete(`/folder-mappings/${id}`)
  } catch (error) {
    throw parseApiError(error, "Unable to delete folder mapping.")
  }
}

export async function getAuditLogs(params: {
  pageNumber: number
  pageSize: number
  entityName?: string
}) {
  try {
    const response = await axiosClient.get<PagedResponse<AuditLogRecord>>("/audit-logs", {
      params,
    })
    return response.data
  } catch (error) {
    throw parseApiError(error, "Unable to load audit logs.")
  }
}
