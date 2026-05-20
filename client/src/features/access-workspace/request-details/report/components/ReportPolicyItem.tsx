type ReportPolicyItemProps = {
  body: string
  index: number
}

function ReportPolicyItem({ body, index }: ReportPolicyItemProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card/60 p-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[10px] font-bold text-muted-foreground">
        {index}
      </div>
      <p className="text-xs text-foreground">{body}</p>
    </div>
  )
}

export default ReportPolicyItem
