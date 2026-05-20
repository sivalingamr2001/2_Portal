import type { ReactNode } from "react"

type ReportFieldProps = {
  children?: ReactNode
  isMono?: boolean
  label: string
  value?: number | string
}

function ReportField({
  children,
  isMono = false,
  label,
  value,
}: ReportFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      {children ? (
        children
      ) : (
        <span
          className={`text-sm text-foreground ${isMono ? "font-mono" : ""}`}
        >
          {value || <span className="text-muted-foreground italic">N/A</span>}
        </span>
      )}
    </div>
  )
}

export default ReportField
