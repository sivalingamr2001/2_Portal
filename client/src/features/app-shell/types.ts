import type { Icon } from "@tabler/icons-react"

import type { AppRole } from "@/features/access-workspace/types"

export type NavigationItem = {
  icon: Icon
  label: string
  roles: AppRole[]
  to: string
}

export type NavigationSection = {
  items: NavigationItem[]
  title: string
}
