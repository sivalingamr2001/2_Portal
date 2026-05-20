import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "@/features/admin/api"
import {
  AdminPageShell,
  DataTable,
  EntityDialog,
  Field,
  RoleSelect,
  Toolbar,
} from "@/features/admin/components"
import type { AdminRole, AdminUserRecord } from "@/features/admin/types"

type EmployeeFormState = {
  identifier: string
  userRole: AdminRole
  location: string
}

const EMPTY_FORM: EmployeeFormState = {
  identifier: "",
  userRole: "User",
  location: "",
}

export default function AdminEmployeesPage() {
  const [rows, setRows] = useState<AdminUserRecord[]>([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<AdminUserRecord | null>(null)
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM)

  const loadEmployees = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminUsers({
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      })
      setRows(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load employees.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [search, roleFilter])

  const columns = useMemo(() => [
    {
      key: "employee",
      header: "Employee",
      render: (row: AdminUserRecord) => (
        <div className="space-y-1">
          <div className="font-medium">{row.userName}</div>
          <div className="text-xs text-muted-foreground">
            {row.employeeId || "No employee ID"} | {row.userId}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row: AdminUserRecord) => (
        <div className="space-y-1">
          <div>{row.email || "No email"}</div>
          <div className="text-xs text-muted-foreground">{row.mobile || "No phone"}</div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (row: AdminUserRecord) => row.departmentName || "Unassigned",
    },
    {
      key: "role",
      header: "Role",
      render: (row: AdminUserRecord) => <Badge variant="outline">{row.userRole}</Badge>,
    },
    {
      key: "location",
      header: "Location",
      render: (row: AdminUserRecord) => row.location || "Not set",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: AdminUserRecord) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingRow(row)
            setForm({
              identifier: row.employeeId || String(row.userId),
              userRole: row.userRole,
              location: row.location ?? "",
            })
            setDialogOpen(true)
          }}
        >
          Manage
        </Button>
      ),
    },
  ], [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      if (editingRow) {
        await updateAdminUser(editingRow.userId, {
          userRole: form.userRole,
          location: form.location,
        })
        toast.success("Employee updated.")
      } else {
        await createAdminUser(form)
        toast.success("Employee created.")
      }
      setDialogOpen(false)
      setEditingRow(null)
      setForm(EMPTY_FORM)
      await loadEmployees()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save employee.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingRow) return
    setIsSubmitting(true)
    try {
      await deleteAdminUser(editingRow.userId)
      toast.success("Employee deleted.")
      setDialogOpen(false)
      setEditingRow(null)
      setForm(EMPTY_FORM)
      await loadEmployees()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete employee.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminPageShell
      title="Admin Employees"
      description="Create, update, and remove employee access records that participate in the portal workflow."
      actions={
        <Button
          onClick={() => {
            setEditingRow(null)
            setForm(EMPTY_FORM)
            setDialogOpen(true)
          }}
        >
          Add Employee
        </Button>
      }
    >
      <Toolbar
        searchValue={search}
        onSearchChange={setSearch}
        filter={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={["all", "Admin", "Operator", "Hod", "User"]}
        action={<Button variant="outline" onClick={() => void loadEmployees()}>Refresh</Button>}
      />
      <DataTable
        columns={columns}
        rows={isLoading ? [] : rows}
        emptyMessage={isLoading ? "Loading employees..." : "No employees found."}
      />

      <EntityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingRow ? "Manage Employee" : "Create Employee"}
        description="Use a user ID, employee ID, username, or email to connect an employee from the CMPL source."
        onSubmit={handleSubmit}
        onDelete={editingRow ? handleDelete : undefined}
        submitLabel={editingRow ? "Save Changes" : "Create Employee"}
        deleteLabel="Delete Employee"
        isSubmitting={isSubmitting}
      >
        <Field label="Identifier">
          <Input
            value={form.identifier}
            disabled={Boolean(editingRow)}
            onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
            placeholder="Employee ID, user ID, email, or username"
          />
        </Field>
        <Field label="Role">
          <RoleSelect
            value={form.userRole}
            onChange={(nextRole) => setForm((current) => ({ ...current, userRole: nextRole }))}
          />
        </Field>
        <Field label="Location">
          <Input
            value={form.location}
            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            placeholder="Optional location"
          />
        </Field>
      </EntityDialog>
    </AdminPageShell>
  )
}
