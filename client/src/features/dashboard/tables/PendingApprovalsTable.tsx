import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X } from 'lucide-react'
import type { PendingApproval } from '@/features/dashboard/types'

interface PendingApprovalsTableProps {
  data: PendingApproval[]
}

export default function PendingApprovalsTable({ data }: PendingApprovalsTableProps) {
  return (
    <Card className="col-span-full border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Pending Approvals</CardTitle>
        <CardDescription>Awaiting review</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-muted/50">
                <TableHead>User</TableHead>
                <TableHead className="w-[80px]">Type</TableHead>
                <TableHead className="w-[60px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                    No pending approvals at the moment.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((approval) => (
                  <TableRow key={approval.accessApproveId} className="hover:bg-muted/30 text-xs">
                    <TableCell className="font-medium truncate">{approval.approverId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {approval.accessType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-green-500/20"
                          title="Approve"
                        >
                          <Check className="w-3 h-3 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-red-500/20"
                          title="Reject"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
