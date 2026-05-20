import { Outlet } from "react-router-dom"

export function AppContent() {
  return (
    <main className="h-full min-h-0 overflow-x-hidden overflow-y-auto pr-1">
      <Outlet />
    </main>
  )
}
