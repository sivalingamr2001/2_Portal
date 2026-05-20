import type { AccessRequestDetails, AccessRequestItem } from "../../types"
import { buildStageCards } from "../utils/requestDetails"

type StageFlowProps = {
  details: AccessRequestDetails
  selectedItem: AccessRequestItem
}

const TONE_CLASS = {
  active:
    "border-primary text-primary shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]",
  complete:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "border-destructive bg-destructive/10 text-destructive",
  pending: "border-border text-muted-foreground opacity-60",
} as const

function StageFlow({ details, selectedItem }: StageFlowProps) {
  const cards = buildStageCards(details, selectedItem)

  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className={`group relative rounded-[0.9rem] border bg-card px-4 py-2 ${TONE_CLASS[card.tone]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current text-sm font-semibold">
              {index + 1}
            </span>
            <div>
              <span className="mr-2 text-[11px] tracking-[0.24em] uppercase">
                {card.tone}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="ml-2 text-sm font-semibold">{card.label}</span>
            </div>
          </div>
          <div className="pointer-events-none absolute top-full left-1/2 z-10 hidden w-64 -translate-x-1/2 rounded border border-border bg-background p-3 text-xs text-muted-foreground shadow-lg ring-1 ring-border/50 group-hover:block">
            {card.description}
          </div>
        </article>
      ))}
    </div>
  )
}

export default StageFlow
