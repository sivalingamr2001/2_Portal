import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"

import CommonTable from "./components/CommonTable"
import EditDepartmentModal from "./components/EditDepartmentModal"
import PageSection from "./components/PageSection"
import type { TableColumn } from "./types"

import { useDepartments } from "./hooks/useDepartments"
import type { Department } from "./types"

type DepartmentRow = Department

export default function DepartmentsPage() {
  const { departments, isLoading, error, refetch } = useDepartments()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [selected, setSelected] = useState<Department | null>(null)

  const columns = useMemo<TableColumn<DepartmentRow>[]>(() => {
    return [
      { key: "id", header: "Department ID", render: (row) => row.deptId },
      { key: "name", header: "Department", render: (row) => row.name },
      { key: "hod", header: "HOD Name", render: (row) => row.hodName },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setMode("edit")
              setSelected(row)
              setIsModalOpen(true)
            }}
          >
            Edit
          </Button>
        ),
      },
    ]
  }, [])

  const rows: DepartmentRow[] = departments

  return (
    <PageSection title="Departments" description="Department reference table.">
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <CommonTable
        columns={columns}
        getRowId={(row) => row.deptId}
        onRefresh={refetch}
        pageSize={5}
        rows={isLoading ? [] : rows}
        emptyMessage={
          isLoading ? "Loading..." : "No departments are available."
        }
        toolbarActions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setMode("create")
              setSelected(null)
              setIsModalOpen(true)
            }}
          >
            Add
          </Button>
        }
      />
      <EditDepartmentModal
        mode={mode}
        open={isModalOpen}
        department={selected}
        onClose={() => setIsModalOpen(false)}
        onSaved={refetch}
      />
    </PageSection>
  )
}
