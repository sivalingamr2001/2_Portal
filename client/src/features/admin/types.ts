export type AdminRole = "Admin" | "Operator" | "Hod" | "User"

export type HodRecord = {
  userId: number
  employeeId: string
  name: string
  email: string
  phoneNumber: string
  deptId?: number | null
  isDepartmentHod: boolean
  userRole: AdminRole
  location: string
}

export type AdminUserRecord = {
  userId: number
  employeeId: string
  userName: string
  email: string
  mobile: number
  deptId: number
  departmentName: string
  userRole: AdminRole
  location: string
  createdAt: string
}

export type DepartmentRecord = {
  deptId: number
  deptName: string
  hodUserId?: number | null
  hod?: HodRecord | null
}

export type FolderMappingRecord = {
  id: number
  folderPath: string
  primaryHodUserId: number
  primaryHod?: HodRecord | null
  secondaryHodUserId?: number | null
  secondaryHod?: HodRecord | null
  isActive: boolean
  createdAt: string
  createdBy: string
  modifiedAt?: string | null
  modifiedBy?: string | null
}

export type AuditLogRecord = {
  id: number
  entityName: string
  entityId: number
  action: string
  oldValues?: string | null
  newValues?: string | null
  performedBy: string
  performedAt: string
  correlationId?: string | null
}

export type PagedResponse<T> = {
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}
