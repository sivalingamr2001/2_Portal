import {
  IconFolders,
  IconLayoutSidebarLeftCollapse,
  IconToggleRight,
} from "@tabler/icons-react"

import type { AppRole } from "@/features/access-workspace/types"
import { useAuth } from "@/context/AuthContext"
import { NAVIGATION_SECTIONS } from "@/features/app-shell/utils/navigation"
import { useIsMobile } from "@/hooks/use-mobile"

import SidebarGroup from "./components/SidebarGroup"
import LOGO from "@/assets/jana.png"

type AppSidebarProps = {
  isCollapsed: boolean
  onClose: () => void
  onItemClick?: () => void
}

function AppSidebar({ isCollapsed, onClose, onItemClick }: AppSidebarProps) {
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const role = (user?.role as AppRole) || "User"
  const sections = NAVIGATION_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length)

  return (
    <>
      {!isCollapsed ? (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        >
          <IconToggleRight className="absolute top-4 left-4 h-6 w-6" />
        </button>
      ) : null}
      <aside
        className={`flex flex-col overflow-y-auto animate-sidebar-slide rounded-[0.75rem] border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-all duration-300 ${isCollapsed ? "-translate-x-full opacity-0 md:flex md:w-20 md:translate-x-0 md:opacity-100" : "fixed inset-y-0 left-0 z-30 w-[min(20rem,calc(100%-2rem))] max-w-[20rem] translate-x-0 opacity-100 md:relative md:block md:w-72"}`}
      >
        <div
          className={`mb-6 flex items-center rounded-sm bg-sidebar-accent p-3 ${isCollapsed ? "justify-center bg-transparent" : "gap-3"}`}
        >
          <div className="rounded-2xl bg-primary p-3 text-sidebar-primary-foreground">
            <IconFolders className="size-5" />
          </div>
          {isCollapsed ? null : (
            <div className="flex flex-col items-center gap-0.5">
              <img
                src={LOGO}
                alt="Janatics"
                className="h-6 w-auto rounded-sm object-contain"
              />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto">
          {sections.map((section) => (
            <SidebarGroup
              key={section.title}
              isCollapsed={isCollapsed}
              section={section}
              onItemClick={isMobile ? onItemClick : undefined}
            />
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4 md:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full justify-center rounded-xl border border-border bg-background px-3 py-2 align-middle text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <IconLayoutSidebarLeftCollapse className="size-6" />
          </button>
        </div>
      </aside>
    </>
  )
}

export { AppSidebar }
