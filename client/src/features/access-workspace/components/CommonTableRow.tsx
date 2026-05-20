import { Button } from "@/components/ui/button"
import { IconMinus, IconPlus } from "@tabler/icons-react"

import type { TableColumn } from "../types"

type CommonTableRowProps<T> = {
  columns: TableColumn<T>[]
  isExpanded: boolean
  isExpandable: boolean
  onToggle: () => void
  renderExpandedRow?: (row: T) => React.ReactNode
  row: T
}

function CommonTableRow<T>({
  columns,
  isExpanded,
  isExpandable,
  onToggle,
  renderExpandedRow,
  row,
}: CommonTableRowProps<T>) {
  return (
    <>
      <tr>
        {renderExpandedRow ? (
          <td className="w-12 px-3 py-4 align-top">
            {isExpandable ? (
              <Button
                aria-expanded={isExpanded}
                size="icon-xs"
                type="button"
                variant="outline"
                onClick={onToggle}
              >
                {isExpanded ? (
                  <IconMinus className="size-3.5" />
                ) : (
                  <IconPlus className="size-3.5" />
                )}
              </Button>
            ) : null}
          </td>
        ) : null}
        {columns.map((column, index) => (
          <td key={column.key} className="px-4 py-4 align-top">
            {column.render(row, index)}
          </td>
        ))}
      </tr>
      {isExpanded && renderExpandedRow ? (
        <tr>
          <td
            className="border-t border-border bg-card/40 px-4 py-4"
            colSpan={columns.length + 1}
          >
            {renderExpandedRow(row)}
          </td>
        </tr>
      ) : null}
    </>
  )
}

export default CommonTableRow
