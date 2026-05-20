import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import type { TrendPoint } from '@/features/dashboard/types'

interface TrendChartProps {
  data: TrendPoint[]
}

export default function TrendChart({ data }: TrendChartProps) {
  const chartConfig = {
    submitted: {
      label: 'Submitted',
      color: 'hsl(var(--color-chart-1))',
    },
    approved: {
      label: 'Approved',
      color: 'hsl(var(--color-chart-2))',
    },
    rejected: {
      label: 'Rejected',
      color: 'hsl(var(--color-chart-3))',
    },
    revoked: {
      label: 'Revoked',
      color: 'hsl(var(--color-red-500))',
    },
  }

  return (
    <Card className="col-span-full xl:col-span-2 border-border/50">
      <CardHeader>
        <CardTitle>Access Requests Trend</CardTitle>
        <CardDescription>
          Last 7 days performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.submitted.color}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.submitted.color}
                  stopOpacity={0.01}
                />
              </linearGradient>
              <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.approved.color}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.approved.color}
                  stopOpacity={0.01}
                />
              </linearGradient>
              <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={chartConfig.rejected.color}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={chartConfig.rejected.color}
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--color-muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="hsl(var(--color-muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--color-card))',
                border: `1px solid hsl(var(--color-border))`,
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{
                color: 'hsl(var(--color-foreground))',
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '1rem',
              }}
            />
            <Area
              type="monotone"
              dataKey="submitted"
              stroke={chartConfig.submitted.color}
              fillOpacity={1}
              fill="url(#colorSubmitted)"
              name={chartConfig.submitted.label}
            />
            <Area
              type="monotone"
              dataKey="approved"
              stroke={chartConfig.approved.color}
              fillOpacity={1}
              fill="url(#colorApproved)"
              name={chartConfig.approved.label}
            />
            <Area
              type="monotone"
              dataKey="rejected"
              stroke={chartConfig.rejected.color}
              fillOpacity={1}
              fill="url(#colorRejected)"
              name={chartConfig.rejected.label}
            />
            <Area
              type="monotone"
              dataKey="revoked"
              stroke={chartConfig.revoked.color}
              fillOpacity={0.15}
              fill={chartConfig.revoked.color}
              name={chartConfig.revoked.label}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
