import { useEffect } from 'react'
import {
  MotionGlobalConfig,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { SPRING_SOFT } from '@/lib/motion'

export type AnimatedNumberProps = {
  /** Valor objetivo; los cambios se animan con un spring corto. */
  value: number
  /** Formateador opcional; recibe el valor interpolado. */
  format?: (value: number) => string
  /** Decimales del formateador por defecto. */
  decimals?: number
  className?: string
}

function defaultFormat(decimals: number) {
  return (value: number) =>
    new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
}

export function AnimatedNumber({
  value,
  format,
  decimals = 0,
  className,
}: AnimatedNumberProps) {
  const instant = useReducedMotion() || MotionGlobalConfig.skipAnimations
  const source = useMotionValue(instant ? value : 0)
  const spring = useSpring(source, SPRING_SOFT)
  const formatter = format ?? defaultFormat(decimals)
  const display = useTransform(spring, (latest) => formatter(latest))

  useEffect(() => {
    if (instant) {
      source.jump(value)
      spring.jump(value)
      return
    }
    source.set(value)
  }, [instant, source, spring, value])

  return (
    <m.span className={className}>
      {instant ? formatter(value) : display}
    </m.span>
  )
}
