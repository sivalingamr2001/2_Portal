import { useAuth } from "@/context/AuthContext"

export function useApp() {
  const { user } = useAuth()
  const currentRole = (user?.role as "User" | "Hod" | "Operator" | "Admin") || "User"

  return {
    currentRole,
    currentUser: user,
  }
}
