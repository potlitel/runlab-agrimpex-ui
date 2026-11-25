import type { Transition, Variants } from 'motion/react'

/** Curva de salida compartida por las entradas del dashboard. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Spring corto para números y badges que cambian en vivo. */
export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
  mass: 0.8,
}

export const DURATION = {
  fast: 0.15,
  base: 0.4,
  slow: 0.5,
} as const

/** Separación entre secciones en la entrada escalonada. */
export const STAGGER = 0.06

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: STAGGER,
      delayChildren: 0.04,
    },
  },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATION.fast, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast, ease: 'easeIn' },
  },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: SPRING_SOFT,
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: { duration: DURATION.fast, ease: 'easeIn' },
  },
}

export const collapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}
