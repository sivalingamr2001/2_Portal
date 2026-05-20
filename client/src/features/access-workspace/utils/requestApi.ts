import type {
  AccessRequest,
  AccessRequestApproval,
  AccessRequestDetails,
  AccessRequestItem,
  AggregateStatus,
  AppRole,
  AuditLogItem,
  DashboardQuery,
  DashboardResponse,
  Department,
  EmployeeRecord,
  HodResponse,
  NotificationItem,
  PaginatedResponse,
  RequestStatus,
} from "../types"
import type { AuthUser } from "@/context/AuthContext"

const API_URL = import.meta.env.VITE_API_URL ?? "/access-portal/api"

/**
 * Safely parse a JSON response, handling cases where the server
 * returns HTML error pages instead of JSON
 */
async function safeParseJson<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type")

  // If it's not JSON content, throw an error instead of trying to parse
  if (contentType && !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response")
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error("Failed to parse server response")
  }
}
const ACCESS_TYPE_MAP = ["Not Applicable", "Read Only", "Read & Write"] as const
const AGGREGATE_STATUS_MAP = [
  "Pending",
  "Approved",
  "Rejected",
  "Expired",
  "Revoked",
] as const
const STATUS_MAP = [
  "Submitted",
  "Pending HOD",
  "Pending IT",
  "Approved HOD",
  "Approved IT",
  "Access Granted",
  "Rejected HOD",
  "Rejected IT",
  "Access Rejected",
  "Expired",
  "Revoked",
] as const

function mapAccessItem(item: {
  accessItemId: number
  accessType: number | string
  status: number | string
  createdOn: string
  folderPath: string
  reason: string
}): AccessRequestItem {
  const index =
    typeof item.accessType === "number"
      ? item.accessType
      : ACCESS_TYPE_MAP.findIndex((value) => value === item.accessType)
  const statusIndex =
    typeof item.status === "number"
      ? item.status
      : STATUS_MAP.findIndex((value) => value === item.status)

  return {
    accessItemId: item.accessItemId,
    status: (STATUS_MAP[statusIndex] ?? "Submitted") as RequestStatus,
    accessType: ACCESS_TYPE_MAP[index] ?? "Not Applicable",
    createdOn: item.createdOn,
    folderPath: item.folderPath,
    reason: item.reason,
  }
}

function mapApproval(item: {
  accessApproveId: number
  approvalStatus: number | string
  approverId: number
  approverName: string
  approverRole: string
  comments: string
  createdOn: string
}): AccessRequestApproval {
  const index =
    typeof item.approvalStatus === "number"
      ? item.approvalStatus
      : STATUS_MAP.findIndex((value) => value === item.approvalStatus)
  return {
    accessApproveId: item.accessApproveId,
    approvalStatus: STATUS_MAP[index] ?? "Submitted",
    approverId: item.approverId,
    approverName: item.approverName,
    approverRole: item.approverRole,
    comments: item.comments,
    createdOn: item.createdOn,
  }
}

function mapAccessRequestDetails(details: {
  accessReqId: number
  aggregateStatus: number | string
  approvals: Array<{
    accessApproveId: number
    approvalStatus: number | string
    approverId: number
    approverName: string
    approverRole: string
    comments: string
    createdOn: string
  }>
  createdOn: string
  currentApproverName: string
  currentApproverRole: string
  departmentId: number
  departmentName: string
  empId: number
  items: Array<{
    accessItemId: number
    status: number | string
    accessType: number | string
    createdOn: string
    folderPath: string
    reason: string
  }>
  itsrNo: string | null
  modifiedOn: string | null
  reqTo: number
  requesterName: string
  status: number | string
  timeline: AccessRequestDetails["timeline"]
}): AccessRequestDetails {
  const statusIndex =
    typeof details.status === "number"
      ? details.status
      : STATUS_MAP.findIndex((value) => value === details.status)
  const aggregateIndex =
    typeof details.aggregateStatus === "number"
      ? details.aggregateStatus
      : AGGREGATE_STATUS_MAP.findIndex(
          (value) => value === details.aggregateStatus
        )
  return {
    ...details,
    aggregateStatus: AGGREGATE_STATUS_MAP[aggregateIndex] ?? "Pending",
    approvals: details.approvals.map(mapApproval),
    items: details.items.map(mapAccessItem),
    status: STATUS_MAP[statusIndex] ?? "Submitted",
  }
}

