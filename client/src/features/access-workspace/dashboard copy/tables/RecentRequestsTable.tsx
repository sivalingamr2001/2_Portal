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
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import type { RecentRequest } from '../../types'

interface RecentRequestsTableProps {
  data: RecentRequest[]
}

const statusConfig = {
  approved: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: XCircle,
  },
}

export default function RecentRequestsTable({ data }: RecentRequestsTableProps) {
  return (
    <Card className="col-span-full xl:col-span-2 border-border/50">
      <CardHeader>
        <CardTitle>Recent Requests</CardTitle>
        <CardDescription>Latest access requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                <TableHead className="w-[100px]">Request ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Access Type</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    No recent requests available.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((request) => {
                  const statusKey = request.overallStatus.toLowerCase() as keyof typeof statusConfig
                  const config = statusConfig[statusKey]
                  const Icon = config.icon
                  return (
                    <TableRow key={request.accessReqId} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {request.accessReqId}
                      </TableCell>
                      <TableCell className="font-medium">{request.empName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.itemCount} items</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <Badge variant={config.variant} className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.createdOn), { addSuffix: true })}
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
