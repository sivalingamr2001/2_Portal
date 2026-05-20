import { formatDistanceToNow } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import type { AuditLog } from '@/features/dashboard/types'

interface NotificationsTableProps {
  data: AuditLog[]
}

const statusConfig = {
  success: {
    label: 'Success',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  warning: {
    label: 'Warning',
    variant: 'secondary' as const,
    icon: AlertTriangle,
  },
  error: {
    label: 'Error',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
}

export default function NotificationsTable({ data }: NotificationsTableProps) {
  return (
    <Card className="col-span-full border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <CardDescription>System notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                <TableHead>Action</TableHead>
                <TableHead className="w-[70px]">Status</TableHead>
                <TableHead className="text-right text-xs">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                    No recent activity available.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((log) => {
                  const config = statusConfig.success // Default to success
                  const Icon = config.icon
                  return (
                    <TableRow key={log.auditId} className="hover:bg-muted/30 text-xs">
                      <TableCell className="font-medium truncate max-w-[150px]">
                        {log.eventType}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          <Badge variant={config.variant} className="text-xs px-1.5 py-0">
                            {config.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdOn), { addSuffix: false })} ago
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
