import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { NotificationItem } from "@/features/access-workspace/types"

type NotificationSheetProps = {
  isOpen: boolean
  notifications: NotificationItem[]
  onOpenChange: (isOpen: boolean) => void
  onNotificationClick: (item: NotificationItem) => void
}

const EVENT_LABELS: Record<string, string> = {
  "it.approved": "IT Approved",
  "hod.item_approved": "HOD Approved Item",
  "it.revoked": "IT Revoked",
  "request.updated": "Request Updated",
  "hod.approved": "HOD Approved",
  "request.created": "Request Created",
}

function formatEventLabel(eventType: string) {
  if (EVENT_LABELS[eventType]) return EVENT_LABELS[eventType]

  return eventType
    .split(/[._]/g)
    .filter(Boolean)
    .map((segment) =>
      segment
        .split(/[-]/g)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(" ")
}

function formatDateOnly(dateString: string) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function NotificationSheet({
  isOpen,
  notifications,
  onOpenChange,
  onNotificationClick,
}: NotificationSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-105 sm:max-w-105">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Recent request activity for your workspace.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 overflow-y-auto px-4 pb-4">
          {notifications
            .filter((item) => !item.isRead)
            .map((item) => (
              <NotificationCard
                key={item.auditId}
                item={item}
                onClick={() => onNotificationClick(item)}
              />
            ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NotificationCard({
  item,
  onClick,
}: {
  item: NotificationItem
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[1rem] border border-border bg-card p-4 text-left hover:border-primary"
    >
      <div className="flex items-center justify-between gap-3">
        <p className={item.isRead ? "font-medium" : "font-semibold"}>
          {formatEventLabel(item.eventType)}
        </p>
        <span className="text-xs text-muted-foreground">
          {formatDateOnly(item.createdOn)}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        {item.recipientRole} • Request #{item.accessReqId}
      </p>
    </button>
  )
}

export default NotificationSheet
