import { useAuth } from "@/context/AuthContext"

import PageSection from "./components/PageSection"

function ProfilePage() {
  const { user } = useAuth()

  return (
    <PageSection
      title="Profile"
      description="Authenticated user details from the login session."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["Employee ID", user?.employeeId],
          ["Name", user?.name],
          ["Email", user?.email],
          ["Role", user?.role],
          ["Department", user?.departmentName],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.2rem] border border-border bg-card p-4"
          >
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-2 font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export default ProfilePage
