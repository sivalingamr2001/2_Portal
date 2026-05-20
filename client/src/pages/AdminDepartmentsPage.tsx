import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  getHods,
  updateDepartment,
} from "@/features/admin/api"
import { AdminPageShell, DataTable, EntityDialog, Field, Toolbar } from "@/features/admin/components"
import type { DepartmentRecord, HodRecord } from "@/features/admin/types"

type DepartmentFormState = {
  deptId: string
  deptName: string
  hodUserId: string
}

const EMPTY_FORM: DepartmentFormState = {
  deptId: "",
  deptName: "",
  hodUserId: "none",
}

export default function AdminDepartmentsPage() {
  const [rows, setRows] = useState<DepartmentRecord[]>([])
  const [hods, setHods] = useState<HodRecord[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<DepartmentRecord | null>(null)
  const [form, setForm] = useState<DepartmentFormState>(EMPTY_FORM)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [departments, hodOptions] = await Promise.all([getDepartments(), getHods()])
      setRows(departments)
      setHods(hodOptions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load departments.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    return rows.filter((row) =>
      `${row.deptId} ${row.deptName} ${row.hod?.name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [rows, search])

  const columns = useMemo(() => [
    {
      key: "deptId",
      header: "Department ID",
      render: (row: DepartmentRecord) => row.deptId,
    },
    {
      key: "deptName",
      header: "Name",
      render: (row: DepartmentRecord) => row.deptName,
    },
    {
      key: "hod",
      header: "Department HOD",
      render: (row: DepartmentRecord) =>
        row.hod ? (
          <div className="space-y-1">
            <div className="font-medium">{row.hod.name}</div>
            <div className="text-xs text-muted-foreground">{row.hod.email}</div>
          </div>
        ) : (
          <Badge variant="outline">No HOD</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: DepartmentRecord) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingRow(row)
            setForm({
              deptId: String(row.deptId),
              deptName: row.deptName,
              hodUserId: row.hodUserId ? String(row.hodUserId) : "none",
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
      const payload = {
        deptId: form.deptId ? Number(form.deptId) : undefined,
        deptName: form.deptName,
        hodUserId: form.hodUserId === "none" ? null : Number(form.hodUserId),
      }

      if (editingRow) {
        await updateDepartment(editingRow.deptId, payload)
        toast.success("Department updated.")
      } else {
        await createDepartment(payload)
        toast.success("Department created.")
      }

      setDialogOpen(false)
      setEditingRow(null)
      setForm(EMPTY_FORM)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save department.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingRow) return
    setIsSubmitting(true)
    try {
      await deleteDepartment(editingRow.deptId)
      toast.success("Department deleted.")
      setDialogOpen(false)
      setEditingRow(null)
      setForm(EMPTY_FORM)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete department.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminPageShell
      title="Admin Departments"
      description="Maintain the department list and assign department HOD ownership."
      actions={
        <Button
          onClick={() => {
            setEditingRow(null)
            setForm(EMPTY_FORM)
            setDialogOpen(true)
          }}
        >
          Add Department
        </Button>
      }
    >
      <Toolbar
        searchValue={search}
        onSearchChange={setSearch}
        action={<Button variant="outline" onClick={() => void loadData()}>Refresh</Button>}
      />
      <DataTable
        columns={columns}
        rows={isLoading ? [] : filteredRows}
        emptyMessage={isLoading ? "Loading departments..." : "No departments found."}
      />

      <EntityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingRow ? "Manage Department" : "Create Department"}
        description="Department IDs should match your upstream directory when you want to align employee records automatically."
        onSubmit={handleSubmit}
        onDelete={editingRow ? handleDelete : undefined}
        submitLabel={editingRow ? "Save Changes" : "Create Department"}
        deleteLabel="Delete Department"
        isSubmitting={isSubmitting}
      >
        <Field label="Department ID">
          <Input
            value={form.deptId}
            disabled={Boolean(editingRow)}
            onChange={(event) => setForm((current) => ({ ...current, deptId: event.target.value }))}
            placeholder="Department ID"
          />
        </Field>
        <Field label="Department Name">
          <Input
            value={form.deptName}
            onChange={(event) => setForm((current) => ({ ...current, deptName: event.target.value }))}
            placeholder="Department name"
          />
        </Field>
        <Field label="Department HOD">
          <Select
            value={form.hodUserId}
            onValueChange={(value) => setForm((current) => ({ ...current, hodUserId: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a HOD" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {hods.map((hod) => (
                <SelectItem key={hod.userId} value={String(hod.userId)}>
                  {hod.name} ({hod.employeeId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </EntityDialog>
    </AdminPageShell>
  )
}
