import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconCancel, IconPencil, IconPlus } from "@tabler/icons-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import CommonTable from "./components/CommonTable"
import PageSection from "./components/PageSection"
import type { HodResponse, TableColumn } from "./types"
import { deleteFolderMapping, fetchAllHod, fetchFolderMappings, fetchParentFolders, saveFolderMapping, type FolderMappingRecord } from "./utils/requestApi"

// Sentinel value for empty select
const NONE_VALUE = "Select..."

function FolderMappingPage() {
  const [mappings, setMappings] = useState<FolderMappingRecord[]>([])
  const [hods, setHods] = useState<HodResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savingFolder, setSavingFolder] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [parentFolders, setParentFolders] = useState<string[]>([])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selectedMapping, setSelectedMapping] = useState<FolderMappingRecord | null>(null)

  // Form state
  const [formFolderName, setFormFolderName] = useState(NONE_VALUE)
  const [formPrimaryHod, setFormPrimaryHod] = useState(NONE_VALUE)
  const [formSecondaryHod, setFormSecondaryHod] = useState(NONE_VALUE)
  const [formIsActive, setFormIsActive] = useState(true)
  const [mappingToDelete, setMappingToDelete] = useState<FolderMappingRecord | null>(null);

  const [reloadKey, setReloadKey] = useState(0)
  const { user } = useAuth()

  const currentUser = user?.role === "admin" ? "Admin" : user?.email || "Unknown"

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [folderData, hodData] = await Promise.all([
          fetchFolderMappings(),
          fetchAllHod(1, 200),
        ])

        if (cancelled) return
        setMappings(folderData)
        setHods(hodData)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unable to load folder mappings.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()
    fetchAndSetFolders()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  // Filter only parent folders that are not already mapped (for create mode)
  const availableParentFolders = useMemo(() => {
    const mappedFolders = new Set(mappings.map((m) => m.folderName))
    if (dialogMode === "edit" && selectedMapping) {
      return parentFolders.filter((f) => f === selectedMapping.folderName || !mappedFolders.has(f))
    }
    return parentFolders.filter((f) => !mappedFolders.has(f))
  }, [mappings, dialogMode, selectedMapping])

  const hodOptions = useMemo(() => hods, [hods])

  const fetchAndSetFolders = async () => {
    const data = await fetchParentFolders();
    setParentFolders(data);
  };

  const handleOpenCreate = () => {
    setDialogMode("create")
    setSelectedMapping(null)
    setFormFolderName(NONE_VALUE)
    setFormPrimaryHod(NONE_VALUE)
    setFormSecondaryHod(NONE_VALUE)
    setFormIsActive(true)
    setDialogOpen(true)
  }

  const handleOpenEdit = (mapping: FolderMappingRecord) => {
    setDialogMode("edit")
    setSelectedMapping(mapping)
    setFormFolderName(mapping.folderName || NONE_VALUE)
    setFormPrimaryHod(mapping.primaryHodId || NONE_VALUE)
    setFormSecondaryHod(mapping.secondaryHodId || NONE_VALUE)
    setFormIsActive(mapping.isActive ?? true)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedMapping(null)
  }

  const handleSave = async () => {
    if (formFolderName === NONE_VALUE) {
      toast.error("Please select a folder.")
      return
    }
    if (formPrimaryHod === NONE_VALUE) {
      toast.error("Please select a Primary HOD.")
      return
    }

    const primaryHod = hodOptions.find((h) => h.EmployeeId === formPrimaryHod)
    const secondaryHod = hodOptions.find((h) => h.EmployeeId === formSecondaryHod)

    const now = new Date().toISOString()

    const payload: FolderMappingRecord = {
      id: selectedMapping?.id ?? 0,
      folderName: formFolderName,
      primaryHodId: formPrimaryHod,
      primaryHodName: primaryHod ? `${primaryHod.Name}` : "",
      primaryHodEmail: primaryHod?.Email ?? "",
      secondaryHodId: formSecondaryHod === NONE_VALUE ? "" : formSecondaryHod,
      secondaryHodName: secondaryHod ? `${secondaryHod.Name}` : "",
      secondaryHodEmail: secondaryHod?.Email ?? "",
      createdOn: selectedMapping?.createdOn ?? now,
      createdBy: selectedMapping?.createdBy ?? currentUser,
      modifiedOn: now,
      modifiedBy: currentUser,
      isActive: formIsActive,
    }

    setSavingFolder(formFolderName)
    try {
      const saved = await saveFolderMapping(payload)
      setMappings((current) => {
        if (dialogMode === "edit") {
          return current.map((item) => (item.id === saved.id || item.folderName === saved.folderName ? saved : item))
        }
        return [...current, saved]
      })
      toast.success(dialogMode === "edit" ? "Folder mapping updated." : "Folder mapping created.")
      handleCloseDialog()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save mapping.")
    } finally {
      setSavingFolder(null)
    }
  }

  const handleDelete = (mapping: FolderMappingRecord) => {
    setMappingToDelete(mapping);
  };

  // This is the actual execution logic
  const confirmDelete = async () => {
    if (!mappingToDelete) return;

    try {
      await deleteFolderMapping(mappingToDelete.id)
      setReloadKey((value) => value + 1) // Trigger data reload
      toast.success("Folder mapping deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete mapping.");
    } finally {
      setMappingToDelete(null); // Close the dialog
    }
  };


  const selectedPrimary = hodOptions.find(h => h.EmployeeId === formPrimaryHod);
  const selectedSecondary = hodOptions.find(h => h.EmployeeId === formSecondaryHod);

  // Define table columns for CommonTable
  const columns: TableColumn<FolderMappingRecord>[] = useMemo(() => [
    {
      key: "folderName",
      header: "Folder",
      render: (mapping) => (
        <span className="font-medium">{mapping.folderName}</span>
      ),
    },
    {
      key: "primaryHod",
      header: "Primary HOD",
      render: (mapping) => (
        <div>
          <div className="text-sm">{mapping.primaryHodName || "-"}</div>
          <div className="text-xs text-muted-foreground">{mapping.primaryHodEmail || ""}</div>
        </div>
      ),
    },
    {
      key: "secondaryHod",
      header: "Secondary HOD",
      render: (mapping) => (
        <div>
          <div className="text-sm">{mapping.secondaryHodName || "-"}</div>
          <div className="text-xs text-muted-foreground">{mapping.secondaryHodEmail || ""}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (mapping) => (
        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${mapping.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {mapping.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (mapping) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleOpenEdit(mapping)}
          >
            <IconPencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(mapping)}
          >
            <IconCancel className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="space-y-4">
      <PageSection
        title="Folder Mapping"
        description="Assign Primary and Secondary HOD to each parent folder."
      >
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}

        <CommonTable
          columns={columns}
          rows={mappings}
          isLoading={isLoading}
          emptyMessage='No folder mappings found. Click "Add Mapping" to create one.'
          searchPlaceholder="Search folders..."
          getRowId={(mapping) => mapping.id ?? mapping.folderName}
          onRefresh={() => setReloadKey((value) => value + 1)}
          toolbarActions={
            <Button onClick={handleOpenCreate} size="sm">
              <IconPlus className="h-4 w-4 mr-1" />
              Add Mapping
            </Button>
          }
        />
      </PageSection>

      {/* Dialog for Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-140">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Add Folder Mapping" : "Edit Folder Mapping"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Parent Folder Select */}
            <div className="space-y-2">
              <Label>Parent Folder <span className="text-red-500">*</span></Label>
              <Select
                value={formFolderName || ""}
                onValueChange={setFormFolderName}
                disabled={dialogMode === "edit"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {formFolderName && formFolderName !== "" ? (
                      formFolderName
                    ) : (
                      <span className="text-muted-foreground">Select parent folder...</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableParentFolders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Primary HOD Select */}
            <div className="space-y-2">
              <Label>Primary HOD <span className="text-red-500">*</span></Label>
              <Select value={formPrimaryHod} onValueChange={setFormPrimaryHod}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedPrimary ? `${selectedPrimary.Name} (${selectedPrimary.Email})` : "Select Primary HOD..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {hodOptions.map((hod) => (
                    <SelectItem
                      key={hod.EmployeeId}
                      value={hod.EmployeeId}
                      disabled={hod.EmployeeId === formSecondaryHod}
                    >
                      {hod.Name} ({hod.Email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Secondary HOD Select */}
            <div className="space-y-2">
              <Label>Secondary HOD</Label>
              <Select value={formSecondaryHod} onValueChange={setFormSecondaryHod}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedSecondary ? `${selectedSecondary.Name} (${selectedSecondary.Email})` : "Select Secondary HOD (Optional)..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {hodOptions.map((hod) => (
                    <SelectItem
                      key={hod.EmployeeId}
                      value={hod.EmployeeId}
                      disabled={hod.EmployeeId === formPrimaryHod}
                    >
                      {hod.Name} ({hod.Email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Is Active Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formIsActive}
                onCheckedChange={(checked) => setFormIsActive(checked === true)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={savingFolder === formFolderName || formFolderName === NONE_VALUE || formPrimaryHod === NONE_VALUE}
            >
              {savingFolder === formFolderName ? "Saving..." : dialogMode === "create" ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!mappingToDelete}
        onOpenChange={(open) => !open && setMappingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mapping for
              <span className="font-semibold text-foreground"> "{mappingToDelete?.folderName}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default FolderMappingPage