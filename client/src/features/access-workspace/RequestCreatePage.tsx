import { useState } from "react"

import { Button } from "@/components/ui/button"

import CreateRequestModal from "./components/CreateRequestModal"
import PageSection from "./components/PageSection"

function RequestCreatePage() {
  const [isModalOpen, setIsModalOpen] = useState(true)

  return (
    <PageSection
      title="Create Request"
      description="Open the request modal to file a new folder access request."
    >
      <Button onClick={() => setIsModalOpen(true)}>Open Request Modal</Button>
      <CreateRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </PageSection>
  )
}

export default RequestCreatePage
