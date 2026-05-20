import type { ReactNode } from "react"

type DropdownPanelProps = {
  children: ReactNode
}

function DropdownPanel({ children }: DropdownPanelProps) {
  return (
    <div className="absolute top-full right-0 z-[100] mt-2 w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
      {children}
    </div>
  )
}

export default DropdownPanel
