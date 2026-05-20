import {
  IconBell,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
} from "@tabler/icons-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import { useAccessWorkspace } from "@/features/access-workspace/hooks/useAccessWorkspace"
import type { NotificationItem } from "@/features/access-workspace/types"
import { cn } from "@/lib/utils"
import NotificationSheet from "./components/NotificationSheet"
import UserMenu from "./components/UserMenu"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type AppHeaderProps = {
  isSidebarCollapsed: boolean
  onToggleSidebar?: () => void
}

export function AppHeader({
  isSidebarCollapsed,
  onToggleSidebar,
}: AppHeaderProps) {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { markNotificationAsRead, notifications } =
    useAccessWorkspace("dashboard")
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const hasUnread = notifications.some((item) => !item.isRead)
  const handleUserMenuToggle = () => setIsUserMenuOpen((value) => !value)
  const handleNotificationToggle = () =>
    setIsNotificationOpen((value) => !value)
  const handleNotificationOpenChange = (isOpen: boolean) =>
    setIsNotificationOpen(isOpen)
  const handleProfile = () => navigate("/profile")

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      await markNotificationAsRead(item.auditId)
    } finally {
      setIsNotificationOpen(false)
      navigate(`/requests/${item.accessReqId}`)
    }
  }

  return (
    <header className="relative z-10 overflow-visible animate-header-slide flex min-h-14 items-center justify-between gap-3 rounded-[0.5rem] bg-transprent px-4">
      <div className="flex items-center gap-2">
        <Button
          className={cn(
            "relative flex h-10 w-10 items-center justify-center text-black dark:text-white hover:text-white rounded-[16px] border border-border bg-background transition-colors hover:bg-accent"
          )}
          onClick={onToggleSidebar}
        >
          {isSidebarCollapsed ? (
            <IconLayoutSidebarRightCollapse className="h-5 w-5" />
          ) : (
            <IconLayoutSidebarLeftCollapse className="h-5 w-5" />
          )}
        </Button>
        <div>
          <Separator orientation="vertical" className="h-6 bg-border" />
        </div>
        <div >
          <h1 className="animate-fade-in-right text-lg font-semibold tracking-tight">Access Portal</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="relative flex h-10 w-10 items-center justify-center text-black dark:text-white hover:text-white rounded-xl border border-border bg-background transition-colors hover:bg-accent"
          onClick={handleNotificationToggle}
        >
          <IconBell className="h-5 w-5" />
          {hasUnread ? (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500" />
          ) : null}
        </Button>
        <UserMenu
          isOpen={isUserMenuOpen}
          name={user?.name ?? "User"}
          onLogout={logout}
          onOpenChange={handleUserMenuToggle}
          onProfile={handleProfile}
        />
      </div>
      <NotificationSheet
        isOpen={isNotificationOpen}
        notifications={notifications}
        onOpenChange={handleNotificationOpenChange}
        onNotificationClick={handleNotificationClick}
      />
    </header>
  )
}
