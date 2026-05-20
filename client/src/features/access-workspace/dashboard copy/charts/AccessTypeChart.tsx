import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AccessTypeBreakdown } from '../../types'

interface AccessTypeChartProps {
  data: AccessTypeBreakdown[]
}

export default function AccessTypeChart({ data }: AccessTypeChartProps) {
  const chartColor = 'hsl(var(--color-chart-4))'

  return (
    <Card className="col-span-full sm:col-span-1 lg:col-span-1 border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Access Types</CardTitle>
        <CardDescription>Breakdown by type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 100, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" />
            <XAxis
              type="number"
              stroke="hsl(var(--color-muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              dataKey="accessType"
              type="category"
              stroke="hsl(var(--color-muted-foreground))"
              style={{ fontSize: '12px' }}
              width={90}
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
              formatter={(value: any) => [value, 'Count']}
            />
            <Bar dataKey="count" fill={chartColor} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{item.accessType}</span>
              <span className="font-medium text-foreground">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
