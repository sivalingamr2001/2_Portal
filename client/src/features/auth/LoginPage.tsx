import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link, Navigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import type { AppRole } from "@/features/access-workspace/types"
import { useAuth } from "@/context/AuthContext"
import { getDefaultRoute } from "@/features/access-workspace/utils/accessSelectors"

const INPUT_CLASS =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"

function LoginPage() {
  const { isAuthenticated, isLoading, login, user } = useAuth()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const role = (user?.role as AppRole) || "User"
  const handleIdentifierChange = (event: ChangeEvent<HTMLInputElement>) =>
    setIdentifier(event.target.value)
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage("")
    try {
      await login(identifier, password)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed.")
    }
  }

  if (isAuthenticated) return <Navigate to={getDefaultRoute(role)} replace />

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <form
        className="w-full max-w-md rounded-[0.75rem] border border-border bg-card p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
          File Server Access
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">
          Sign in to continue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your employee ID/Username and password from the ITSR Portal.
        </p>
        <div className="mt-6 grid gap-4">
          <input
            className={INPUT_CLASS}
            value={identifier}
            onChange={handleIdentifierChange}
            placeholder="Employee ID or Username"
          />
          <input
            className={INPUT_CLASS}
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Password"
          />
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default LoginPage
