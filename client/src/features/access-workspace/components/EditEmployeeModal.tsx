import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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

import type { EmployeeRecord, AppRole } from "../types"
import { useDepartments } from "../hooks/useDepartments"
import { getDepartmentName } from "../utils/departments"
import {
  fetchUserProfile,
  updateUserProfile,
  type UpdateUserPayload,
} from "../utils/requestApi"
import type { AuthUser } from "@/context/AuthContext"

function splitName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: "", lastName: "" }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return { firstName, lastName: rest.join(" ") }
}

type EditEmployeeModalProps = {
  employeeId: number | null
  userId: number | null
  employees: EmployeeRecord[]
  open: boolean
  onClose: () => void
  onSaved: (updated: AuthUser) => void
}

export default function EditEmployeeModal({
  employeeId,
  userId,
  open,
  onClose,
  onSaved,
}: EditEmployeeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [role, setRole] = useState<AppRole>("User")
  const { departments } = useDepartments()

  const departmentName = useMemo(
    () =>
      departmentId ? getDepartmentName(departments, Number(departmentId)) : "",
    [departmentId, departments]
  )

  useEffect(() => {
    if (!open || !userId) return
    setIsLoading(true)
    setError(null)
    void (async () => {
      try {
        const profile = await fetchUserProfile(userId)
        const name = splitName(profile.name ?? "")
        setUserName(profile.userName ?? "")
        setFirstName(name.firstName)
        setLastName(name.lastName)
        setEmail(profile.email ?? "")
        setPhone(profile.phone ?? "")
        setDepartmentId(
          profile.departmentId ? String(profile.departmentId) : ""
        )
        setRole(profile.role as AppRole)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load employee.")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [userId, open])

  useEffect(() => {
    if (departments.length > 0 && departmentId) {
      setDepartmentId((prev) => prev)
    }
  }, [departments])

  const onSubmit = async () => {
    if (!employeeId || !userId) return
    setIsSaving(true)
    setError(null)
    try {
      const payload: UpdateUserPayload = {
        userName,
        firstName,
        lastName,
        email,
        phone,
        departmentId: departmentId ? Number(departmentId) : undefined,
        departmentName,
        role,
      }
      const updated = await updateUserProfile(userId, payload)
      onSaved(updated)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update employee.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <p className="animate-pulse text-sm text-muted-foreground">
              Loading...
            </p>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Row 1: Employee ID & User Name */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="empEmployeeId">EmployeeId</Label>
                <Input
                  id="empEmployeeId"
                  value={String(employeeId ?? "")}
                  className="w-full cursor-not-allowed bg-muted"
                  disabled
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="empUserName">User Name</Label>
                <Input
                  id="empUserName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            </div>

            {/* Row 2: First Name & Last Name */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="empFirstName">First name</Label>
                <Input
                  id="empFirstName"
                  value={firstName}
                  className="w-full"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="empLastName">Last name</Label>
                <Input
                  id="empLastName"
                  value={lastName}
                  className="w-full"
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Email & Phone */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="empEmail">Email</Label>
                <Input
                  id="empEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="empPhone">Phone</Label>
                <Input
                  id="empPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Row 4: Department & Role */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.deptId} value={String(dept.deptId)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AppRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Hod">HOD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error ? (
              <p className="text-sm font-medium text-destructive">{error}</p>
            ) : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSaving || isLoading || !employeeId || !userName.trim()}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
