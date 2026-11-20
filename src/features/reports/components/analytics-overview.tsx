import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReportsAnalytics } from '@/types/contract'

type AnalyticsOverviewProps = {
  analytics: ReportsAnalytics | null
  loading: boolean
  error: string | null
}

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold tabular-nums'>{value}</div>
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
    const label = ts ? new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `${index + 1}`
    return {
      name: label,
      passed: Number(raw.passed ?? 0),
      failed: Number(raw.failed ?? 0),
    }
  })

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard title='Corridas' value={String(analytics.totalRuns)} hint={`${analytics.totalExecutions} ejecuciones totales`} />
        <StatCard title='Tasa de éxito' value={`${analytics.passRate}%`} hint={`${analytics.uniquePassed}/${analytics.uniqueExecuted} tests únicos pasados`} />
        <StatCard title='Fallidos únicos' value={String(analytics.uniqueFailed)} hint={analytics.neverExecuted != null ? `${analytics.neverExecuted} nunca ejecutados` : undefined} />
        <StatCard title='Duración promedio' value={formatDuration(analytics.avgDuration)} />
      </div>

      {timeline.length > 0 && (
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tendencia reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-56'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={timeline}>
                  <XAxis dataKey='name' stroke='#888888' fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke='#888888' fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey='passed' name='Pasados' stackId='a' fill='hsl(var(--chart-2, 142 71% 45%))' radius={[2, 2, 0, 0]} />
                  <Bar dataKey='failed' name='Fallidos' stackId='a' fill='hsl(var(--chart-1, 0 84% 60%))' radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
