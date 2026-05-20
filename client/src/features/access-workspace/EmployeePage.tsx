import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useDebounce } from "@/lib/utils"

import CommonTable from "./components/CommonTable"
import CreateEmployeeModal from "./components/CreateEmployeeModal"
import EditEmployeeModal from "./components/EditEmployeeModal"
import ResetPasswordModal from "./components/ResetPasswordModal"
import PageSection from "./components/PageSection"
import { employeeColumns } from "./utils/tableColumns"
import { fetchAllUsers, searchEmployees } from "./utils/requestApi"
import type { EmployeeRecord, TableColumn } from "./types"
import { IconEditFilled } from "@tabler/icons-react"

function EmployeePage() {
  const { user, setSessionUser } = useAuth()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalCount, setTotalCount] = useState(0)
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  )
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const debouncedSearch = useDebounce(searchInput, 500)

  const columns = useMemo<TableColumn<EmployeeRecord>[]>(() => {
    return [
      ...employeeColumns,
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedEmployeeId(row.employeeId)
                setSelectedUserId(row.userId)
                setIsEditOpen(true)
              }}
            >
              <IconEditFilled className="size-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedEmployeeId(row.employeeId)
                setSelectedUserId(row.userId)
                setIsPasswordOpen(true)
              }}
            >
              Reset Password
            </Button>
          </div>
        ),
      },
    ]
  }, [])

  useEffect(() => {
    setIsLoading(true)
    void (async () => {
      try {
        const response: any = debouncedSearch
          ? await searchEmployees(debouncedSearch, page, pageSize)
          : await fetchAllUsers(page, pageSize)
        if (!debouncedSearch) {
          setEmployees(response.data)
          setTotalCount(response.totalCount)
          setError(null)
          setPageSize(response.pageSize)
        } else {
          setEmployees(response)
          setError(null)
          setPageSize(5)
        }
      } catch (e) {
        setEmployees([])
        setTotalCount(0)
        setError(e instanceof Error ? e.message : "Unable to load employees.")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [page, pageSize, debouncedSearch, reloadKey])

  return (
    <PageSection
      title="Employee"
      description="IT can review employees and roles tied to the access request workflow."
    >
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <CommonTable
        columns={columns}
        getRowId={(row) => row.employeeId}
        isLoading={isLoading}
        onRefresh={() => setReloadKey((value) => value + 1)}
        onSearchChange={(term) => {
          setSearchInput(term)
          setPage(1)
        }}
        pagination={{
          page,
          pageSize,
          totalCount,
          onPageChange: setPage,
          onPageSizeChange: (newSize) => {
            setPageSize(newSize)
            setPage(1)
          },
        }}
        rows={isLoading ? [] : employees}
        emptyMessage={
          isLoading ? "Loading..." : "No employee records are available."
        }
        toolbarActions={
          <Button type="button" size="sm" onClick={() => setIsCreateOpen(true)}>
            Create User
          </Button>
        }
      />
      <EditEmployeeModal
        employeeId={selectedEmployeeId}
        userId={selectedUserId}
        employees={employees}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={(updated) => {
          if (updated?.employeeId && updated.employeeId === user?.employeeId) {
            setSessionUser(updated)
          }
          setReloadKey((value) => value + 1)
        }}
      />
      <CreateEmployeeModal
        employees={employees}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => setReloadKey((value) => value + 1)}
      />
      <ResetPasswordModal
        employeeId={selectedEmployeeId}
        open={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        onSaved={() => setReloadKey((value) => value + 1)}
      />
    </PageSection>
  )
}

export default EmployeePage
