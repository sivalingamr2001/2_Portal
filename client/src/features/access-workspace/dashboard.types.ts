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

export interface DashboardQuery {
  empId?: number;
  approverId?: number;
  status?: string;
  from?: string;
  to?: string;
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
