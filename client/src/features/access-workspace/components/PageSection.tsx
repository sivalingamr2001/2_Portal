import type { ReactNode } from "react"

type PageSectionProps = {
  action?: ReactNode
  children: ReactNode
  description: string
  title: string
}

function PageSection({
  action,
  children,
  description,
  title,
}: PageSectionProps) {
  return (
    <section className="rounded-[0.6rem] border border-border bg-background p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default PageSection
