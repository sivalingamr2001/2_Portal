import { useParams } from "react-router-dom"

import { useAuth } from "@/context/AuthContext"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import ApprovalReviewModal from "./components/ApprovalReviewModal"
import CreateRequestModal from "./components/CreateRequestModal"
import StageFlow from "./request-details/components/StageFlow"
import TimelineSection from "./request-details/components/TimelineSection"
import { useRequestDetails } from "./request-details/hooks/useRequestDetails"
import { useRequestDetailsPage } from "./request-details/hooks/useRequestDetailsPage"
import RequestReportPanel from "./request-details/report/components/RequestReportPanel"
import RevocModal from "./components/RevocModal"
import AccessValidityBadge from "./AccessValidityBadge"

function RequestDetailsPage() {
  const { requestId } = useParams()
  const { itemId } = useParams()
  const { user } = useAuth()
  const accessReqId = Number(requestId)
  const selectedItemFromUrl = itemId ? Number(itemId) : undefined
  const reviewerEmployeeId = user?.employeeId ?? 0
  const role =
    user?.role === "Hod" || user?.role === "Operator" ? user.role : "User"
  const { details, errorMessage, isLoading, refetch } = useRequestDetails(
    accessReqId,
    reviewerEmployeeId
  )
  const page = useRequestDetailsPage(details, reviewerEmployeeId, role, refetch)
  const prevItemIdRef = useRef<number | undefined>(undefined)

  // Set selected item from URL parameter (only when it changes)
  useEffect(() => {
    if (selectedItemFromUrl && selectedItemFromUrl !== prevItemIdRef.current) {
      page.setSelectedItemId(selectedItemFromUrl)
      prevItemIdRef.current = selectedItemFromUrl
    }
  }, [selectedItemFromUrl])

  const detailsWithSelectedItem = {
    ...details,
    items:
      details?.items
        .filter((item) => item.accessItemId === page.selectedItemId)
        .map((item) => ({ ...item, isSelected: true })) ?? [],
  }

  if (isLoading)
    return (
      <div className="rounded-[0.9rem] border border-border bg-background p-6 text-sm text-muted-foreground">
        Loading request details...
      </div>
    )
  if (!details || !page.selectedItem)
    return (
      <div className="rounded-[0.9rem] border border-border bg-background p-6 text-sm text-destructive">
        {errorMessage || "Request not found."}
      </div>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          className="w-fit px-0"
          size="sm"
          variant="ghost"
          onClick={page.handleBack}
        >
          <IconArrowLeft className="size-4" />
          {"Back to Requests"}
        </Button>
        <div className="flex gap-2">
          {page.canResubmit && (
            <Button onClick={() => page.handleResubmitOpen()}>
              Resubmit Request
            </Button>
          )}
          {page.canRevoke && (
            <Button
              variant="destructive"
              onClick={() => page.handleRevokeOpen()}
            >
              Revoke Request
            </Button>
          )}
          {(page.canReviewAsHod || page.canReviewAsIt) && (
            <>
              <Button
                variant="outline"
                onClick={() => page.handleReviewOpen("approve")}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => page.handleReviewOpen("reject")}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
      <StageFlow
        details={details}
        selectedItem={page.selectedItem ?? details.items[0]}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(280px,1fr)]">
        <RequestReportPanel details={detailsWithSelectedItem} />

        <div className="flex flex-col gap-4">
          {page.selectedItem?.status === "Access Granted" && (
            <AccessValidityBadge itemId={page.selectedItemId} />
          )}

          <TimelineSection timeline={details.timeline} />
        </div>
      </div>

      <ApprovalReviewModal
        actionType={page.reviewAction}
        details={details}
        isOpen={page.isReviewOpen}
        isPending={page.isPending}
        selectedItemId={page.selectedItemId}
        onClose={page.handleReviewClose}
        onSubmit={(comments, confirmAccessType) =>
          page.handleReview(comments, confirmAccessType)
        }
        role={role === "Hod" ? "Hod" : "Admin"}
      />
      <CreateRequestModal
        initialData={page.resubmitPayload}
        isOpen={page.isResubmitOpen}
        onClose={page.handleResubmitClose}
        onSuccess={page.handleResubmitSuccess}
        submitLabel="Resubmit Request"
        title="Resubmit Request"
      />
      <RevocModal
        isOpen={page.isRevokeOpen}
        isPending={page.isPending}
        onClose={page.handleRevokeClose}
        onSubmit={page.handleRevoke}
      />
    </div>
  )
}

export default RequestDetailsPage
