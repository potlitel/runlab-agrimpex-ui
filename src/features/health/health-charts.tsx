import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import type { HealthHistoryPoint } from '@/types/contract'
import { formatExactTime, formatUptime } from './health-utils'

interface ChartPoint {
  at: number
  uptime: number
}

export function HealthChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ChartPoint }>
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div
      data-testid='health-chart-tooltip'
      className='rounded-md border bg-popover px-2 py-1.5 text-xs shadow-md'
    >
      <p className='font-medium'>Tiempo activo: {formatUptime(point.uptime)}</p>
      <p className='text-muted-foreground'>Hora: {formatExactTime(point.at)}</p>
    </div>
  )
}

/** Tendencia del uptime con las muestras ya recibidas, sin consultas nuevas. */
export function HealthSparkline({
  history,
  isLoading = false,
}: {
  history: HealthHistoryPoint[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className='mt-2'>
        <Skeleton data-testid='health-sparkline-skeleton' className='h-32 w-full' />
      </div>
    )
  }

  if (history.length < 2) {
    return (
      <p className='text-xs text-muted-foreground' data-testid='health-sparkline-empty'>
        Sin datos
      </p>
    )
  }

  const data: ChartPoint[] = history.map((point) => ({
    at: point.at,
    uptime: Math.round(point.uptimeSeconds),
  }))

  return (
    <div data-testid='health-sparkline' className='mt-2 h-32 w-full'>
      <ResponsiveContainer
        width='100%'
        height='100%'
        initialDimension={{ width: 480, height: 128 }}
      >
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
          <Tooltip content={<HealthChartTooltip />} cursor={false} />
          <Area
            type='monotone'
            dataKey='uptime'
            stroke='currentColor'
            className='text-emerald-500'
            fill='currentColor'
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Porcentaje de checks correctos de la última respuesta. */
export function HealthGauge({ value }: { value: number }) {
  const percentage = Math.max(0, Math.min(100, Math.round(value)))
  const data = [
    { name: 'ok', value: percentage },
    { name: 'resto', value: 100 - percentage },
  ]

  return (
    <div
      data-testid='health-gauge'
      className='relative flex size-24 shrink-0 items-center justify-center'
      aria-label={`Salud general: ${percentage} % de checks correctos`}
    >
      <PieChart width={96} height={96}>
        <Pie
          data={data}
          dataKey='value'
          innerRadius={32}
          outerRadius={44}
          startAngle={90}
          endAngle={-270}
          stroke='none'
          isAnimationActive={false}
        >
          <Cell fill='currentColor' className='text-emerald-500' />
          <Cell fill='currentColor' className='text-muted-foreground/25' />
        </Pie>
      </PieChart>
      <span className='absolute text-sm font-semibold tabular-nums'>
        {percentage}%
      </span>
    </div>
  )
}
