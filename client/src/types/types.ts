import type { ComponentType } from "react"

export enum UserRole {
  User = 0,
  Hod = 1,
  Operator = 2,
  Admin = 3
}

export type TextUserRole = "User" | "Hod" | "Operator" | "Admin"

export type NavigationItem = {
  label: string
  to: string
  icon: ComponentType<any>
  roles: TextUserRole[]
}

export type NavigationSection = {
  title: string
  items: NavigationItem[]
}
