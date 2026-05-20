import KpiCard from './dashboard copy/KpiCard'
import TrendChart from './dashboard copy/charts/TrendChart'
import StatusChart from './dashboard copy/charts/StatusChart'
import AccessTypeChart from './dashboard copy/charts/AccessTypeChart'
import RecentRequestsTable from './dashboard copy/tables/RecentRequestsTable'
import PendingApprovalsTable from './dashboard copy/tables/PendingApprovalsTable'
import NotificationsTable from './dashboard copy/tables/NotificationsTable'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  Loader2 as Spinner,
  Bell,
  XCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect } from 'react'
import { fetchDashboard } from './utils/requestApi'
import type { DashboardQuery, DashboardResponse } from './dashboard.types'

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: DashboardQuery = {} // Add query parameters as needed
      const result = await fetchDashboard(params)
      setData(result)
      setLastUpdated(new Date(result.generatedAt))
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refetch()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load dashboard data. {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto md:px-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary" />
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time monitoring and management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refetch}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {loading && !data ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Spinner className="h-8 w-8 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <section className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard
                  title="Total Requests"
                  value={data.summary.totalRequests}
                  icon={TrendingUp}
                  trend={8}
                  description="This period"
                />
                <KpiCard
                  title="Approved"
                  value={data.summary.approvedCount}
                  icon={CheckCircle2}
                  trend={12}
                  suffix="requests"
                />
                <KpiCard
                  title="Pending"
                  value={data.summary.pendingCount}
                  icon={Clock}
                  trend={-5}
                  suffix="requests"
                />
                <KpiCard
                  title="Rejected"
                  value={data.summary.rejectedCount}
                  icon={AlertCircle}
                  suffix="requests"
                  trend={1}
                />
                <KpiCard
                  title="Revoked"
                  value={data.summary.revokedCount}
                  icon={XCircle}
                  suffix="requests"
                  trend={-2}
                />
                <KpiCard
                  title="Agreed"
                  value={data.summary.agreedCount}
                  icon={CheckCircle2}
                  suffix="requests"
                  trend={5}
                />
                <KpiCard
                  title="Unread Notifications"
                  value={data.summary.unreadNotifications}
                  icon={Bell}
                  suffix="notifications"
                  trend={0}
                />
                <KpiCard
                  title="Approval Rate"
                  value={`${Math.round((data.summary.approvedCount / Math.max(data.summary.totalRequests, 1)) * 100)}%`}
                  trend={3}
                  description="Success rate"
                />
              </div>
            </section>

            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <StatusChart data={data.statusBreakdown} />
                <AccessTypeChart data={data.accessTypeBreakdown} />
              </div>
              
              <div className="w-full">
                <TrendChart data={data.trend} />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
