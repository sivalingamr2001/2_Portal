import {
  IconBuilding,
  IconFolder,
  IconLayoutDashboard,
  IconFileText,
  IconShieldCheck,
  IconUsers,
  IconCheck,
  IconClock,
} from "@tabler/icons-react"

import type { NavigationSection } from "../types"

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    title: "User",
    items: [
      {
        label: "My Requests",
        to: "/my-requests",
        icon: IconFileText,
        roles: ["User"],
      },
    ],
  },
  {
    title: "HOD",
    items: [
      {
        label: "Pending Approvals",
        to: "/hod/pending-approvals",
        icon: IconCheck,
        roles: ["Hod"],
      },
      {
        label: "All Requests",
        to: "/hod/all-requests",
        icon: IconFileText,
        roles: ["Hod"],
      },
    ],
  },
  {
    title: "Operator",
    items: [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: IconLayoutDashboard,
        roles: ["Operator"],
      },
      {
        label: "Approval Queue",
        to: "/operator/approval-queue",
        icon: IconShieldCheck,
        roles: ["Operator"],
      },
      {
        label: "Active Access",
        to: "/operator/active-access",
        icon: IconClock,
        roles: ["Operator"],
      },
      {
        label: "All Requests",
        to: "/operator/all-requests",
        icon: IconFileText,
        roles: ["Operator"],
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        label: "Dashboard",
        to: "/admin-dashboard",
        icon: IconLayoutDashboard,
        roles: ["Admin"],
      },
      {
        label: "Employee",
        to: "/admin/employees",
        icon: IconUsers,
        roles: ["Admin"],
      },
      {
        label: "Departments",
        to: "/admin/departments",
        icon: IconBuilding,
        roles: ["Admin"],
      },
      {
        label: "Folder Mapping",
        to: "/admin/folder-mapping",
        icon: IconFolder,
        roles: ["Admin"],
      },
      {
        label: "Audit Logs",
        to: "/admin/audit-logs",
        icon: IconFileText,
        roles: ["Admin"],
      },
    ],
  },
]
