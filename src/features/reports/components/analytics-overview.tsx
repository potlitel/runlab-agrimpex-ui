import { Activity, Clock, Target, XCircle } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportsAnalytics } from '@/types/contract'

type AnalyticsOverviewProps = {
  analytics: ReportsAnalytics | null
  loading: boolean
  error: string | null
}

type StatCardProps = {
  title: string
  value: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ title, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
        <div className='rounded-md bg-muted p-2 text-muted-foreground'>
          <Icon className='size-4' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold tabular-nums tracking-tight'>{value}</div>
        {hint && <p className='mt-1 text-xs text-muted-foreground'>{hint}</p>}
      </CardContent>
    </Card>
  )
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: { fullLabel?: string } }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const title = payload[0]?.payload?.fullLabel ?? label
  return (
    <div className='rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md'>
      <p className='mb-1 text-xs font-medium text-muted-foreground'>{title}</p>
      <div className='space-y-1'>
        {payload.map((entry) => (
          <div key={entry.name} className='flex items-center gap-2 text-sm'>
            <span
              className='size-2.5 rounded-[2px]'
              style={{ backgroundColor: entry.color }}
            />
            <span className='text-muted-foreground'>{entry.name}:</span>
            <span className='font-medium tabular-nums'>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsOverview({ analytics, loading, error }: AnalyticsOverviewProps) {
  if (loading) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <div className='h-4 w-24 animate-pulse rounded bg-muted' />
            </CardHeader>
            <CardContent>
              <div className='h-7 w-16 animate-pulse rounded bg-muted' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className='p-6 text-sm text-destructive'>{error}</CardContent>
      </Card>
    )
  }

  if (!analytics || analytics.totalRuns === 0) {
    return (
      <Card>
        <CardContent className='p-6 text-sm text-muted-foreground'>
          No hay datos de analítica todavía. Ejecuta pruebas para generar métricas.
        </CardContent>
      </Card>
    )
  }

  const timeline = (analytics.timeline ?? []).slice(-12).map((point, index) => {
    const raw = point as Record<string, unknown>
    const ts = typeof raw.timestamp === 'string' ? raw.timestamp : ''
    const date = ts ? new Date(ts) : null
    const label = date && !Number.isNaN(date.getTime())
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `${index + 1}`
    const fullLabel = date && !Number.isNaN(date.getTime())
      ? date.toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : label
    return {
      name: label,
      fullLabel,
      passed: Number(raw.passed ?? 0),
      failed: Number(raw.failed ?? 0),
    }
  })

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Corridas'
          value={String(analytics.totalRuns)}
          hint={`${analytics.totalExecutions} ejecuciones totales`}
          icon={Activity}
        />
        <StatCard
          title='Tasa de éxito'
          value={`${analytics.passRate}%`}
          hint={`${analytics.uniquePassed}/${analytics.uniqueExecuted} tests únicos pasados`}
          icon={Target}
        />
        <StatCard
          title='Fallidos únicos'
          value={String(analytics.uniqueFailed)}
          hint={
            analytics.neverExecuted != null
              ? `${analytics.neverExecuted} nunca ejecutados`
              : undefined
          }
          icon={XCircle}
        />
        <StatCard
          title='Duración promedio'
          value={formatDuration(analytics.avgDuration)}
          icon={Clock}
        />
      </div>

      {timeline.length > 0 && (
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tendencia reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-64 rounded-md bg-transparent [&_.recharts-wrapper]:bg-transparent [&_.recharts-surface]:bg-transparent'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={timeline}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  style={{ backgroundColor: 'transparent' }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='hsl(var(--border))'
                    fill='transparent'
                  />
                  <XAxis
                    dataKey='name'
                    stroke='hsl(var(--muted-foreground))'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke='hsl(var(--muted-foreground))'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                    wrapperStyle={{ outline: 'none' }}
                  />
                  <Bar
                    dataKey='passed'
                    name='Pasados'
                    stackId='a'
                    fill='#22c55e'
                    radius={[0, 0, 0, 0]}
                    maxBarSize={44}
                    background={{ fill: 'transparent' }}
                  />
                  <Bar
                    dataKey='failed'
                    name='Fallidos'
                    stackId='a'
                    fill='#ef4444'
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                    background={{ fill: 'transparent' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className='mt-2 flex items-center gap-4 text-xs text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <span className='size-2.5 rounded-[2px] bg-emerald-500' /> Pasados
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='size-2.5 rounded-[2px] bg-red-500' /> Fallidos
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
