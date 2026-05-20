import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import { createAccessRequest } from "@/lib/access-request-api"
import { type AccessRequestPayload } from "@/lib/access-request-schema"
import { fetchFolderHierarchy } from "../utils/requestApi"
import { useApp } from "@/hooks/useApp"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { AccessDetailsSection } from "../access-request/access-details-section"
import { AgreementCheckbox } from "../access-request/agreement-checkbox"
import { EmployeeSection } from "../access-request/employee-section"

type CreateRequestModalProps = {
  initialData?: AccessRequestPayload
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  submitLabel?: string
  title?: string
}

const DEFAULT_ITEM = {
  accessType: 0,
  confirmAccessTypeByHOD: 0,
  folderPath: "",
  reason: "",
}

interface FolderResponse {
  name: string;
  driveName: string;
  children: FolderResponse[];
}

interface FolderNode {
  id: string;
  name: string;
  path: string;
  driveName: string;
  children?: FolderNode[];
}

function mapFolderHierarchy(
  folders: FolderResponse[],
  parentPath = ""
): FolderNode[] {
  return folders.map((folder) => {
    // Standardized network drive pathing
    const path = parentPath
      ? `${parentPath}\\${folder.name}`
      : `${folder.driveName}\\${folder.name}`;

    return {
      id: path,
      name: folder.name,
      path: path,
      driveName: folder.driveName,
      children: folder.children && folder.children.length > 0
        ? mapFolderHierarchy(folder.children, path)
        : undefined,
    };
  });
}

function getDefaultFormValues(initialData?: AccessRequestPayload) {
  return {
    accessReqId: initialData?.accessReqId,
    empId: initialData?.empId ?? 0,
    isAgree: initialData?.isAgree ?? false,
    itsrNo: initialData?.itsrNo ?? "",
    reqTo: initialData?.reqTo ?? 0,
    items: initialData?.items && initialData.items.length > 0 ? initialData.items : [DEFAULT_ITEM],
  } satisfies AccessRequestPayload
}

function CreateRequestModal({
  initialData,
  isOpen,
  onClose,
  onSuccess,
  submitLabel = "Submit Request",
  title = "Create Access Request",
}: CreateRequestModalProps) {
  const { currentUser } = useApp()
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [folders, setFolders] = useState<FolderNode[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)

  const form = useForm<AccessRequestPayload>({
    defaultValues: getDefaultFormValues(initialData),
  })

  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultFormValues(initialData))
      setErrorMessage("")
    }
  }, [isOpen, initialData, form])

  // FIX: Type assertion applied inside the data fetch chain
  useEffect(() => {
    setIsLoadingFolders(true)
    fetchFolderHierarchy()
      .then((data) => setFolders(mapFolderHierarchy(data as FolderResponse[])))
      .catch(() => setFolders([]))
      .finally(() => setIsLoadingFolders(false))
  }, [])

  const folderData = useMemo(
    () => (folders.length > 0 ? folders : []),
    [folders]
  )

  const handleSubmit = async (values: AccessRequestPayload) => {
    setErrorMessage("")
    setIsPending(true)
    try {
      await createAccessRequest(values)
      form.reset(getDefaultFormValues())
      onSuccess?.()
      onClose()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create access request."
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] w-[90vw]! max-w-5xl! overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-4xl text-primary">{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm text-muted-foreground space-y-2">
          <p>Request access to a folder by filling in the details below.</p>
          <p className="text-xs text-muted-foreground/80">
            Submissions are routed to your department HOD first. If the folder maps to a different folder HOD, that HOD will also receive notification. Final approval is performed by the operator/IT team after HOD approval.
          </p>
        </DialogDescription>
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5 py-4"
          >
            <EmployeeSection form={form} currentUser={currentUser} />

            <AccessDetailsSection form={form} folders={folderData} />

            <AgreementCheckbox form={form} />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isPending || isLoadingFolders}
              >
                {isPending ? "Submitting..." : submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateRequestModal
