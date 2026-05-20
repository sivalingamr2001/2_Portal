import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Activity } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getAdminUsers, getAuditLogs, getDepartments, getFolderMappings } from "@/features/admin/api"

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({
    users: 0,
    departments: 0,
    folderMappings: 0,
    auditLogs: 0,
  })

  const loadSummary = async () => {
    try {
      const [users, departments, folderMappings, auditLogs] = await Promise.all([
        getAdminUsers(),
        getDepartments(),
        getFolderMappings(),
        getAuditLogs({ pageNumber: 1, pageSize: 1 }),
      ])

      setSummary({
        users: users.length,
        departments: departments.length,
        folderMappings: folderMappings.length,
        auditLogs: auditLogs.totalCount,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard summary.")
    }
  }

  useEffect(() => {
    void loadSummary()
  }, [])

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-primary">Admin Portal</p>
              <div className="mt-2 flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Monitor the health of the admin-managed data that powers the access portal.
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => void loadSummary()}>
              Refresh view
            </Button>
          </CardHeader>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Employees", value: summary.users },
            { label: "Departments", value: summary.departments },
            { label: "Folder Mappings", value: summary.folderMappings },
            { label: "Audit Events", value: summary.auditLogs },
          ].map((item) => (
            <Card key={item.label} className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  )
}
