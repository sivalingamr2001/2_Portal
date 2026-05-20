type RequestReportTabsProps = {
  activeTab: string
  onTabChange: (tab: string) => void
}

const REPORT_TABS = [
  { id: "details", label: "Request Details" },
  { id: "policy", label: "Data Policies" },
  { id: "itdept", label: "IT Dept. Use" },
]

function RequestReportTabs({ activeTab, onTabChange }: RequestReportTabsProps) {
  return (
    <div className="flex border-b border-border">
      {REPORT_TABS.map((item) => (
        <button
          key={item.id}
          className={`flex-1 px-4 py-3 text-[11px] font-semibold tracking-widest uppercase transition-all ${activeTab === item.id ? "border-b-2 border-primary bg-card/50 text-foreground" : "text-muted-foreground hover:bg-card/30 hover:text-foreground"}`}
          type="button"
          onClick={() => onTabChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default RequestReportTabs
