import { formatExactTime, POLL_INTERVAL_SECONDS } from './health-utils'

/**
 * Anillo de progreso inverso del sondeo automático. El arco se dibuja a medida
 * que se consume el intervalo de 30 s y se reinicia con cada respuesta.
 */
export function HealthPollTimer({
  remainingSeconds,
  dataUpdatedAt,
  isFetching,
}: {
  remainingSeconds: number
  dataUpdatedAt: number
  isFetching: boolean
}) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (remainingSeconds / POLL_INTERVAL_SECONDS)

  return (
    <div className='flex items-center gap-2' data-testid='health-poll-timer'>
      <div
        data-testid='health-poll-ring'
        className='relative size-16 shrink-0'
        title={`Próximo sondeo en ${remainingSeconds} s`}
      >
        <svg
          width='64'
          height='64'
          viewBox='0 0 64 64'
          className='-rotate-90'
          aria-hidden='true'
        >
          <circle
            cx='32'
            cy='32'
            r={radius}
            fill='none'
            strokeWidth='4'
            className='stroke-muted/40'
          />
          <circle
            cx='32'
            cy='32'
            r={radius}
            fill='none'
            strokeWidth='4'
            strokeLinecap='round'
            className='stroke-emerald-500 dark:stroke-emerald-400'
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className='absolute inset-0 flex flex-col items-center justify-center'>
          <span
            data-testid='health-countdown'
            aria-label={`Próximo sondeo en ${remainingSeconds} segundos`}
            className='text-base font-semibold tabular-nums leading-none'
          >
            {remainingSeconds}
          </span>
          <span className='text-[10px] text-muted-foreground'>s</span>
        </span>
        {isFetching ? (
          <span
            data-testid='health-refresh-pulse'
            aria-label='Refrescando estado'
            className='absolute -top-0.5 -right-0.5 size-2.5 animate-pulse rounded-full bg-emerald-500 ring-2 ring-background'
          />
        ) : null}
      </div>
      <div className='flex flex-col gap-0.5 text-xs'>
        <span className='font-medium'>Próximo sondeo</span>
        {dataUpdatedAt ? (
          <span
            data-testid='health-last-updated'
            className='text-muted-foreground'
            title={new Date(dataUpdatedAt).toLocaleString()}
          >
            Actualizado: {formatExactTime(dataUpdatedAt)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
