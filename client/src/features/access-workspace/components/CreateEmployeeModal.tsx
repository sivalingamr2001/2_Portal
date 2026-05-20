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

import { useDepartments } from "../hooks/useDepartments"
import type { AppRole, EmployeeRecord } from "../types"
import { getDepartmentName } from "../utils/departments"
import {
  createUser,
  fetchAllHod,
  type CreateUserPayload,
} from "../utils/requestApi"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IconChevronCompactDown, IconSearch } from "@tabler/icons-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

type CreateEmployeeModalProps = {
  employees: EmployeeRecord[]
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function CreateEmployeeModal({
  open,
  onClose,
  onCreated,
}: CreateEmployeeModalProps) {
  const { departments } = useDepartments()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openSearch, setOpenSearch] = useState(false)

  // Form States
  const [employeeId, setEmployeeId] = useState("")
  const [userName, setUserName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [role, setRole] = useState<AppRole>("User")
  const [password, setPassword] = useState("")

  // HOD Data State
  const [hods, setHods] = useState<any[]>([])

  const departmentName = useMemo(
    () =>
      departmentId ? getDepartmentName(departments, Number(departmentId)) : "",
    [departmentId, departments]
  )

  const parsedEmployeeId = Number(employeeId)
  const canSubmit =
    !isSaving &&
    Number.isFinite(parsedEmployeeId) &&
    parsedEmployeeId > 0 &&
    userName.trim() &&
    password.trim() &&
    departmentId

  useEffect(() => {
    if (open) {
      const getHodsDetails = async () => {
        try {
          // Note: Passing larger pageSize to get more searchable options
          const res: any = await fetchAllHod()
          setHods(res)
        } catch (e: any) {
          toast.error("Failed to fetch HOD details")
        }
      }
      getHodsDetails()
    }
  }, [open])

  const handleSelectHod = (hod: any) => {
    setEmployeeId(String(hod.EmployeeId))
    setFirstName(hod.FirstName || "")
    setLastName(hod.LastName || "")
    setEmail(hod.Email || "")
    setPhone(hod.PhoneNumber || "")
    setUserName(
      `${hod.FirstName}.${hod.LastName}`.toLowerCase().replace(/\s/g, "")
    )
    setOpenSearch(false)
  }

  const reset = () => {
    setEmployeeId("")
    setUserName("")
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setDepartmentId("")
    setRole("User")
    setPassword("")
    setError(null)
  }

  const onSubmit = async () => {
    if (!canSubmit) return
    setIsSaving(true)
    setError(null)
    try {
      const payload: CreateUserPayload = {
        employeeId: parsedEmployeeId,
        userName: userName.trim(),
        firstName,
        lastName,
        email,
        phone,
        departmentId: departmentId ? Number(departmentId) : undefined,
        departmentName,
        role,
        password,
      }

      await createUser(payload)
      onCreated()
      reset()
      onClose()
      toast.success("User created successfully")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create user.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* SEARCHABLE HOD DROPDOWN */}
          <div className="space-y-2">
            <Label className="text-blue-600">Quick Search HOD</Label>
            <Popover open={openSearch} onOpenChange={setOpenSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSearch}
                  className="w-full justify-between font-normal"
                >
                  <div className="flex items-center">
                    <IconSearch className="mr-2 h-4 w-4 opacity-50" />
                  </div>

                  <IconChevronCompactDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput placeholder="Type HOD name..." />
                  <CommandEmpty>No HOD found.</CommandEmpty>
                  <CommandGroup className="max-h-98 overflow-y-auto">
                    {hods.map((hod) => (
                      <CommandItem
                        key={hod.EmployeeId}
                        value={`${hod.FirstName} ${hod.LastName} ${hod.EmployeeId}`}
                        onSelect={() => handleSelectHod(hod)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {hod.FirstName} {hod.LastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ID: {hod.EmployeeId} | {hod.Email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <hr className="border-t" />

          {/* Row 1: Employee ID & User Name */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="createEmployeeId">EmployeeId</Label>
              <Input
                id="createEmployeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                inputMode="numeric"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createUserName">User Name</Label>
              <Input
                id="createUserName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: First Name & Last Name */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="createFirstName">First name</Label>
              <Input
                id="createFirstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createLastName">Last name</Label>
              <Input
                id="createLastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Email & Phone */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="createEmail">Email</Label>
              <Input
                id="createEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createPhone">Phone</Label>
              <Input
                id="createPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Department & Role */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.deptId} value={String(dept.deptId)}>
                      {dept.deptId} - {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Hod">HOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Password Field (Added because it is in your logic) */}
          <div className="space-y-2">
            <Label htmlFor="createPassword">Password</Label>
            <Input
              id="createPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={!canSubmit || isSaving}
          >
            {isSaving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