export async function fetchAccessRequests(
  employeeId: number
): Promise<AccessRequest[]> {
  const response = await fetch(
    `${API_URL}/dashboard/${employeeId}?Page=1&PageSize=10`
  )
  if (!response.ok) throw new Error("Unable to load access requests.")

  const payload = await safeParseJson(response)

  // Ensure payload and payload.data exist before mapping
  if (!payload || !Array.isArray(payload.data)) {
    return [];
  }

  return payload.data.map((request: any) => {
    // FIX: Fallback to a default status if request.status doesn't exist in DTO
    const rawStatus = request.status !== undefined ? request.status : 0; 
    
    return {
      ...request,
      status: (typeof rawStatus === "number"
        ? STATUS_MAP[rawStatus]
        : rawStatus) as RequestStatus,

      // Match C# backend property name 'accessItems'
      accessItems: Array.isArray(request.accessItems) 
        ? request.accessItems.map((item: any) => ({
            ...item,
            status: (typeof item.status === "number"
              ? STATUS_MAP[item.status]
              : item.status) as RequestStatus,
            accessType: (typeof item.accessType === "number"
              ? ACCESS_TYPE_MAP[item.accessType]
              : item.accessType) as AccessRequestItem["accessType"],
          }))
        : [],

      // FIX: Handle missing aggregateStatus safely
      aggregateStatus: (typeof request.aggregateStatus === "number"
        ? AGGREGATE_STATUS_MAP[request.aggregateStatus]
        : request.aggregateStatus || "Pending") as AggregateStatus,
    };
  })
}

export async function fetchAccessRequestDetails(
  accessReqId: number,
  viewerEmployeeId: number
) {
  const response = await fetch(
    `${API_URL}/access-requests/${accessReqId}?viewerEmployeeId=${viewerEmployeeId}`
  )
  if (!response.ok) throw new Error("Unable to load request details.")
  const payload = await safeParseJson(response)
  return mapAccessRequestDetails(payload)
}

export async function fetchNotifications(
  employeeId: number,
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<NotificationItem>> {
  const response = await fetch(
    `${API_URL}/notifications/${employeeId}?Page=${page}&PageSize=${pageSize}`
  )
  if (!response.ok) throw new Error("Unable to load notifications.")

  const payload = await safeParseJson(response)
  return {
    data: payload.data.map((item: any) => ({
      auditId: item.auditId,
      accessReqId: item.accessReqId,
      eventType: item.eventType,
      message: item.message,
      recipientRole: item.recipientRole as AppRole,
      createdOn:
        typeof item.createdOn === "string"
          ? item.createdOn
          : new Date(item.createdOn).toLocaleString(),
      isRead: item.isRead,
    })),
    page: payload.page,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
  }
}

export async function markNotificationRead(
  auditId: number,
  employeeId: number
) {
  const response = await fetch(`${API_URL}/notifications/${auditId}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ EmployeeId: employeeId }),
  })
  if (!response.ok) throw new Error("Unable to update notification status.")
}

export async function fetchAuditLogs(
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<AuditLogItem>> {
  const response = await fetch(
    `${API_URL}/audit-logs?Page=${page}&PageSize=${pageSize}`
  )
  if (!response.ok) throw new Error("Unable to load audit logs.")

  const payload = await safeParseJson(response)
  return {
    data: payload.data.map((item: any) => ({
      auditId: item.auditId,
      actor: item.actor,
      eventType: item.eventType,
      requestId: item.requestId,
      createdOn:
        typeof item.createdOn === "string"
          ? item.createdOn
          : new Date(item.createdOn).toLocaleString(),
      details: item.details,
    })),
    page: payload.page,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
  }
}

export async function fetchAllUsers(
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<EmployeeRecord>> {
  const response = await fetch(
    `${API_URL}/User/GetAllUsers?Page=${page}&PageSize=${pageSize}`
  )
  if (!response.ok) throw new Error("Unable to load employees.")

  const payload = await safeParseJson(response)
  return {
    data: payload.data.map((item: any) => ({
      userId: item.userId,
      employeeId: item.employeeId,
      name: item.name,
      departmentName: item.departmentName,
      role: item.role as AppRole,
      email: item.email,
    })),
    page: payload.page,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
  }
}

export async function searchEmployees(
  searchTerm: string,
  page = 1,
  pageSize = 10
): Promise<EmployeeRecord> {
  const response = await fetch(
    `${API_URL}/employees/Search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${pageSize}`
  )
  if (!response.ok) throw new Error("Unable to search employees.")

  const payload = await safeParseJson(response)
  return payload.map((item: any) => ({
    userId: item.userId,
    employeeId: item.employeeId,
    name: item.name,
    departmentName: item.departmentName,
    role: item.role as AppRole,
    email: item.email,
    userName: item.userName,
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    location: item.location,
    departmentId: item.departmentId,
  }))
}

export async function fetchUserProfile(employeeId: number): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/User/${employeeId}`)
  if (!response.ok) throw new Error("Unable to load user profile.")
  return safeParseJson(response)
}

export type UpdateUserPayload = {
  employeeId?: number
  userName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  departmentId?: number
  departmentName?: string
  role?: AppRole
}

export async function updateUserProfile(
  userId: number,
  payload: UpdateUserPayload
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/User/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error("Unable to update user profile.")
  return safeParseJson(response)
}

export type CreateUserPayload = {
  employeeId?: number
  userName: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  departmentId?: number
  departmentName?: string
  role?: AppRole
  password: string
}

export async function createUser(
  payload: CreateUserPayload
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/User`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await safeParseJson<{ message?: string }>(response)
      .then((data) => data?.message as string)
      .catch(() => null)
    throw new Error(message || "Unable to create user.")
  }

  return safeParseJson(response)
}

export async function fetchDepartments(
  page = 1,
  pageSize = 10
): Promise<Department[]> {
  const response = await fetch(
    `${API_URL}/departments?Page=${page}&PageSize=${pageSize}`
  )
  if (!response.ok) throw new Error("Unable to load departments.")
  const payload = await safeParseJson(response)
  return (payload.data ?? []) as Department[]
}

export async function createDepartment(
  department: Department
): Promise<Department> {
  const response = await fetch(`${API_URL}/departments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deptId: department.deptId,
      name: department.name,
      hodId: department.hodId,
    }),
  })

  if (!response.ok) {
    const message = await safeParseJson<{ message?: string }>(response)
      .then((data) => data?.message as string)
      .catch(() => null)
    throw new Error(message || "Unable to create department.")
  }

  return safeParseJson(response)
}

