import { useState } from "react"

import { Button } from "@/components/ui/button"
import CreateRequestModal from "./components/CreateRequestModal"
import PageSection from "./components/PageSection"
import { useAccessWorkspace } from "./hooks/useAccessWorkspace"
import { requestColumns } from "./utils/tableColumns"
import CommonTable from "./components/CommonTable"
import type { AccessRequest } from "./types"

function MyRequestPage() {
  const { errorMessage, isLoading, refetch, requests } =
    useAccessWorkspace("dashboard")
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="space-y-4">
      <PageSection title="My Requests" description="">
        {errorMessage && (
          <p className="mb-4 text-sm text-destructive">{errorMessage}</p>
        )}

        <CommonTable
          columns={requestColumns}
          getRowId={(row: AccessRequest) =>
            `${row.accessReqId}-${row.accessItems?.[0]?.accessItemId ?? "request"}`
          }
          pageSize={5}
          rows={isLoading ? [] : requests}
          emptyMessage={isLoading ? "Loading..." : "No requests found."}
          onRefresh={refetch}
          searchPlaceholder="Search folder, request, or status"
          toolbarActions={
            <Button
              type="button"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              Create Request
            </Button>
          }
        />
      </PageSection>

      <CreateRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  )
}

export default MyRequestPage
