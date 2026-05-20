import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getAuditLogs } from "@/features/admin/api"
import { AdminPageShell, DataTable, Toolbar } from "@/features/admin/components"
import type { AuditLogRecord } from "@/features/admin/types"

const ENTITY_OPTIONS = ["all", "Users", "Department", "FolderMapping", "AccessRequest", "AuditLog"]

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditLogRecord[]>([])
  const [search, setSearch] = useState("")
  const [entityName, setEntityName] = useState("all")
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadAuditLogs = async () => {
    setIsLoading(true)
    try {
      const response = await getAuditLogs({
        pageNumber,
        pageSize,
        entityName: entityName === "all" ? undefined : entityName,
      })
      setRows(response.data)
      setTotalCount(response.totalCount)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load audit logs.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAuditLogs()
  }, [entityName, pageNumber, pageSize])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    return rows.filter((row) =>
      `${row.entityName} ${row.action} ${row.performedBy} ${row.correlationId ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [rows, search])

  const columns = useMemo(() => [
    {
      key: "entity",
      header: "Entity",
      render: (row: AuditLogRecord) => (
        <div className="space-y-1">
          <div className="font-medium">{row.entityName}</div>
          <div className="text-xs text-muted-foreground">ID: {row.entityId}</div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row: AuditLogRecord) => <Badge variant="outline">{row.action}</Badge>,
    },
    {
      key: "actor",
      header: "Performed By",
      render: (row: AuditLogRecord) => row.performedBy,
    },
    {
      key: "time",
      header: "Timestamp",
      render: (row: AuditLogRecord) => new Date(row.performedAt).toLocaleString(),
    },
    {
      key: "correlation",
      header: "Correlation ID",
      render: (row: AuditLogRecord) => row.correlationId || "-",
    },
  ], [])

  return (
    <AdminPageShell
      title="Admin Audit Logs"
      description="Review the immutable audit trail for admin-managed records and workflow activity."
      actions={<Button variant="outline" onClick={() => void loadAuditLogs()}>Refresh</Button>}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Toolbar searchValue={search} onSearchChange={setSearch} />
        <div className="flex items-center gap-3">
          <Select value={entityName} onValueChange={(value) => {
            setEntityName(value)
            setPageNumber(1)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All Entities" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(value) => {
            setPageSize(Number(value))
            setPageNumber(1)
          }}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={isLoading ? [] : filteredRows}
        emptyMessage={isLoading ? "Loading audit logs..." : "No audit logs found."}
      />
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
        <div className="text-muted-foreground">
          Showing page {pageNumber} of {Math.max(1, Math.ceil(totalCount / pageSize))} with {totalCount} total entries.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((current) => current - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pageNumber >= Math.max(1, Math.ceil(totalCount / pageSize))}
            onClick={() => setPageNumber((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </AdminPageShell>
  )
}
