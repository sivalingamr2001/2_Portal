import type { ReactNode } from "react"

type ReportBadgeProps = {
  children: ReactNode
  tone?:
    | "default"
    | "destructive"
    | "readonly"
    | "readwrite"
    | "success"
    | "warning"
}

const TONE_CLASS = {
  default: "border-border bg-card text-foreground",
  destructive: "border-destructive bg-destructive/10 text-destructive",
  readonly: "border-border bg-muted text-muted-foreground",
  readwrite: "border-primary bg-primary text-primary-foreground",
  success: "border-primary bg-primary text-primary-foreground",
  warning: "border-secondary bg-secondary text-secondary-foreground",
} as const

function ReportBadge({ children, tone = "default" }: ReportBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  )
}

export default ReportBadge
