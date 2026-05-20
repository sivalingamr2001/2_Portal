import { useEffect, useState } from "react"

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

import { updateUserPassword } from "../utils/requestApi"

type ResetPasswordModalProps = {
  employeeId: number | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}

export default function ResetPasswordModal({
  employeeId,
  open,
  onClose,
  onSaved,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPassword("")
    setConfirmPassword("")
    setError(null)
  }, [open])

  const canSubmit =
    !isSaving &&
    Boolean(employeeId) &&
    password.trim().length > 0 &&
    password === confirmPassword

  const onSubmit = async () => {
    if (!employeeId || !canSubmit) return
    setIsSaving(true)
    setError(null)
    try {
      await updateUserPassword(employeeId, password)
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update password.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {password && confirmPassword && password !== confirmPassword ? (
            <p className="text-sm text-destructive">Passwords do not match.</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={!canSubmit}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
