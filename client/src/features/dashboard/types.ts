export type AccessTypeBreakdown = {
  accessType: string
  count: number
  percentage: number
}

export type StatusBreakdown = {
  status: string
  count: number
  percentage: number
}

export type TrendPoint = {
  date: string
  submitted: number
  approved: number
  rejected: number
  revoked: number
}

export type AuditLog = {
  auditId: string
  eventType: string
  createdOn: string
}

export type PendingApproval = {
  accessApproveId: string
  approverId: string
  accessType: string
}

export type RecentRequest = {
  accessReqId: string
  empName: string
  overallStatus: string
  itemCount: number
  createdOn: string
}

export type DashboardSummary = {
  totalRequests: number
  approvedCount: number
  pendingCount: number
  rejectedCount: number
  revokedCount: number
  agreedCount: number
  unreadNotifications: number
}

export type DashboardQuery = {
  userId?: number
  role?: string
}

export type DashboardResponse = {
  generatedAt: string
  summary: DashboardSummary
  statusBreakdown: StatusBreakdown[]
  accessTypeBreakdown: AccessTypeBreakdown[]
  trend: TrendPoint[]
}
