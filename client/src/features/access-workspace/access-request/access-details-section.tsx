'use client'

import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useApp } from '@/hooks/useApp'
import type { AccessRequestPayload } from '@/lib/access-request-schema'
import { IconPlus, IconTrash, IconSettings } from '@tabler/icons-react'
import { useState } from 'react'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import type { FolderNode } from './folder-navigator'
import { FolderNavigator } from './folder-navigator'
import { Separator } from '@/components/ui/separator'

interface AccessDetailsSectionProps {
  form: UseFormReturn<AccessRequestPayload>
  folders: FolderNode[]
}

export type AppRole = "User" | "Hod" | "Admin" | "Operator"

export const ACCESS_TYPES = {
  NotApplicable: 0,
  ReadOnly: 1,
  ReadAndWrite: 2,
} as const

const ACCESS_TYPE_OPTIONS = [
  { id: ACCESS_TYPES.NotApplicable, label: "Not Applicable" },
  { id: ACCESS_TYPES.ReadOnly, label: 'Read Only' },
  { id: ACCESS_TYPES.ReadAndWrite, label: 'Read & Write' },
]

const DEFAULT_ITEM = {
  accessType: ACCESS_TYPES.NotApplicable,
  confirmAccessTypeByHOD: 0,
  folderPath: '',
  reason: '',
}

export function AccessDetailsSection({ form, folders }: AccessDetailsSectionProps) {
  const { control, getValues, setValue } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  // Tracks the array index of the item currently being edited in the modal
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null)

  const { currentRole } = useApp()
  const isHod = currentRole === "Hod"

  const handlePathSelect = (index: number, path: string) => {
    setValue(`items.${index}.folderPath`, path)
  }

  const addAccessItem = () => {
    append(DEFAULT_ITEM)
    setActiveModalIndex(fields.length)
  }

  const removeAccessItem = (index: number) => {
    remove(index)
    // If the modal was open for the deleted item, close it safely
    if (activeModalIndex === index) {
      setActiveModalIndex(null)
    } else if (activeModalIndex !== null && activeModalIndex > index) {
      // Offset index adjustment if a previous item is removed
      setActiveModalIndex(activeModalIndex - 1)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      {/* Header Panel */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <h3 className="text-base font-semibold">Access Details</h3>
            <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold text-primary">
              {fields.length}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" size="sm" onClick={addAccessItem} className="w-full sm:w-auto">
            <IconPlus className="mr-2 h-4 w-4" /> Add Access Item
          </Button>
        </div>
      </div>

      {/* Row Items Directory List */}
      <div className="w-full max-h-87.5 overflow-y-auto pr-1 scrollbar-thin space-y-2">
        {fields.map((field, index) => {
          const folderPath = getValues(`items.${index}.folderPath`)
          const itemAccessType = getValues(`items.${index}.accessType`)

          return (
            <div key={field.id} className="flex items-center gap-2 w-full group">
              {/* Row Trigger Button to open Modal configuration */}
              <button
                type="button"
                onClick={() => setActiveModalIndex(index)}
                className="flex-1 flex items-center justify-between gap-4 text-left rounded-lg border border-border bg-background px-4 py-3.5 text-sm font-medium text-foreground transition-all hover:bg-muted/40 data-[state=open]:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    Item {index + 1}
                  </div>

                  <Separator orientation="vertical" className="h-4 bg-border/60" />

                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-normal text-muted-foreground">
                    <span className={`font-medium max-w-60 truncate ${folderPath ? 'text-foreground/80' : 'text-muted-foreground/60 italic'}`}>
                      {folderPath || 'Click to select folder path...'}
                    </span>

                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${folderPath ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />

                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${itemAccessType === ACCESS_TYPES.NotApplicable ? 'bg-muted-foreground/30 text-muted-foreground' : itemAccessType === ACCESS_TYPES.ReadOnly ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {ACCESS_TYPE_OPTIONS.find(option => option.id === itemAccessType)?.label || 'Unknown Access'}
                    </span>
                  </div>
                </div>


                <IconSettings className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              </button>

              {/* Explicit Row Deletion Action */}
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive hover:border-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeAccessItem(index)
                  }}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {/* Shared Configuration Modal */}
      <Dialog
        open={activeModalIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveModalIndex(null)
        }}
      >
        <DialogContent className="sm:max-w-137.5 gap-6">
          {activeModalIndex !== null && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>Item Access</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary font-bold">
                    Item {activeModalIndex + 1}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-1">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`items.${activeModalIndex}.accessType` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                          Access Type
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={String(field.value ?? ACCESS_TYPES.NotApplicable)}
                            onValueChange={(value) => field.onChange(Number(value))}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select access type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ACCESS_TYPE_OPTIONS.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {isHod && (
                    <FormField
                      control={control}
                      name={`items.${activeModalIndex}.confirmAccessTypeByHOD` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-muted-foreground">
                            HOD Confirmation
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={String(field.value ?? 0)}
                              onValueChange={(value) => field.onChange(Number(value))}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue placeholder="Not confirmed" />
                              </SelectTrigger>
                              <SelectContent>
                                {ACCESS_TYPE_OPTIONS.map((type) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="border rounded-lg p-3 bg-muted/30">
                  <FolderNavigator
                    folders={folders}
                    onPathSelect={(path) => handlePathSelect(activeModalIndex, path)}
                    maxDepth={4}
                  />
                </div>

                <FormField
                  control={control}
                  name={`items.${activeModalIndex}.reason` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium text-muted-foreground">
                        Reason for Access
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please explain why you need access to this folder..."
                          className="min-h-24 resize-none text-sm"
                          maxLength={500}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setActiveModalIndex(null)}
                >
                  Save & Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
