import { createBrowserRouter } from "react-router-dom"

import {
  HomeRedirect,
  LoginPage,
  ProtectedRoute,
  RoleRoute,
} from "@/features/auth"
import { AppLayout } from "@/layouts"
import AdminDashboardPage from "@/pages/AdminDashboardPage"
import AdminEmployeesPage from "@/pages/AdminEmployeesPage"
import AdminDepartmentsPage from "@/pages/AdminDepartmentsPage"
import AdminFolderMappingPage from "@/pages/AdminFolderMappingPage"
import AdminAuditLogsPage from "@/pages/AdminAuditLogsPage"
import UnauthorizedPage from "@/pages/UnauthorizedPage"
import MePage from "@/pages/MePage"

export const router = createBrowserRouter(
  [
    { path: "/login", element: <LoginPage /> },
    {
      path: "/",
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { index: true, element: <HomeRedirect /> },
            { path: "me", element: <MePage /> },
            {
              path: "admin-dashboard",
              element: <RoleRoute allowedRoles={["Admin"]} />,
              children: [{ index: true, element: <AdminDashboardPage /> }],
            },
            {
              path: "admin",
              element: <RoleRoute allowedRoles={["Admin"]} />,
              children: [
                { path: "employees", element: <AdminEmployeesPage /> },
                { path: "departments", element: <AdminDepartmentsPage /> },
                { path: "folder-mapping", element: <AdminFolderMappingPage /> },
                { path: "audit-logs", element: <AdminAuditLogsPage /> },
              ],
            },
            { path: "unauthorized", element: <UnauthorizedPage /> },
          ],
        },
      ],
    },
  ],
  {
    basename: "/access-portal",
  }
)
