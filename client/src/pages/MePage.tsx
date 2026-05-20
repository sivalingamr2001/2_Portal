import { useMemo } from "react"

import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

export default function MePage() {
  const { user } = useAuth()

  const userDetails = useMemo(
    () => [
      { label: "Full name", value: user?.name ?? "N/A" },
      { label: "Username", value: user?.userName ?? "N/A" },
      { label: "Email", value: user?.email ?? "N/A" },
      { label: "Phone", value: user?.phone ?? "N/A" },
      { label: "Department", value: user?.departmentName ?? "N/A" },
      { label: "Role", value: user?.role ?? "N/A" },
    ],
    [user]
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-6 md:px-8">
        <div className="rounded-[1.25rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">My Profile</p>
              <h1 className="mt-2 text-3xl font-semibold">Welcome back, {user?.name ?? "Team Member"}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh profile
              </Button>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This page shows your account details and primary role. Admin users can manage portal data from the admin dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {userDetails.map((item) => (
            <div key={item.label} className="rounded-[1rem] border border-border bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-lg font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {user?.role === "Admin" ? (
          <div className="rounded-[1rem] border border-border bg-card p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Admin access</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You can use the admin dashboard to review requests, manage teams, and monitor access activity.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
