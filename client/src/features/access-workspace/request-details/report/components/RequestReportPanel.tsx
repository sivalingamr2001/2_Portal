import { useState } from "react"

import { formatRequestDate } from "../../utils/requestDetails"
import RequestReportDetails from "./RequestReportDetails"
import RequestReportItSection from "./RequestReportItSection"
import RequestReportPolicies from "./RequestReportPolicies"
import RequestReportTabs from "./RequestReportTabs"

function RequestReportPanel({ details }: any) {
  const [activeTab, setActiveTab] = useState("details")

  return (
    <section className="space-y-3 rounded-[0.9rem] border border-border bg-card p-5 shadow-sm">
      <div className="rounded-[0.4rem] border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-[0.32em] text-muted-foreground uppercase">
              File Server Folder Access Request
            </p>
            <p className="text-sm font-semibold text-foreground">
              Janatics India Pvt. Ltd.
            </p>
          </div>
          <div className="flex items-center justify-between gap-6 text-xs whitespace-nowrap">
            <div className="flex flex-col gap-1 space-y-1 text-right sm:text-left">
              <div className="flex gap-2 leading-none">
                <span className="tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                  Record No.
                </span>
                <span className="font-mono text-foreground">
                  {details.itsrNo || `REQ-${details.accessReqId}`}
                </span>
              </div>
              <div className="flex gap-2 leading-none">
                <span className="tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                  Issue Date
                </span>
                <span className="font-mono text-foreground">
                  {formatRequestDate(details.createdOn)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col overflow-hidden rounded-[0.4rem] border border-border bg-card">
        <RequestReportTabs activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "details" ? (
          <RequestReportDetails details={details} />
        ) : null}
        {activeTab === "policy" ? <RequestReportPolicies /> : null}
        {activeTab === "itdept" ? (
          <RequestReportItSection details={details} />
        ) : null}
      </div>
    </section>
  )
}

export default RequestReportPanel
