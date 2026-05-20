import { type ReactNode } from "react"

function DropdownPanel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      {children}
    </div>
  )
}

export default DropdownPanel
