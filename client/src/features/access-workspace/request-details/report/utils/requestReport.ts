import type { AccessRequestDetails } from "../../../types"
import type { AccessRequestPayload } from "@/lib/access-request-schema"

export const REPORT_POLICIES = [
  "Access is granted strictly for business-related purposes. Unauthorized access, sharing, or modification of data is prohibited.",
  "Employees must maintain the confidentiality of the information and not share it with unauthorized personnel.",
  "Users must only access data necessary for their job functions. Any additional access must be approved through formal requests.",
  "The organization reserves the right to monitor file access and usage for security and compliance purposes.",
  "Users must not modify or delete critical business data unless explicitly authorized.",
  "Access may be revoked at any time due to changes in job roles, security concerns, or policy violations.",
]

export function buildResubmitPayload(
  details: AccessRequestDetails
): AccessRequestPayload {
  return {
    accessReqId: details.accessReqId,
    empId: details.empId,
    isAgree: true,
    items: details.items.map((item) => ({
      accessType: mapAccessType(item.accessType),
      confirmAccessTypeByHOD: 0,
      folderPath: item.folderPath,
      reason: item.reason,
    })),
    itsrNo: details.itsrNo || "",
    reqTo: details.reqTo,
  }
}

export function getLatestReviewComment(details: AccessRequestDetails) {
  const approvals = [...details.approvals].reverse()
  return (
    approvals.find((item) => item.comments.trim())?.comments ||
    "No review comments were recorded."
  )
}

export function getItProvisionDate(details: AccessRequestDetails) {
  return (
    details.approvals.find((item) => item.approvalStatus === "Approved IT")
      ?.createdOn || null
  )
}

export function getHodReviewer(details: AccessRequestDetails) {
  return (
    details.approvals.find(
      (item) =>
        item.approvalStatus === "Approved HOD" ||
        item.approvalStatus === "Rejected HOD"
    ) || null
  )
}

export function getItReviewer(details: AccessRequestDetails) {
  return (
    details.approvals.find((item) => item.approvalStatus === "Approved IT") ||
    null
  )
}

export function getStatusTone(status: string) {
  if (status.includes("Granted") || status.includes("Approved"))
    return "success"
  if (status.includes("Rejected") || status.includes("Revoked"))
    return "destructive"
  return "warning"
}

function mapAccessType(
  value: AccessRequestDetails["items"][number]["accessType"]
) {
  if (value === "Read & Write") return 2
  if (value === "Read Only") return 1
  return 0
}
