import CommonTable from "./components/CommonTable"
import PageSection from "./components/PageSection"
import { useAccessWorkspace } from "./hooks/useAccessWorkspace"
import type { QueueMode } from "./types"
import { requestColumns } from "./utils/tableColumns"

type ReviewQueuePageProps = {
  description: string
  mode: QueueMode
  title: string
}

function ReviewQueuePage({ description, mode, title }: ReviewQueuePageProps) {
  const { errorMessage, isLoading, refetch, requests } =
    useAccessWorkspace(mode)

  return (
    <PageSection title={title} description={description}>
      {errorMessage ? (
        <p className="mb-4 text-sm text-destructive">{errorMessage}</p>
      ) : null}

      <CommonTable
        columns={requestColumns}
        getRowId={(row) =>
          `${row.accessReqId}-${row.accessItems[0]?.accessItemId ?? "request"}`
        }
        pageSize={5}
        onRefresh={refetch}
        rows={isLoading ? [] : requests}
        emptyMessage={isLoading ? "Loading..." : "No requests found."}
      />
    </PageSection>
  )
}

export default ReviewQueuePage
