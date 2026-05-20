import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createFolderMapping,
  deleteFolderMapping,
  getFolderMappings,
  getFolderOptions,
  getHods,
  updateFolderMapping,
} from "@/features/admin/api"
import { AdminPageShell, DataTable, EntityDialog, Field, Toolbar } from "@/features/admin/components"
import type { FolderMappingRecord, HodRecord } from "@/features/admin/types"

type FolderMappingFormState = {
  folderPath: string
  primaryHodUserId: string
  secondaryHodUserId: string
  isActive: string
}

const EMPTY_FORM: FolderMappingFormState = {
  folderPath: "",
  primaryHodUserId: "",
  secondaryHodUserId: "none",
  isActive: "true",
}

export default function AdminFolderMappingPage() {
  const [rows, setRows] = useState<FolderMappingRecord[]>([])
  const [hods, setHods] = useState<HodRecord[]>([])
  const [folderOptions, setFolderOptions] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<FolderMappingRecord | null>(null)
  const [form, setForm] = useState<FolderMappingFormState>(EMPTY_FORM)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [mappings, hodOptions, folders] = await Promise.all([
        getFolderMappings(),
        getHods(),
        getFolderOptions(),
      ])
      setRows(mappings)
      setHods(hodOptions)
      setFolderOptions(folders)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load folder mappings.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    return rows.filter((row) =>
      `${row.folderPath} ${row.primaryHod?.name ?? ""} ${row.secondaryHod?.name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }, [rows, search])

  const columns = useMemo(() => [
    {
      key: "folderPath",
      header: "Folder Path",
      render: (row: FolderMappingRecord) => (
        <div className="font-medium">{row.folderPath}</div>
      ),
    },
    {
      key: "primary",
      header: "Primary HOD",
      render: (row: FolderMappingRecord) => (
        <div className="space-y-1">
          <div>{row.primaryHod?.name ?? "Unknown"}</div>
          <div className="text-xs text-muted-foreground">{row.primaryHod?.email ?? ""}</div>
        </div>
      ),
    },
    {
      key: "secondary",
      header: "Secondary HOD",
      render: (row: FolderMappingRecord) => (
        <div className="space-y-1">
          <div>{row.secondaryHod?.name ?? "None"}</div>
          <div className="text-xs text-muted-foreground">{row.secondaryHod?.email ?? ""}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: FolderMappingRecord) => (
        <Badge variant={row.isActive ? "outline" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: FolderMappingRecord) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingRow(row)
            setForm({
              folderPath: row.folderPath,
              primaryHodUserId: String(row.primaryHodUserId),
              secondaryHodUserId: row.secondaryHodUserId ? String(row.secondaryHodUserId) : "none",
              isActive: String(row.isActive),
            })
            setDialogOpen(true)
          }}
        >
          Manage
        </Button>
      ),
    },
  ], [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        folderPath: form.folderPath,
        primaryHodUserId: Number(form.primaryHodUserId),
        secondaryHodUserId:
          form.secondaryHodUserId === "none" ? null : Number(form.secondaryHodUserId),
        isActive: form.isActive === "true",
      }

      if (editingRow) {
        await updateFolderMapping(editingRow.id, payload)
        toast.success("Folder mapping updated.")
      } else {
        await createFolderMapping(payload)
        toast.success("Folder mapping created.")
      }

      setDialogOpen(false)
      setEditingRow(null)
      setForm(EMPTY_FORM)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save folder mapping.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!editingRow) return
    setIsSubmitting(true)
    try {
      await deleteFolderMapping(editingRow.id)
      toast.success("Folder mapping deleted.")
      setDialogOpen(false)
      setEditingRow(null)
      setForm(EMPTY_FORM)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete folder mapping.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminPageShell
      title="Admin Folder Mapping"
      description="Assign primary and secondary HOD ownership for folders used in access requests."
      actions={
        <Button
          onClick={() => {
            setEditingRow(null)
            setForm(EMPTY_FORM)
            setDialogOpen(true)
          }}
        >
          Add Mapping
        </Button>
      }
    >
      <Toolbar
        searchValue={search}
        onSearchChange={setSearch}
        action={<Button variant="outline" onClick={() => void loadData()}>Refresh</Button>}
      />
      <DataTable
        columns={columns}
        rows={isLoading ? [] : filteredRows}
        emptyMessage={isLoading ? "Loading folder mappings..." : "No folder mappings found."}
      />

      <EntityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingRow ? "Manage Folder Mapping" : "Create Folder Mapping"}
        description="You can type a new folder path or pick one of the discovered folder paths from previous access activity."
        onSubmit={handleSubmit}
        onDelete={editingRow ? handleDelete : undefined}
        submitLabel={editingRow ? "Save Changes" : "Create Mapping"}
        deleteLabel="Delete Mapping"
        isSubmitting={isSubmitting}
      >
        <Field label="Folder Path">
          <div className="grid gap-2">
            <Input
              value={form.folderPath}
              onChange={(event) => setForm((current) => ({ ...current, folderPath: event.target.value }))}
              placeholder="Folder path"
            />
            {folderOptions.length ? (
              <Select
                value="none"
                onValueChange={(value) => {
                  if (value !== "none") {
                    setForm((current) => ({ ...current, folderPath: value }))
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick from discovered folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Discovered folders</SelectItem>
                  {folderOptions.map((folderPath) => (
                    <SelectItem key={folderPath} value={folderPath}>
                      {folderPath}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </Field>
        <Field label="Primary HOD">
          <Select
            value={form.primaryHodUserId}
            onValueChange={(value) => setForm((current) => ({ ...current, primaryHodUserId: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select primary HOD" />
            </SelectTrigger>
            <SelectContent>
              {hods.map((hod) => (
                <SelectItem key={hod.userId} value={String(hod.userId)}>
                  {hod.name} ({hod.employeeId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Secondary HOD">
          <Select
            value={form.secondaryHodUserId}
            onValueChange={(value) => setForm((current) => ({ ...current, secondaryHodUserId: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select secondary HOD" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {hods.map((hod) => (
                <SelectItem key={hod.userId} value={String(hod.userId)}>
                  {hod.name} ({hod.employeeId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select
            value={form.isActive}
            onValueChange={(value) => setForm((current) => ({ ...current, isActive: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </EntityDialog>
    </AdminPageShell>
  )
}
