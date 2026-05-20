import { useState } from "react"

import { cn } from "@/lib/utils"

import { AppContent } from "./AppContent"
import { AppHeader } from "./AppHeader"
import { AppSidebar } from "./AppSidebar"
import UserProfileCompletionModal from "@/features/access-workspace/components/UserProfileCompletionModal"

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="h-screen w-screen overflow-auto bg-background">
      <UserProfileCompletionModal />
      <div
        className={cn(
          "relative h-full w-full max-w-full gap-1 p-1 md:grid",
          isSidebarCollapsed
            ? "md:grid-cols-[5rem_minmax(0,1fr)]"
            : "md:grid-cols-[18rem_minmax(0,1fr)]"
        )}
      >
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onClose={() => setIsSidebarCollapsed(true)}
          onItemClick={() => setIsSidebarCollapsed(true)}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
          <AppHeader
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
          />
          <div className="animate-main-content-slide z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.75rem] bg-transparent p-4 shadow-sm sm:p-5">
            <AppContent />
          </div>
        </div>
      </div>
    </div>
  )
}
