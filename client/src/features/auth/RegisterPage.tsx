import { useState, useEffect, type ChangeEvent, type FormEvent } from "react" // 1. Added useEffect
import { Navigate, Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import type { AppRole } from "@/features/access-workspace/types"
import { useAuth } from "@/context/AuthContext"
import { getDefaultRoute } from "@/features/access-workspace/utils/accessSelectors"

const INPUT_CLASS =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"

function RegisterPage() {
  const { isAuthenticated, isLoading, register, user } = useAuth()
  const [errorMessage, setErrorMessage] = useState("")

  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    user_name: "",
    email: "",
    mobile: "",
    dept_id: "",
    location: "",
    password: "",
    confirmPassword: "",
  })

  // 2. Real-time validation logic
  useEffect(() => {
    if (
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      setErrorMessage("Passwords do not match.")
    } else {
      setErrorMessage("")
    }
  }, [formData.password, formData.confirmPassword])

  const role =
    (user?.role as AppRole) || "User"

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Final check before submission
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    try {
      const { confirmPassword, ...submitData } = formData
      await register(submitData)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Registration failed."
      )
    }
  }

  if (isAuthenticated) return <Navigate to={getDefaultRoute(role)} replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <form
        className="w-full max-w-2xl rounded-[0.75rem] border border-border bg-card p-8 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
            File Server Access
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">
            Create account
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            className={INPUT_CLASS}
            name="employee_id"
            placeholder="Employee ID"
            value={formData.employee_id}
            onChange={handleChange}
            required
          />
          <input
            className={INPUT_CLASS}
            name="user_name"
            placeholder="Username"
            value={formData.user_name}
            onChange={handleChange}
            required
          />
          <input
            className={INPUT_CLASS}
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          <input
            className={INPUT_CLASS}
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          <input
            className={INPUT_CLASS}
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            className={INPUT_CLASS}
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={formData.mobile}
            onChange={handleChange}
            required
          />
          <input
            className={INPUT_CLASS}
            name="dept_id"
            placeholder="Department ID"
            value={formData.dept_id}
            onChange={handleChange}
            required
          />
          <input
            className={INPUT_CLASS}
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />
          <input
            className={INPUT_CLASS}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            // 3. Highlight input if it doesn't match
            className={`${INPUT_CLASS} ${errorMessage === "Passwords do not match." ? "border-destructive focus:border-destructive" : ""}`}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mt-6 space-y-4">
          {errorMessage && (
            <p className="text-center text-sm font-medium text-destructive">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !!errorMessage} // 4. Disable button if mismatch
          >
            {isLoading ? "Creating Account..." : "Register"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default RegisterPage
