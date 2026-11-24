import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ExecutionEmptyStateProps = {
  icon: ComponentType<{ className?: string }>
  title: string
  description: ReactNode
  action?: ReactNode
  variant?: 'default' | 'terminal'
  className?: string
}

export function ExecutionEmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: ExecutionEmptyStateProps) {
  const terminal = variant === 'terminal'

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center sm:flex-row sm:text-start',
        terminal && 'border-zinc-800 bg-zinc-900/60',
        className
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground',
          terminal && 'border-zinc-700 bg-zinc-900 text-emerald-400'
        )}
      >
        <Icon className='size-5' />
      </span>
      <div className='min-w-0 flex-1 space-y-1'>
        <p className={cn('text-sm font-medium', terminal && 'text-zinc-100')}>
          {title}
        </p>
        <div
          className={cn(
            'text-xs text-muted-foreground',
            terminal && 'text-zinc-400'
          )}
        >
          {description}
        </div>
      </div>
      {action && (
        <div className='flex shrink-0 flex-wrap justify-center gap-2 text-foreground sm:justify-end'>
          {action}
        </div>
      )}
    </div>
  )
}
