import type {
  AccessRequestDetails,
  AccessRequestItem,
  AccessRequestTimeline,
} from "../../types"

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" })
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatRequestDate(value: string | null) {
  return value ? DATE_FORMATTER.format(new Date(value)) : "Not available"
}

export function formatRequestDateTime(value: string | null) {
  return value ? DATE_TIME_FORMATTER.format(new Date(value)) : "Not available"
}

export function findInitialItemId(items: AccessRequestItem[]) {
  return items[0]?.accessItemId ?? 0
}

export function getUniqueTimelineEntries(timeline: AccessRequestTimeline[]) {
  const seen = new Set<string>()

  return timeline.filter((entry) => {
    const key = `${entry.eventType}|${entry.message}|${entry.createdOn}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export type StageCard = {
  description: string
  label: string
  tone: "active" | "complete" | "failed" | "pending"
}

export function buildStageCards(
  details: AccessRequestDetails,
  selectedItem: AccessRequestItem
): StageCard[] {
  const { status } = selectedItem
  const itApproval = details.approvals.find(
    (a) =>
      a.approvalStatus === "Access Granted" ||
      a.approvalStatus === "Approved IT"
  )
  const approvedDate = itApproval ? new Date(itApproval.createdOn) : null
  const now = new Date()
  const diffDays = approvedDate
    ? Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 3600 * 24))
    : null
  const isRecent = diffDays !== null && diffDays <= 365

  // Card 1: Submitted
  const card1: StageCard = {
    description: "Request created and recorded.",
    label: "Submitted",
    tone: "complete",
  }

  // Card 2: HOD Approval
  let card2Label = "HOD Review"
  let card2Tone: StageCard["tone"] = "pending"
  if (status === "Pending HOD") {
    card2Tone = "active"
  } else if (status === "Rejected HOD") {
    card2Label = "HOD Rejected"
    card2Tone = "failed"
  } else {
    card2Label = "HOD Approved"
    card2Tone = "complete"
  }
  const card2: StageCard = {
    description: "Business validation by HOD.",
    label: card2Label,
    tone: card2Tone,
  }

  // Card 3: IT Approval
  let card3Label = "IT Review"
  let card3Tone: StageCard["tone"] = "pending"
  if (["Pending HOD", "Rejected HOD"].includes(status)) {
    card3Tone = "pending"
  } else if (status === "Pending IT") {
    card3Tone = "active"
  } else if (status === "Rejected IT") {
    card3Label = "IT Rejected"
    card3Tone = "failed"
  } else {
    card3Label = "IT Approved"
    card3Tone = "complete"
  }
  const card3: StageCard = {
    description: "IT infrastructure approval.",
    label: card3Label,
    tone: card3Tone,
  }

  // Card 4: Access State
  let card4Label = "Access State"
  let card4Tone: StageCard["tone"] = "pending"
  let card4Desc = "Access delivered to requester."

  if (
    ["Pending HOD", "Rejected HOD", "Pending IT", "Rejected IT"].includes(
      status
    )
  ) {
    card4Tone = "pending"
  } else if (status === "Access Granted") {
    card4Label = "Access Granted"
    card4Tone = "complete"
  } else if (status === "Revoked" || status === "Expired") {
    if (isRecent) {
      card4Label = status
      card4Tone = "failed"
      card4Desc =
        status === "Revoked"
          ? "Access revoked after approval."
          : "Access expired need renewal."
    } else {
      card4Label = "Access Granted"
      card4Tone = "complete"
    }
  }

  const card4: StageCard = {
    description: card4Desc,
    label: card4Label,
    tone: card4Tone,
  }

  return [card1, card2, card3, card4]
}
