import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  IconMinus,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconLoader,
} from "@tabler/icons-react"

import CommonTablePagination from "./CommonTablePagination"
import type { TableColumn } from "../types"

type ServerPagination = {
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  page: number
  pageSize: number | undefined
  totalCount: number
}

type CommonTableProps<T> = {
  columns: TableColumn<T>[]
  emptyMessage: string
  getRowId?: (row: T, index: number) => string | number
  isLoading?: boolean
  onRefresh?: () => void
  onSearchChange?: (searchTerm: string) => void
  pageSize?: number
  pagination?: ServerPagination
  searchPlaceholder?: string
  toolbarActions?: React.ReactNode
  renderExpandedRow?: (row: T) => React.ReactNode
  rows: T[]
  showSno?: boolean // 👈 Feature flag to toggle S.No display dynamically
}

function CommonTable<T>({
  columns,
  emptyMessage,
  getRowId,
  isLoading = false,
  onRefresh,
  onSearchChange,
  pageSize = 10,
  pagination,
  searchPlaceholder = "Search",
  toolbarActions,
  renderExpandedRow,
  rows,
  showSno = true, // 👈 Enabled by default
}: CommonTableProps<T>) {
  const isServerPaginated = Boolean(pagination)
  const [currentPage, setCurrentPage] = useState(pagination?.page ?? 1)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(
    null
  )

  useEffect(() => {
    if (!isServerPaginated) {
      setCurrentPage(1)
    }
    setExpandedRowId(null)
  }, [isServerPaginated, rows])

  useEffect(() => {
    if (isServerPaginated && pagination) {
      setCurrentPage(pagination.page)
    }
  }, [isServerPaginated, pagination?.page])

  const resolvedPageSize = pagination?.pageSize ?? pageSize
  const filteredRows = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()
    if (!normalizedSearchTerm) {
      return rows
    }

    return rows.filter((row) => {
      try {
        return JSON.stringify(row).toLowerCase().includes(normalizedSearchTerm)
      } catch {
        return false
      }
    })
  }, [rows, searchTerm])

  const visibleRows = useMemo(() => {
    if (isServerPaginated) {
      return filteredRows
    }

    const startIndex = (currentPage - 1) * resolvedPageSize
    return filteredRows.slice(startIndex, startIndex + resolvedPageSize)
  }, [currentPage, filteredRows, isServerPaginated, resolvedPageSize])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / resolvedPageSize)
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (pagination) {
      pagination.onPageChange(page)
    }
  }

  const hasRows = filteredRows.length > 0

  return (
    <div className="space-y-4">
      {/* Toolbar & Search Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search table"
            className="rounded-2xl max-w-[20rem] border-input/80 bg-background pr-4 pl-10 text-sm shadow-sm placeholder:text-muted-foreground/80"
            onChange={(event) => {
              const value = event.target.value
              setSearchTerm(value)
              setCurrentPage(1)
              if (onSearchChange) {
                onSearchChange(value)
              }
            }}
            placeholder={searchPlaceholder}
            value={searchTerm}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {toolbarActions}
          {onRefresh ? (
            <Button size="sm" type="button" variant="outline" onClick={onRefresh}>
              <IconRefresh className="mr-2 size-4" />
              Refresh
            </Button>
          ) : null}
        </div>
      </div>

      {/* Mobile Responsive Layout View */}
      <div className="relative space-y-4 md:hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[0.6rem] bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <IconLoader className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
        {hasRows ? (
          visibleRows.map((row, index) => {
            const rowId = getRowId?.(row, index) ?? index
            const isExpanded = expandedRowId === rowId
            const isExpandable = Boolean(renderExpandedRow)

            // Calculate the absolute sequential number across mobile item cards
            const currentSno = (currentPage - 1) * resolvedPageSize + index + 1

            return (
              <div key={rowId} className="rounded-[0.6rem] border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-4">
                    {/* Inject S.No field into Mobile stack view */}
                    {showSno && (
                      <div>
                        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                          S.No
                        </p>
                        <div className="mt-1 text-sm tabular-nums font-medium text-muted-foreground">
                          {currentSno}
                        </div>
                      </div>
                    )}
                    
                    {columns.map((column) => (
                      <div key={column.key}>
                        <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                          {column.header}
                        </p>
                        <div className="mt-1 text-sm">
                          {column.render(row, index)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {isExpandable ? (
                    <Button
                      aria-expanded={isExpanded}
                      size="icon-xs"
                      type="button"
                      variant="outline"
                      onClick={() => setExpandedRowId(isExpanded ? null : rowId)}
                      className="self-start"
                    >
                      {isExpanded ? <IconMinus className="size-3.5" /> : <IconPlus className="size-3.5" />}
                    </Button>
                  ) : null}
                </div>
                {isExpanded && renderExpandedRow ? (
                  <div className="mt-4 rounded-xl border border-border bg-card p-4">
                    {renderExpandedRow(row)}
                  </div>
                ) : null}
              </div>
            )
          })
        ) : (
          <div className="rounded-[0.6rem] border border-border bg-background p-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Desktop Structural Layout View */}
      <div className="relative hidden overflow-hidden rounded-[0.4rem] border border-border md:block">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[0.4rem] bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <IconLoader className="size-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted text-left text-xs tracking-[0.18em] text-muted-foreground uppercase">
              <tr>
                {renderExpandedRow ? <th className="w-12 px-3 py-3" /> : null}
                {/* 1. Header Insertion */}
                {showSno && <th className="w-16 px-4 py-3">S.No</th>}
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {hasRows ? (
                visibleRows.map((row, index) => {
                  const rowId = getRowId?.(row, index) ?? index
                  
                  // 2. Continuous Row Number Calculation
                  const currentSno = (currentPage - 1) * resolvedPageSize + index + 1
                  
                  return (
                    <tr key={rowId} className="hover:bg-muted/30 transition-colors">
                      {renderExpandedRow && (
                        <td className="px-3 py-3 text-center">
                          {/* Expanded toggle button placeholder matching setup */}
                        </td>
                      )}
                      
                      {/* 3. Row Cell Insertion */}
                      {showSno && (
                        <td className="px-4 py-3 text-muted-foreground font-medium text-xs tabular-nums">
                          {currentSno}
                        </td>
                      )}

                      {columns.map((column) => (
                        <td key={column.key} className="px-4 py-3">
                          {column.render(row, index)}
                        </td>
                      ))}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td 
                    colSpan={columns.length + (showSno ? 1 : 0) + (renderExpandedRow ? 1 : 0)} 
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls Hook placement */}
      {hasRows && (
        <CommonTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pagination?.pageSize ?? pageSize}
          totalCount={pagination?.totalCount ?? rows.length}
          onPageSizeChange={pagination?.onPageSizeChange}
        />
      )}
    </div>
  )
}

export default CommonTable;