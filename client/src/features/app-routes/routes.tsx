import { createBrowserRouter } from "react-router-dom"

import AdminDashboardPage from "@/features/access-workspace/AdminDashboardPage"
import AuditLogPage from "@/features/access-workspace/AuditLogPage"
import DashboardPage from "@/features/access-workspace/MyRequestPage"
import DepartmentsPage from "@/features/access-workspace/DepartmentsPage"
import EmployeePage from "@/features/access-workspace/EmployeePage"
import FolderMappingPage from "@/features/access-workspace/FolderMappingPage"
import ProfilePage from "@/features/access-workspace/ProfilePage"
import RequestCreatePage from "@/features/access-workspace/RequestCreatePage"
import RequestDetailsPage from "@/features/access-workspace/RequestDetailsPage"
import RequestListPage from "@/features/access-workspace/RequestListPage"
import ReviewQueuePage from "@/features/access-workspace/ReviewQueuePage"
import {
  HomeRedirect,
  LoginPage,
  ProtectedRoute,
  RoleRoute,
} from "@/features/auth"
import { AppLayout } from "@/layouts"
import RegisterPage from "../auth/RegisterPage"
import CreateRequestModal from "../access-workspace/components/CreateRequestModal"

export const router = createBrowserRouter(
  [
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
      path: "/",
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            { index: true, element: <HomeRedirect /> },
            { path: "profile", element: <ProfilePage /> },
            {
              element: <RoleRoute allowedRoles={["User"]} />,
              children: [
                { path: "my-requests", element: <DashboardPage /> },
                { path: "requests/new", element: <RequestCreatePage /> },
                { path: "requests/create", element: <CreateRequestModal isOpen={false} onClose={function (): void {
                  throw new Error("Function not implemented.")
                } }/>}
              ],
            },
            {
              element: <RoleRoute allowedRoles={["Hod"]} />,
              children: [
                {
                  path: "hod/pending-approvals",
                  element: (
                    <ReviewQueuePage
                      title="Pending Approvals"
                      description="Requests currently waiting on HOD approval."
                      mode="hodPending"
                    />
                  ),
                },
                {
                  path: "hod/all-requests",
                  element: (
                    <RequestListPage
                      title="All Requests"
                      description="All request details visible to the HOD workspace."
                      mode="hodAll"
                    />
                  ),
                },
              ],
            },
            {
              element: <RoleRoute allowedRoles={["Operator"]} />,
              children: [
                { path: "dashboard", element: <AdminDashboardPage /> },
                {
                  path: "operator/approval-queue",
                  element: (
                    <ReviewQueuePage
                      title="Approval Queue"
                      description="Requests waiting in the operator queue."
                      mode="itQueue"
                    />
                  ),
                },
                {
                  path: "operator/active-access",
                  element: (
                    <ReviewQueuePage
                      title="Active Access"
                      description="Provisioned and approved access currently active."
                      mode="itActive"
                    />
                  ),
                },
                {
                  path: "operator/all-requests",
                  element: (
                    <RequestListPage
                      title="All Requests"
                      description="All request details available to the operator workspace."
                      mode="itAll"
                    />
                  ),
                },
              ],
            },
            {
              element: <RoleRoute allowedRoles={["Admin"]} />,
              children: [
                { path: "admin-dashboard", element: <AdminDashboardPage /> },
                { path: "admin/employees", element: <EmployeePage /> },
                { path: "admin/departments", element: <DepartmentsPage /> },
                { path: "admin/folder-mapping", element: <FolderMappingPage /> },
                { path: "admin/audit-logs", element: <AuditLogPage /> },
              ],
            },
            { path: "requests/:requestId", element: <RequestDetailsPage /> },
            {
              path: "requests/:requestId/items/:itemId",
              element: <RequestDetailsPage />,
            },
          ],
        },
      ],
    },
  ],
  {
    basename: "/access-portal",
  }
)
