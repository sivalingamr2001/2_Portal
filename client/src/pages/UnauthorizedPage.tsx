import { Link } from "react-router-dom"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-3xl rounded-[1rem] border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-primary">Unauthorized</p>
        <h1 className="mt-4 text-3xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your current user role does not have permission to access this page.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/me"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            View my profile
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-accent"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  )
}
