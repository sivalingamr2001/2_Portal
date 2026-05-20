import { useEffect, useMemo, useState } from "react"

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
import { STORAGE_KEY, useAuth } from "@/context/AuthContext"

import { IconAlertCircle } from "@tabler/icons-react"
import { useDepartments } from "../hooks/useDepartments"
import { getDepartmentName } from "../utils/departments"
import { updateUserProfile } from "../utils/requestApi"

function splitName(fullName: string) {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: "", lastName: "" }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return { firstName, lastName: rest.join(" ") }
}

function isProfileIncomplete(user: any) {
  return (
    !!user &&
    ([null, undefined, 0, "0"].includes(user.employeeId))
  )
}

export default function UserProfileCompletionModal() {
  const { user, setSessionUser } = useAuth()
  const open = useMemo(() => isProfileIncomplete(user), [user])
  const { departments } = useDepartments()

  const initialName = useMemo(() => splitName(user?.name ?? ""), [user?.name])
  const [employeeId, setEmployeeId] = useState<number | undefined>(
    user?.employeeId
  )
  const [firstName, setFirstName] = useState(initialName.firstName)
  const [lastName, setLastName] = useState(initialName.lastName)
  const [userName, setUserName] = useState(user?.userName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [departmentId, setDepartmentId] = useState(
    user?.departmentId ? String(user.departmentId) : ""
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const name = splitName(user.name ?? "")
    setEmployeeId(user.employeeId)
    setFirstName(name.firstName)
    setLastName(name.lastName)
    setUserName(user.userName ?? "")
    setEmail(user.email ?? "")
    setPhone(user.phone ?? "")
    setDepartmentId(user.departmentId ? String(user.departmentId) : "")
    setError(null)
  }, [user])

  if (!user) return null

  const departmentName = departmentId
    ? getDepartmentName(departments, Number(departmentId))
    : ""

  const onSubmit = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateUserProfile(user.userId, {
        employeeId,
        userName,
        firstName,
        lastName,
        email,
        phone,
        departmentId: departmentId ? Number(departmentId) : undefined,
        departmentName,
      })
      setSessionUser(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update profile.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>
            Please fill in your details to continue using the portal.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
          <IconAlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">
            Warning: This is a one-time update. Please validate your data
            carefully before saving.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                className="border-primary"
                value={String(employeeId ?? "")}
                onChange={(e) =>
                  setEmployeeId(e.target.value ? Number(e.target.value) : undefined)
                }
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">User Name</Label>
              <Input id="userName" value={userName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={departmentName || "No department assigned"}
              readOnly
              className="bg-muted"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>


        <DialogFooter>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={
              isSaving ||
              !employeeId ||
              !userName.trim() ||
              !firstName.trim() ||
              !email.trim() ||
              !phone.trim() ||
              !departmentId
            }
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              window.location.reload()
            }}
          >
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
