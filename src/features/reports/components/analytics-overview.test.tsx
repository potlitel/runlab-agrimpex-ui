import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReportsAnalytics } from '@/types/contract'
import { AnalyticsOverview } from './analytics-overview'

type BarProps = {
  dataKey?: string
  fill?: string
  background?: unknown
}

type TooltipContentProps = {
  active?: boolean
  label?: string
  payload?: Array<{
    name?: string
    value?: number
    color?: string
    payload?: { fullLabel?: string }
  }>
}

const captured = vi.hoisted(() => ({
  tooltipCursor: undefined as unknown,
  tooltipContent: undefined as ReactNode,
  bars: [] as BarProps[],
}))

vi.mock('recharts', () => {
  const Container = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Empty = () => null
  const Tooltip = ({ cursor, content }: { cursor?: unknown; content?: ReactNode }) => {
    captured.tooltipCursor = cursor
    captured.tooltipContent = content
    return <div data-testid='trend-tooltip' />
  }
  const Bar = (props: BarProps) => {
    captured.bars.push(props)
    return <div data-testid={`trend-bar-${props.dataKey}`} />
  }
  return {
    Bar,
    BarChart: Container,
    CartesianGrid: Empty,
    ResponsiveContainer: Container,
    Tooltip,
    XAxis: Empty,
    YAxis: Empty,
  }
})

const analytics: ReportsAnalytics = {
  totalRuns: 1,
  totalExecutions: 4,
  totalPassed: 0,
  totalFailed: 4,
  passRate: 0,
  avgDuration: 1.5,
  totalAvailable: 4,
  uniqueExecuted: 4,
  uniquePassed: 0,
  uniqueFailed: 4,
  neverExecuted: 736,
  byFile: [],
  timeline: [
    {
      timestamp: '2026-11-24T21:09:00.000Z',
      passed: 0,
      failed: 4,
    },
  ],
}

describe('AnalyticsOverview — tendencia reciente', () => {
  beforeEach(() => {
    captured.tooltipCursor = undefined
    captured.tooltipContent = undefined
    captured.bars = []
  })

  it('usa un cursor de tooltip transparente para no pintar fondo sobre las barras', () => {
    render(<AnalyticsOverview analytics={analytics} loading={false} error={null} />)

    expect(screen.getByText('Tendencia reciente')).toBeTruthy()
    expect(captured.tooltipCursor).toEqual({ fill: 'transparent' })
  })

  it('conserva los colores de las barras y los valores del tooltip', () => {
    render(<AnalyticsOverview analytics={analytics} loading={false} error={null} />)

    const bars = Object.fromEntries(captured.bars.map((bar) => [bar.dataKey, bar]))
    expect(bars.passed?.fill).toBe('#22c55e')
    expect(bars.failed?.fill).toBe('#ef4444')
    expect(bars.passed?.background).toEqual({ fill: 'transparent' })
    expect(bars.failed?.background).toEqual({ fill: 'transparent' })

    const content = captured.tooltipContent as ReactElement<TooltipContentProps>
    render(
      cloneElement(content, {
        active: true,
        label: '21:09',
        payload: [
          {
            name: 'Pasados',
            value: 0,
            color: '#22c55e',
            payload: { fullLabel: '24 nov, 21:09' },
          },
          {
            name: 'Fallidos',
            value: 4,
            color: '#ef4444',
            payload: { fullLabel: '24 nov, 21:09' },
          },
        ],
      })
    )

    expect(screen.getByText('24 nov, 21:09')).toBeTruthy()
    expect(screen.getByText('Pasados:').parentElement?.textContent).toContain('0')
    expect(screen.getByText('Fallidos:').parentElement?.textContent).toContain('4')
  })
})
