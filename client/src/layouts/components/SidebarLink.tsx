import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

type SidebarLinkProps = {
  icon: React.ComponentType<{ className?: string }>
  isCollapsed: boolean
  label: string
  onClick?: () => void
  to: string
}

function SidebarLink({
  icon: Icon,
  isCollapsed,
  label,
  onClick,
  to,
}: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      title={label}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center rounded-xl px-3 py-2.5 text-sm transition",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isCollapsed ? "justify-center" : "gap-3"
        )
      }
    >
      <Icon className="size-5 shrink-0" />
      {isCollapsed ? (
        <span className="pointer-events-none absolute top-1/2 left-full z-20 ml-3 hidden -translate-y-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
          {label}
        </span>
      ) : (
        <span>{label}</span>
      )}
    </NavLink>
  )
}

export default SidebarLink
