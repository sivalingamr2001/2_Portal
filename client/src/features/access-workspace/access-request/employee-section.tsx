'use client'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import type { AuthUser } from '@/context/AuthContext'
import type { AccessRequestPayload } from '@/lib/access-request-schema'
import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { IconLoader2 } from '@tabler/icons-react'

interface EmployeeSectionProps {
  form: UseFormReturn<AccessRequestPayload>
  currentUser: AuthUser | null
  onEmployeeChange?: (empId: number) => void
}

export function EmployeeSection({
  form,
  currentUser,
  onEmployeeChange,
}: EmployeeSectionProps) {
  const [isFetching, setIsFetching] = useState(false)
  const [fetchedUser, setFetchedUser] = useState<AuthUser | null>(null)

  const displayUser = fetchedUser || currentUser

  useEffect(() => {
    if (currentUser) {
      form.setValue('empId', currentUser.employeeId)
      form.setValue('reqTo', currentUser.departmentHod?.employeeId ?? 0)
    }
  }, [currentUser, form])

  const handleEmpIdChange = async (empId: number) => {
    form.setValue('empId', empId)
    onEmployeeChange?.(empId)

    if (empId > 0 && empId !== currentUser?.employeeId) {
      setIsFetching(true)
      try {
        // TODO: Fetch user by ID
        // For now, just set reqTo to 0
        form.setValue('reqTo', 0)
        setFetchedUser(null)
      } finally {
        setIsFetching(false)
      }
    } else if (empId === currentUser?.employeeId) {
      setFetchedUser(null)
      form.setValue('reqTo', currentUser?.departmentHod?.employeeId ?? 0)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground">Employee Information</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="empId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">
                Employee ID
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter employee ID"
                    className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-sm"
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10) || 0
                      field.onChange(value)
                      handleEmpIdChange(value)
                    }}
                  />
                  {isFetching && (
                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                      <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Employee Name</label>
          <Input
            value={displayUser ? `${displayUser.name}` : "User not found"}
            readOnly
            className="bg-muted text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Employee Email</label>
          <Input
            value={displayUser?.email || ""}
            readOnly
            className="bg-muted font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">HOD (Approval Authority)</label>
          <Input
            value={
              displayUser?.departmentHod
                ? `${displayUser.departmentHod.employeeId} - ${displayUser.departmentHod.name}`
                : "No HOD assigned"
            }
            readOnly
            className="bg-muted text-sm"
          />
          <p className="text-xs text-muted-foreground/70">
            Your request will be sent to this HOD first. Folder-specific HODs may also be notified if the selected folder maps to a different owner.
          </p>
        </div>

        <FormField
          control={form.control}
          name="itsrNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">
                ITSR #
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="ITSR-001"
                  className="text-sm"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
