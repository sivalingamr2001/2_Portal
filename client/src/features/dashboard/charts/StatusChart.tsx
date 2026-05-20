import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import type { StatusBreakdown } from '@/features/dashboard/types'

interface StatusChartProps {
  data: StatusBreakdown[]
}

const COLORS = [
  'hsl(var(--color-chart-1))',
  'hsl(var(--color-chart-2))',
  'hsl(var(--color-chart-3))',
]

export default function StatusChart({ data }: StatusChartProps) {
  return (
    <Card className="col-span-full sm:col-span-1 lg:col-span-1 border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Status Distribution</CardTitle>
        <CardDescription>Request statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--color-card))',
                border: `1px solid hsl(var(--color-border))`,
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{
                color: 'hsl(var(--color-foreground))',
              }}
              formatter={(value: any) => `${value}%`}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="percentage"
              label={(entry) => `${entry.payload.status}: ${entry.percent}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-foreground">{item.status}</span>
              </div>
              <span className="font-medium text-foreground">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
