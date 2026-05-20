import { useEffect, useState } from "react"

import type { AccessRequestDetails } from "../../types"
import { fetchAccessRequestDetails } from "../../utils/requestApi"

export function useRequestDetails(
  accessReqId: number,
  viewerEmployeeId: number
) {
  const [details, setDetails] = useState<AccessRequestDetails | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchDetails = async () => {
    if (!accessReqId || !viewerEmployeeId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const payload = await fetchAccessRequestDetails(
        accessReqId,
        viewerEmployeeId
      )
      setDetails(payload)
      setErrorMessage("")
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchDetails()
  }, [accessReqId, viewerEmployeeId])

  return { details, errorMessage, isLoading, refetch: fetchDetails, setDetails }
}
