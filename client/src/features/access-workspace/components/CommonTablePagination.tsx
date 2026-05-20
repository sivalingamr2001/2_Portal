import { Button } from "@/components/ui/button"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CommonTablePaginationProps = {
  currentPage: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSize?: number
  totalCount?: number
  totalPages: number
}

function CommonTablePagination({
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSize = 10,
  totalCount = 0,
  totalPages,
}: CommonTablePaginationProps) {
  const canGoNext = currentPage < totalPages
  const canGoPrevious = currentPage > 1

  // Generate smart page buttons: show first, last, and nearby pages
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxButtons = 5
    const halfWindow = Math.floor(maxButtons / 2)

    let start = Math.max(1, currentPage - halfWindow)
    let end = Math.min(totalPages, start + maxButtons - 1)

    // Adjust start if we're near the end
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1)
    }

    // Add first page
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push("...")
    }

    // Add range of pages around current
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add last page
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()
  const startRecord = (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-card px-4 py-3 sm:flex-row">
      <div className="text-xs text-muted-foreground">
        {totalCount > 0 ? (
          <>
            Showing <span className="font-semibold">{startRecord}</span> to{" "}
            <span className="font-semibold">{endRecord}</span> of{" "}
            <span className="font-semibold">{totalCount}</span> results
          </>
        ) : (
          "No results"
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="page-size"
              className="text-xs text-muted-foreground"
            >
              Rows per page:
            </label>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                onPageSizeChange(parseInt(value))
                onPageChange(1) // Reset to first page on size change
              }}
            >
              <SelectTrigger id="page-size" className="h-8 w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button
            disabled={!canGoPrevious}
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={() => onPageChange(1)}
            title="First page"
          >
            <IconChevronsLeft className="size-4" />
          </Button>
          <Button
            disabled={!canGoPrevious}
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous page"
          >
            <IconChevronLeft className="size-4" />
          </Button>

          {pageNumbers.map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            ) : (
              <Button
                key={page}
                size="icon-sm"
                type="button"
                variant={page === currentPage ? "outline" : "ghost"}
                onClick={() => onPageChange(page as number)}
                className="min-w-8"
              >
                {page}
              </Button>
            )
          )}

          <Button
            disabled={!canGoNext}
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={() => onPageChange(currentPage + 1)}
            title="Next page"
          >
            <IconChevronRight className="size-4" />
          </Button>
          <Button
            disabled={!canGoNext}
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={() => onPageChange(totalPages)}
            title="Last page"
          >
            <IconChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CommonTablePagination
