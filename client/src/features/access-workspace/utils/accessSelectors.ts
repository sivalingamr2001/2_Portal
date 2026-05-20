import type { AccessRequest, AppRole, QueueMode, SummaryCard } from "../types"

const numberFormatter = new Intl.NumberFormat("en-US")

function expandRequestsByItem(
  requests: AccessRequest[],
  filter?: (item: AccessRequest["accessItems"][number]) => boolean
) {
  return requests.flatMap((request) => {
    if (!request.accessItems.length) {
      return [request]
    }

    const items = filter
      ? request.accessItems.filter(filter)
      : request.accessItems

    return items.map((accessItem) => ({
      ...request,
      accessItems: [accessItem],
    }))
  })
}

function isItemStatus(request: AccessRequest, status: string) {
  return request.accessItems.some((item) => item.status === status)
}

function isItemStatusIncludes(request: AccessRequest, substring: string) {
  return request.accessItems.some((item) => item.status.includes(substring))
}

export function getRequestsByMode(
  requests: AccessRequest[],
  mode: QueueMode,
  employeeId: number
) {
  if (mode === "dashboard")
    return expandRequestsByItem(
      requests.filter((request) => request.empId === employeeId)
    )
  if (mode === "hodPending")
    return expandRequestsByItem(
      requests.filter((request) => isItemStatus(request, "Pending HOD")),
      (item) => item.status === "Pending HOD"
    )
  if (mode === "hodHistory")
    return expandRequestsByItem(
      requests.filter(
        (request) =>
          isItemStatusIncludes(request, "HOD") &&
          !isItemStatus(request, "Pending HOD")
      ),
      (item) => item.status.includes("HOD") && item.status !== "Pending HOD"
    )
  if (mode === "hodAll") return expandRequestsByItem(requests)
  if (mode === "itQueue")
    return expandRequestsByItem(
      requests.filter((request) => isItemStatus(request, "Pending IT")),
      (item) => item.status === "Pending IT"
    )
  if (mode === "itActive")
    return expandRequestsByItem(
      requests.filter(
        (request) =>
          isItemStatus(request, "Access Granted") ||
          request.aggregateStatus === "Approved"
      ),
      (item) => item.status === "Access Granted"
    )
  return expandRequestsByItem(requests)
}

export function getSummaryCards(
  requests: AccessRequest[],
  employeeId: number
): SummaryCard[] {
  const userRequests = requests.filter(
    (request) => request.empId === employeeId
  )
  return [
    {
      label: "Total Requests",
      value: numberFormatter.format(userRequests.length),
      detail: "Across active access workflows",
    },
    {
      label: "Pending Reviews",
      value: numberFormatter.format(
        userRequests.filter((request) => request.aggregateStatus === "Pending")
          .length
      ),
      detail: "Waiting on HOD or IT",
    },
    {
      label: "Provisioned",
      value: numberFormatter.format(
        userRequests.filter((request) =>
          request.accessItems.some((item) => item.status === "Access Granted")
        ).length
      ),
      detail: "Access granted and logged",
    },
    {
      label: "Attention",
      value: numberFormatter.format(
        userRequests.filter((request) => request.aggregateStatus === "Rejected")
          .length
      ),
      detail: "Rejected or revoke action",
    },
  ]
}

export function getDefaultRoute(role: AppRole) {
  if (role === "Hod") return "/hod/pending-approvals"
  if (role === "Admin") return "/admin-dashboard"
  if (role === "Operator") return "/dashboard"
  return "/my-requests"
}
