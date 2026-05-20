import type { AccessRequestTimeline } from "../../types"
import {
  formatRequestDateTime,
  getUniqueTimelineEntries,
} from "../utils/requestDetails"

type TimelineSectionProps = {
  timeline: AccessRequestTimeline[]
}

function TimelineSection({ timeline }: TimelineSectionProps) {
  const uniqueTimeline = getUniqueTimelineEntries(timeline)

  return (
    <aside className="rounded-[0.9rem] border border-border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Audit Trail</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Workflow activity and review history.
      </p>
      <div className="mt-4 space-y-3">
        {uniqueTimeline.map((entry) => (
          <EntryCard
            key={`timeline-${entry.auditId}`}
            title={entry.eventType}
            subtitle={`${entry.recipientName} • ${entry.recipientRole} • ${formatRequestDateTime(entry.createdOn)}`}
            description={entry.message}
          />
        ))}
      </div>
    </aside>
  )
}

function EntryCard({
  description,
  subtitle,
  title,
}: {
  description: string
  subtitle: string
  title: string
}) {
  return (
    <article className="rounded-[0.8rem] border border-border bg-background p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </article>
  )
}

export default TimelineSection
