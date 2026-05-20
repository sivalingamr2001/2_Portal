import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import { getDefaultRoute } from "@/features/access-workspace/utils/accessSelectors"

import type { AppRole } from "@/features/access-workspace/types"

type RoleRouteProps = {
  allowedRoles: AppRole[]
}

function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()
  const validRoles: AppRole[] = ["User", "Hod", "Admin", "Operator"]
  const role = (user?.role && validRoles.includes(user.role as AppRole) ? user.role : "User") as AppRole

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }

  return <Outlet />
}

export default RoleRoute
