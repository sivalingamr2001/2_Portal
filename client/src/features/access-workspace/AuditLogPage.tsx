import { useEffect, useState } from "react"

import CommonTable from "./components/CommonTable"
import PageSection from "./components/PageSection"
import { auditColumns } from "./utils/tableColumns"
import { fetchAuditLogs } from "./utils/requestApi"
import type { AuditLogItem } from "./types"

function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [totalCount, setTotalCount] = useState(0)
  const [rows, setRows] = useState<AuditLogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    void (async () => {
      try {
        const response = await fetchAuditLogs(page, pageSize)
        setRows(response.data)
        setTotalCount(response.totalCount)
        setError(null)
      } catch (e) {
        setRows([])
        setTotalCount(0)
        setError(e instanceof Error ? e.message : "Unable to load audit logs.")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [page, pageSize, reloadKey])

  return (
    <PageSection
      title="Audit Log"
      description="IT audit trail for approvals, provisioning, and request changes."
    >
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <CommonTable
        columns={auditColumns}
        getRowId={(row) => row.auditId}
        isLoading={isLoading}
        onRefresh={() => setReloadKey((value) => value + 1)}
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
        rows={isLoading ? [] : rows}
        emptyMessage={
          isLoading ? "Loading..." : "No audit entries are available."
        }
      />
    </PageSection>
  )
}

export default AuditLogPage
