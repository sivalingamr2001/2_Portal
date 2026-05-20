import type { NavigationSection } from "@/types/types"

import SidebarLink from "./SidebarLink"

type SidebarGroupProps = {
  isCollapsed: boolean
  section: NavigationSection
  onItemClick?: () => void
}

function SidebarGroup({
  isCollapsed,
  section,
  onItemClick,
}: SidebarGroupProps) {
  return (
    <div>
      {isCollapsed ? null : (
        <p className="mb-3 px-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {section.title}
        </p>
      )}
      <div className="space-y-1">
        {section.items.map((item) => (
          <SidebarLink
            key={item.to}
            icon={item.icon}
            isCollapsed={isCollapsed}
            label={item.label}
            onClick={onItemClick}
            to={item.to}
          />
        ))}
      </div>
    </div>
  )
}

export default SidebarGroup
