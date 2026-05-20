import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"

type TextUserRole = "User" | "Hod" | "Admin" | "Operator"

type RoleRouteProps = {
  allowedRoles: TextUserRole[]
}

function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()
  const role = (user?.role as TextUserRole) || "User"

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default RoleRoute
