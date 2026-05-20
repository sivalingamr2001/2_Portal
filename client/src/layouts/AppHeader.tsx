import {
  IconBell,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
} from "@tabler/icons-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const notifications = [
    {
      id: "welcome",
      title: "Welcome back",
      description: "Your current session is active.",
    },
  ]
  const hasUnread = notifications.length > 0

  const handleNotificationToggle = () => {
    setIsNotificationOpen((current) => !current)
  }

  const handleNotificationClick = () => {
    setIsNotificationOpen(false)
  }

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen((current) => !current)
  }

  const handleProfile = () => {
    setIsUserMenuOpen(false)
    navigate("/me")
  }

  return (
    <div className="relative">
      <header className="relative z-10 overflow-visible animate-header-slide flex min-h-14 items-center justify-between gap-3 rounded-[0.5rem] bg-transparent px-4">
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
          <div>
            <h1 className="animate-fade-in-right text-lg font-semibold tracking-tight">
              Access Portal
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              className="relative flex h-10 w-10 items-center justify-center text-black dark:text-white hover:text-white rounded-xl border border-border bg-background transition-colors hover:bg-accent"
              onClick={handleNotificationToggle}
            >
              <IconBell className="h-5 w-5" />
              {hasUnread ? (
                <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500" />
              ) : null}
            </Button>
            {isNotificationOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Notifications</p>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleNotificationClick}
                  >
                    Close
                  </button>
                </div>
                {notifications.map((notification) => (
                  <div key={notification.id} className="space-y-1 rounded-xl border border-border p-3 text-sm">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-muted-foreground">{notification.description}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <UserMenu
            isOpen={isUserMenuOpen}
            name={user?.name ?? "User"}
            onLogout={logout}
            onOpenChange={handleUserMenuToggle}
            onProfile={handleProfile}
          />
        </div>
      </header>
    </div>
  )
}
