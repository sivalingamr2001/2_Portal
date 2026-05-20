import { useCallback, useEffect, useState } from "react"

import type { Department } from "../types"
import { fetchDepartments } from "../utils/requestApi"

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setIsLoading(true)
    void (async () => {
      try {
        const list = await fetchDepartments()
        setDepartments(list)
        setError(null)
      } catch (e) {
        setDepartments([])
        setError(e instanceof Error ? e.message : "Unable to load departments.")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { departments, isLoading, error, refetch }
}
