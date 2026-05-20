import type { AppRole } from "@/features/access-workspace/types"
import { useAuth } from "@/context/AuthContext"

export function useApp() {
  const { user } = useAuth()
  const currentRole = (user?.role as AppRole) || "User"

  return {
    currentRole,
    currentUser: user,
  }
}