export async function updateDepartment(
  department: Department
): Promise<Department> {
  const response = await fetch(`${API_URL}/departments/${department.deptId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: department.name,
      hodId: department.hodId,
    }),
  })

  if (!response.ok) {
    const message = await safeParseJson<{ message?: string }>(response)
      .then((data) => data?.message as string)
      .catch(() => null)
    throw new Error(message || "Unable to update department.")
  }

  return safeParseJson(response)
}

export async function updateUserPassword(
  employeeId: number,
  password: string
): Promise<void> {
  const response = await fetch(`${API_URL}/User/${employeeId}/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
    const message = await safeParseJson<{ message?: string }>(response)
      .then((data) => data?.message as string)
      .catch(() => null)
    throw new Error(message || "Unable to update password.")
  }
}

export async function reviewAccessRequestByHod(
  accessReqId: number,
  accessItemId: number,
  reviewerEmployeeId: number,
  approved: boolean,
  comments: string,
  confirmAccessType?: number
) {
  const response = await fetch(
    `${API_URL}/access-requests/${accessReqId}/${accessItemId}/hod-review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerEmployeeId,
        approved,
        comments,
        confirmAccessType: confirmAccessType || 1,
      }),
    }
  )
  if (!response.ok) throw new Error("Unable to complete HOD review.")
}

export async function reviewAccessRequestByIt(
  accessReqId: number,
  accessItemId: number,
  reviewerEmployeeId: number,
  approved: boolean,
  comments: string,
  itsrNo: string,
  confirmAccessType?: number
) {
  const response = await fetch(
    `${API_URL}/access-requests/${accessReqId}/${accessItemId}/it-review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerEmployeeId,
        approved,
        comments,
        itsrNo,
        confirmAccessType: confirmAccessType || 1,
      }),
    }
  )
  if (!response.ok) throw new Error("Unable to complete IT review.")
}

export async function revokeAccessRequest(
  accessReqId: number,
  accessItemId: number,
  reviewerEmployeeId: number,
  comments: string
) {
  const response = await fetch(
    `${API_URL}/access-requests/${accessReqId}/${accessItemId}/revoke`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerEmployeeId,
        comments,
      }),
    }
  )

  if (!response.ok) throw new Error("Unable to revoke access request.")
}

