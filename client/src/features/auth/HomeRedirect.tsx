import { Navigate } from "react-router-dom"

import type { AppRole } from "@/features/access-workspace/types"
import { useAuth } from "@/context/AuthContext"
import { getDefaultRoute } from "@/features/access-workspace/utils/accessSelectors"

function HomeRedirect() {
  const { user } = useAuth()
  const role = (user?.role as AppRole) || "User"

  return <Navigate to={getDefaultRoute(role)} replace />
}

export default HomeRedirect
