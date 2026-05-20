import type { AuthUser } from "@/context/AuthContext"
import { clsx, type ClassValue } from "clsx"
import { useEffect, useState } from "react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function GetCurrentUser(): AuthUser | null {
  const sessionData = localStorage.getItem("auth_session")
  if (!sessionData) return null

  try {
    const session = JSON.parse(sessionData)

    return {
      userId: session.userId ?? 0,
      employeeId: session.employeeId,
      userName: session.userName ?? "",
      name: session.name,
      email: session.email,
      phone: session.phone,
      departmentId: session.departmentId,
      departmentName: session.departmentName,
      role: session.role,
      departmentHod: session.departmentHod,
    }
  } catch {
    return null
  }
}