export async function searchUsers(
  searchTerm: string,
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<EmployeeRecord>> {
  const response = await fetch(
    `${API_URL}/User/Search?searchTerm=${encodeURIComponent(searchTerm)}&Page=${page}&PageSize=${pageSize}`
  )
  if (!response.ok) throw new Error("Unable to search users.")

  const payload = await safeParseJson(response)
  return {
    data: payload.data.map((item: any) => ({
      userId: item.userId,
      employeeId: item.employeeId,
      name: item.name,
      departmentName: item.departmentName,
      role: item.role as AppRole,
      email: item.email,
    })),
    page: payload.page,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
  }
}

export async function fetchAllHod(
  page = 1,
  pageSize = 10
): Promise<HodResponse[]> {
  const response = await fetch(
    `${API_URL}/hod-details?Page=${page}&PageSize=${pageSize}`
  )

  if (!response.ok) throw new Error("Unable to search users.")

  const payload = await safeParseJson(response)

  return payload.map((item: any) => ({
    EmployeeId: item.employeeId,
    Name: item.name,
    Email: item.email,
    PhoneNumber: item.phoneNumber,
  }))
}

export type FolderMappingRecord = {
  id: number
  folderName: string

  // HOD Details
  hodId?: string
  hodName?: string
  hodEmail?: string

  primaryHodId?: string
  primaryHodName?: string
  primaryHodEmail?: string

  secondaryHodId?: string
  secondaryHodName?: string
  secondaryHodEmail?: string

  // Base Entity Fields
  isActive: boolean
  createdBy: string
  createdOn: string | Date
  modifiedBy?: string
  modifiedOn?: string | Date
}

export async function fetchFolderMappings(): Promise<FolderMappingRecord[]> {
  const response = await fetch(`${API_URL}/admin/folder-mapping`)
  if (!response.ok) throw new Error("Unable to load folder mappings.")

  const payload = await safeParseJson(response)
  return payload.map((item: any) => ({
    id: item.id,
    folderName: item.folderName,

    // Primary HOD
    primaryHodId: item.primaryHodId,
    primaryHodName: item.primaryHodName,
    primaryHodEmail: item.primaryHodEmail,

    // Secondary HOD
    secondaryHodId: item.secondaryHodId,
    secondaryHodName: item.secondaryHodName,
    secondaryHodEmail: item.secondaryHodEmail,

    // Audit Fields
    isActive: item.isActive,
    createdBy: item.createdBy,
    createdOn: item.createdOn,
    modifiedBy: item.modifiedBy,
    modifiedOn: item.modifiedOn,
  }))
}

export async function saveFolderMapping(
  payload: FolderMappingRecord
): Promise<FolderMappingRecord> {
  const response = await fetch(`${API_URL}/admin/folder-mapping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await safeParseJson<{ message?: string }>(response)
      .then((data) => data?.message as string)
      .catch(() => null)
    throw new Error(message || "Unable to save folder mapping.")
  }

  return safeParseJson(response)
}

//create function to delete folder mapping
export async function deleteFolderMapping(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/admin/folder-mapping/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const message = await safeParseJson<{ message?: string }>(response)
      .then((data) => data?.message as string)
      .catch(() => null)
    throw new Error(message || "Unable to delete folder mapping.")
  }
}

export async function fetchFolderHierarchy(): Promise<
  { name: string; children: any[] }[]
> {
  const response = await fetch(`${API_URL}/admin/folder-mapping/hierarchy`)
  if (!response.ok) throw new Error("Unable to load folder hierarchy.")
  const payload = await safeParseJson(response)
  return payload
}

export async function fetchParentFolders(): Promise<string[]> {
  const response = await fetch(`${API_URL}/admin/folder-mapping/export`)
  if (!response.ok) throw new Error("Unable to load parent folders.")
  const payload = await safeParseJson(response)
  return payload.map((item: any) => item.name)
}

export async function searchAuditLogs(
  searchTerm: string,
  page = 1,
  pageSize = 10
): Promise<PaginatedResponse<AuditLogItem>> {
  const response = await fetch(
    `${API_URL}/audit-logs/search?searchTerm=${encodeURIComponent(searchTerm)}&Page=${page}&PageSize=${pageSize}`
  )
  if (!response.ok) throw new Error("Unable to search audit logs.")

  const payload = await safeParseJson(response)
  return {
    data: payload.data.map((item: any) => ({
      auditId: item.auditId,
      actor: item.actor,
      eventType: item.eventType,
      requestId: item.requestId,
      createdOn:
        typeof item.createdOn === "string"
          ? item.createdOn
          : new Date(item.createdOn).toLocaleString(),
      details: item.details,
    })),
    page: payload.page,
    pageSize: payload.pageSize,
    totalCount: payload.totalCount,
  }
}

export async function getExpiredAccessItems(
  accessItemId: number
): Promise<string> {
  try {
    const response = await fetch(
      `${API_URL}/access-requests/expiration/${accessItemId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Error fetching expiration: ${response.statusText}`)
    }

    const expirationDate = await response.json()

    return expirationDate
  } catch (error) {
    console.error("Failed to get expiration date:", error)
    throw error
  }
}

export async function fetchDashboard(
  params: DashboardQuery
): Promise<DashboardResponse> {
  try {
    // Convert object params into a query string
    const queryString = new URLSearchParams(params as any).toString()
    const url = `${API_URL}/dashboard/access-requests${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching dashboard: ${response.statusText}`)
    }

    const data: DashboardResponse = await response.json()
    return data
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    throw error
  }
}
