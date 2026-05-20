import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: number
  suffix?: string
  description?: string
}

export default function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  suffix,
  description,
}: KpiCardProps) {
  const isPositive = trend ? trend > 0 : undefined

  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && (
            <Icon className="w-4 h-4 text-muted-foreground opacity-60" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-foreground">
              {value}
              {suffix && <span className="text-base text-muted-foreground ml-1">{suffix}</span>}
            </div>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-2 pt-1">
              <Badge
                variant={isPositive ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
              </Badge>
              {description && (
                <span className="text-xs text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
