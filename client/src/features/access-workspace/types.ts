export type AppRole = "User" | "Hod" | "Operator" | "Admin"
export type QueueMode =
  | "dashboard"
  | "hodPending"
  | "hodHistory"
  | "hodAll"
  | "itQueue"
  | "itActive"
  | "itAll"
export type RequestStatus =
  | "Submitted"
  | "Pending HOD"
  | "Pending IT"
  | "Approved HOD"
  | "Approved IT"
  | "Access Granted"
  | "Rejected HOD"
  | "Rejected IT"
  | "Access Rejected"
  | "Expired"
  | "Revoked"
export type AggregateStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Revoked"

export type AccessItem = {
  accessItemId: number
  ticketNumber: string
  status: RequestStatus
  folderPath: string
  reason: string
  accessType: number // 1 for Read Only, 2 for Read & Write, etc.
}

export type ApprovalItem = {
  approvalId: number
  approverName: string
  status: number
  remarks: string | null
}

export type AccessRequest = {
  accessReqId: number
  empId: number
  reqTo: number
  aggregateStatus: string
  status: string
  itsrNo: string | null
  isAgreed: boolean
  accessItems: AccessItem[] // Grouped child items
  approvalItems: ApprovalItem[]
}

// This matches your C# record DashboardAccessRequestDto exactly
export type DashboardAccessRequestDto = AccessRequest

export type PaginatedResponse<T> = {
  data: T[]
  page: number
  pageSize: number
  totalCount: number
}

export type Department = {
  deptId: number
  name: string
  hodId: number
  hodName: string
}

export type NotificationItem = {
  accessReqId: number
  auditId: number
  createdOn: string
  eventType: string
  isRead: boolean
  message: string
  recipientRole: AppRole
}
export type EmployeeRecord = {
  departmentName: string
  email: string
  employeeId: number
  userId: number
  name: string
  role: AppRole
}

export interface HodResponse {
  EmployeeId: string
  Name: string
  Email: string
  PhoneNumber: string
}

export type AuditLogItem = {
  actor: string
  auditId: number
  createdOn: string
  details: string
  eventType: string
  requestId: number
}
export type SummaryCard = { detail: string; label: string; value: string }
export type TableColumn<T> = {
  header: string
  key: string
  render: (row: T, index: number) => React.ReactNode
}
export type AccessTypeLabel = "Not Applicable" | "Read Only" | "Read & Write"
export type AccessRequestItem = {
  accessItemId: number
  status: RequestStatus
  accessType: AccessTypeLabel
  createdOn: string
  folderPath: string
  reason: string
}
export type AccessRequestApproval = {
  accessApproveId: number
  approvalStatus: string
  approverId: number
  approverName: string
  approverRole: string
  comments: string
  createdOn: string
}
export type AccessRequestTimeline = {
  auditId: number
  createdOn: string
  eventType: string
  isRead: boolean
  message: string
  recipientEmpId: number
  recipientName: string
  recipientRole: string
}
export type AccessRequestDetails = {
  accessReqId: number
  aggregateStatus: string
  approvals: AccessRequestApproval[]
  createdOn: string
  currentApproverName: string
  currentApproverRole: string
  departmentId: number
  departmentName: string
  empId: number
  items: AccessRequestItem[]
  itsrNo: string | null
  modifiedOn: string | null
  reqTo: number
  requesterName: string
  status: string
  timeline: AccessRequestTimeline[]
}

export type AccessRequestFormPayloadForResumbission = {
  accessReqId: number
  empId: number
  isAgree: boolean
  items: {
    accessItemId: number
    accessType: number
    confirmAccessTypeByHOD: number
    folderPath: string
    reason: string
  }
  itsrNo: string
  reqTo: number
}

export interface DashboardResponse {
  summary: DashboardSummary;
  statusBreakdown: StatusBreakdown[];
  accessTypeBreakdown: AccessTypeBreakdown[];
  recentRequests: RecentRequest[];
  pendingApprovals: PendingApproval[];
  recentAuditLogs: AuditLog[];
  trend: TrendPoint[];
  generatedAt: string;
}

export interface DashboardQuery {
  empId?: number;
  approverId?: number;
  status?: string;
  from?: string;
  to?: string;
}

export interface DashboardSummary {
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  revokedCount: number;
  agreedCount: number;
  totalItems: number;
  unreadNotifications: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface AccessTypeBreakdown {
  accessType: string;
  count: number;
  percentage: number;
}

export interface RecentRequest {
  accessReqId: number;
  empName: string;
  approverName: string;
  isAgreed: boolean;
  itsrNo: string;
  createdOn: string;
  createdBy: string;
  itemCount: number;
  overallStatus: 'Pending' | 'Approved' | 'Rejected';
}

export interface PendingApproval {
  accessApproveId: number;
  accessReqId: number;
  accessItemId: number;
  approverId: number;
  approvalStatus: string;
  ticketNumber: string;
  folderPath: string;
  accessType: string;
  requestedBy: string;
  createdOn: string;
}

export interface AuditLog {
  auditId: number;
  accessReqId: number;
  accessItemId: number | null;
  eventType: string;
  message: string;
  recipientName: string;
  recipientRole: string;
  isRead: boolean;
  createdOn: string;
}

export interface TrendPoint {
  date: string;
  submitted: number;
  approved: number;
  rejected: number;
  revoked: number;
}
