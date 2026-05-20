import type { TablerIcon } from "@tabler/icons-react"

type ReportSectionHeadingProps = {
  icon: TablerIcon
  label: string
}

function ReportSectionHeading({
  icon: Icon,
  label,
}: ReportSectionHeadingProps) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-lg">
        <Icon size={18} />
      </span>
      <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </h3>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

export default ReportSectionHeading
