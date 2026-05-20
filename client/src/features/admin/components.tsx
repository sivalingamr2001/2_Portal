import { useEffect, useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import type { AdminRole } from "./types"

export const ADMIN_ROLES: AdminRole[] = ["Admin", "Operator", "Hod", "User"]

export function AdminPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-semibold">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            {actions}
          </CardHeader>
        </Card>
        {children}
      </div>
    </div>
  )
}

export function Toolbar({
  searchValue,
  onSearchChange,
  filter,
  onFilterChange,
  filterOptions,
  action,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  filter?: string
  onFilterChange?: (value: string) => void
  filterOptions?: string[]
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          className="sm:max-w-sm"
        />
        {filterOptions && onFilterChange ? (
          <Select value={filter ?? "all"} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function DataTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: { key: string; header: string; render: (row: never) => ReactNode }[]
  rows: readonly unknown[]
  emptyMessage: string
}) {
  return (
    <Card className="border border-border shadow-sm">
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.render(row as never)}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function EntityDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onDelete,
  submitLabel,
  deleteLabel,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (nextOpen: boolean) => void
  title: string
  description: string
  children: ReactNode
  onSubmit: () => Promise<void> | void
  onDelete?: () => Promise<void> | void
  submitLabel: string
  deleteLabel?: string
  isSubmitting?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">{children}</div>
        <DialogFooter showCloseButton>
          {onDelete ? (
            <Button variant="destructive" onClick={() => void onDelete()} disabled={isSubmitting}>
              {deleteLabel ?? "Delete"}
            </Button>
          ) : null}
          <Button onClick={() => void onSubmit()} disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function RoleSelect({
  value,
  onChange,
}: {
  value: AdminRole
  onChange: (value: AdminRole) => void
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as AdminRole)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent>
        {ADMIN_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function useDialogState<T>(initialValue: T) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    if (!open) {
      setValue(initialValue)
    }
  }, [initialValue, open])

  return { open, setOpen, value, setValue }
}
