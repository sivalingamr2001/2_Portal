import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import type { AccessRequestDetails, AppRole } from "../../types"
import type { AccessRequestPayload } from "@/lib/access-request-schema"
import { buildResubmitPayload } from "../report/utils/requestReport"
import { findInitialItemId } from "../utils/requestDetails"
import { getDefaultRoute } from "../../utils/accessSelectors"
import {
  reviewAccessRequestByHod,
  reviewAccessRequestByIt,
  revokeAccessRequest,
} from "../../utils/requestApi"

export function useRequestDetailsPage(
  details: AccessRequestDetails | null,
  reviewerEmployeeId: number,
  role: AppRole,
  refetch: () => Promise<void>
) {
  const navigate = useNavigate()
  const [isPending, setIsPending] = useState(false)
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  )
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isResubmitOpen, setIsResubmitOpen] = useState(false)
  const [isRevokeOpen, setIsRevokeOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState(0)
  const selectedItem =
    details?.items.find((item) => item.accessItemId === selectedItemId) ??
    details?.items[0] ??
    null
  const canRevoke =
    details && selectedItem?.status === "Access Granted" && role === "Operator"
  const canResubmit =
    role === "User" &&
    details?.empId === reviewerEmployeeId &&
    ["Rejected HOD", "Rejected IT", "Revoked"].includes(
      selectedItem?.status || ""
    )

  useEffect(() => {
    if (!details) return
    setSelectedItemId((current) => current || findInitialItemId(details.items))
  }, [details])

  const canReviewAsHod =
    role === "Hod" && selectedItem?.status === "Pending HOD"
  const canReviewAsIt =
    role === "Operator" && selectedItem?.status === "Pending IT"
  const resubmitPayload = details ? buildResubmitPayload(details) : undefined
  const handleBack = () => navigate(-1)
  const handleResubmitSuccess = () => navigate(getDefaultRoute("User"))
  const handleReviewOpen = (actionType: "approve" | "reject") => {
    setReviewAction(actionType)
    setIsReviewOpen(true)
  }
  const handleReviewClose = () => setIsReviewOpen(false)

  const handleRevoke = async (comments: string) => {
    if (!details) return
    setIsPending(true)
    try {
      await revokeAccessRequest(
        details.accessReqId,
        selectedItemId,
        reviewerEmployeeId,
        comments
      )
      await refetch()
      setIsRevokeOpen(false)
    } finally {
      setIsPending(false)
    }
  }

  const handleReview = async (
    comments: string,
    confirmAccessType: number = 1
  ) => {
    if (!details) return
    setIsPending(true)
    try {
      const approved = reviewAction === "approve"
      if (canReviewAsHod)
        await reviewAccessRequestByHod(
          details.accessReqId,
          selectedItemId,
          reviewerEmployeeId,
          approved,
          comments,
          confirmAccessType
        )
      if (canReviewAsIt)
        await reviewAccessRequestByIt(
          details.accessReqId,
          selectedItemId,
          reviewerEmployeeId,
          approved,
          comments,
          details.itsrNo || "",
          confirmAccessType
        )
      await refetch()
      setIsReviewOpen(false)
      setReviewAction(null)
    } finally {
      setIsPending(false)
    }
  }

  return {
    canResubmit,
    canRevoke,
    canReviewAsHod,
    canReviewAsIt,
    handleBack,
    handleResubmitOpen: () => setIsResubmitOpen(true),
    handleResubmitClose: () => setIsResubmitOpen(false),
    handleRevoke,
    handleRevokeOpen: () => setIsRevokeOpen(true),
    handleRevokeClose: () => setIsRevokeOpen(false),
    handleResubmitSuccess,
    handleReview,
    handleReviewClose,
    handleReviewOpen,
    isPending,
    isResubmitOpen,
    isReviewOpen,
    isRevokeOpen,
    resubmitPayload: resubmitPayload as AccessRequestPayload | undefined,
    reviewAction,
    selectedItem,
    selectedItemId,
    setSelectedItemId,
  }
}
