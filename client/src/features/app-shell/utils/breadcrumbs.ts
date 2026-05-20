const LABEL_MAP: Record<string, string> = {
  approvals: "Approvals",
  dashboard: "Dashboard",
  hod: "HOD Review",
  it: "IT Review",
  new: "Create Request",
  notifications: "Notifications",
  renewals: "Renewals",
  requests: "Access Requests",
  revocations: "Revocations",
}

export function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  return segments.map((segment, index) => ({
    label: LABEL_MAP[segment] ?? segment.toUpperCase(),
    to: `/${segments.slice(0, index + 1).join("/")}`,
  }))
}
