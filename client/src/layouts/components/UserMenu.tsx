import { IconUserCircle } from "@tabler/icons-react"
import { useEffect, useRef } from "react"

type UserMenuProps = {
  name: string
  onLogout: () => void
  onOpenChange: () => void
  onProfile: () => void
  isOpen: boolean
}

function UserMenu({
  isOpen,
  name,
  onLogout,
  onOpenChange,
  onProfile,
}: UserMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && isOpen) {
        onOpenChange()
      }
    }

    document.addEventListener("mousedown", handleDocumentClick)
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick)
    }
  }, [isOpen, onOpenChange])

  return (
    <div ref={menuRef} className="relative z-100">
      <button
        className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 transition-colors hover:bg-accent"
        onClick={onOpenChange}
      >
        <IconUserCircle className="size-5" />
        <div className="text-left">
          <p className="text-sm font-medium">{name}</p>
        </div>
      </button>
      {isOpen ? (
        <>
          <button
            className="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            onClick={onProfile}
          >
            Profile
          </button>
          <button
            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
            onClick={onLogout}
          >
            Logout
          </button>
        </>
      ) : null}
    </div>
  )
}

export default UserMenu
