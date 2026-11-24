import { Area, AreaChart, Cell, Pie, PieChart } from 'recharts'
import type { HealthHistoryPoint } from '@/types/contract'

/** Tendencia del uptime con las muestras ya recibidas, sin consultas nuevas. */
export function HealthSparkline({
  history,
}: {
  history: HealthHistoryPoint[]
}) {
  if (history.length < 2) {
    return (
      <p className='text-xs text-muted-foreground' data-testid='health-sparkline-empty'>
        Sin datos
      </p>
    )
  }

  const data = history.map((point, index) => ({
    label: index + 1,
    uptime: Math.round(point.uptimeSeconds),
  }))

  return (
    <div data-testid='health-sparkline' className='overflow-hidden'>
      <AreaChart
        width={260}
        height={64}
        data={data}
        margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
        aria-label='Historial del tiempo activo'
      >
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
