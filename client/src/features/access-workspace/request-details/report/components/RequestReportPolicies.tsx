import ReportPolicyItem from "./ReportPolicyItem"
import { REPORT_POLICIES } from "../utils/requestReport"

function RequestReportPolicies() {
  return (
    <div className="space-y-4 p-6">
      <p className="mb-4 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        Data Access Policies — {REPORT_POLICIES.length} clauses
      </p>
      {REPORT_POLICIES.map((policy, index) => (
        <ReportPolicyItem key={policy} body={policy} index={index + 1} />
      ))}
    </div>
  )
}

export default RequestReportPolicies
