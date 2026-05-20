import { IconCheck, IconNotebook, IconUser } from "@tabler/icons-react"

import type { AccessRequestDetails } from "../../../types"
import { formatRequestDate } from "../../utils/requestDetails"
import ReportBadge from "./ReportBadge"
import ReportField from "./ReportField"
import ReportSectionHeading from "./ReportSectionHeading"
import { getHodReviewer, getStatusTone } from "../utils/requestReport"

type RequestReportDetailsProps = {
  details: AccessRequestDetails
}

function RequestReportDetails({ details }: RequestReportDetailsProps) {
  const primaryItem = details.items[0]
  const hodReviewer = getHodReviewer(details)

  return (
    <div className="space-y-6 p-6">
      <div>
        <ReportSectionHeading icon={IconUser} label="Employee Information" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <ReportField isMono label="Employee ID" value={details.empId} />
          <ReportField label="Name" value={details.requesterName} />
          <ReportField label="Department" value={details.departmentName} />
          <ReportField
            isMono
            label="Requested On"
            value={formatRequestDate(details.createdOn)}
          />
          <ReportField label="Items Requested" value={details.items.length} />
          <ReportField label="Status" value={details.status} />
        </div>
      </div>
      <div className="h-px bg-border" />
      <div>
        <ReportSectionHeading icon={IconNotebook} label="Access Details" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <ReportField
            isMono
            label="Folder Name / Path"
            value={primaryItem?.folderPath}
          />
          <ReportField label="Item Status">
            <ReportBadge
              tone={getStatusTone(primaryItem?.status || details.status)}
            >
              {primaryItem?.status ?? "Pending"}
            </ReportBadge>
          </ReportField>
          <ReportField label="Type of Access Required">
            <div className="mt-1 flex flex-wrap gap-2">
              <ReportBadge
                tone={
                  primaryItem?.accessType === "Read Only"
                    ? "readonly"
                    : "default"
                }
              >
                {primaryItem?.accessType === "Read Only" ? "✓" : "○"} Read-Only
              </ReportBadge>
              <ReportBadge
                tone={
                  primaryItem?.accessType === "Read & Write"
                    ? "readwrite"
                    : "default"
                }
              >
                {primaryItem?.accessType === "Read & Write" ? "✓" : "○"} Read
                &amp; Write
              </ReportBadge>
            </div>
          </ReportField>
          <ReportField label="Reason for Access" value={primaryItem?.reason} />
        </div>
      </div>
      <div className="h-px bg-border" />
      <div>
        <ReportSectionHeading icon={IconUser} label="HOD Approval" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <ReportField
            label="Approver"
            value={hodReviewer?.approverName || "Pending"}
          />
          <ReportField label="Decision">
            <ReportBadge
              tone={getStatusTone(details.items[0]?.status || details.status)}
            >
              {details.items[0]?.status || "Pending"}
            </ReportBadge>
          </ReportField>
          <ReportField label="Department" value={details.departmentName} />
        </div>
      </div>
      <div className="h-px bg-border" />
      <div>
        <ReportSectionHeading
          icon={IconCheck}
          label="Acknowledgment by Requestor"
        />
        <div className="mb-4 rounded-lg border border-border bg-card/60 p-3">
          <p className="text-xs leading-relaxed text-muted-foreground italic">
            "I acknowledge that I have read and agree to comply with the
            organization's data access policies and security guidelines."
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <ReportField
            isMono
            label="ITSR Number"
            value={details.itsrNo || "N/A"}
          />
          <ReportField
            isMono
            label="Request Date"
            value={formatRequestDate(details.createdOn)}
          />
          <ReportField label="Submitted By" value={details.requesterName} />
        </div>
      </div>
    </div>
  )
}

export default RequestReportDetails
