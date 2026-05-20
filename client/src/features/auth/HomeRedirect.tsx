import { Navigate } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"

function HomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Checking session...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return user.role === "Admin" ? (
    <Navigate to="/admin-dashboard" replace />
  ) : (
    <Navigate to="/me" replace />
  )
}

export default HomeRedirect
