import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { LazyMotion, MotionGlobalConfig, domAnimation } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimatedNumber } from './animated-number'

const motionState = vi.hoisted(() => ({ reduced: false }))

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return {
    ...actual,
    useReducedMotion: () => motionState.reduced,
  }
})

function renderNumber(props: ComponentProps<typeof AnimatedNumber>) {
  return render(
    <LazyMotion features={domAnimation} strict>
      <AnimatedNumber {...props} />
    </LazyMotion>
  )
}

describe('AnimatedNumber', () => {
  beforeEach(() => {
    MotionGlobalConfig.skipAnimations = true
    motionState.reduced = false
  })

  afterEach(() => {
    MotionGlobalConfig.skipAnimations = false
    motionState.reduced = false
  })

  it('termina en el valor recibido usando el formateador indicado', async () => {
    renderNumber({ value: 1234.56, format: (value) => `${value.toFixed(1)}s` })

    expect(await screen.findByText('1234.6s')).toBeTruthy()
  })

  it('actualiza el valor final cuando cambia la prop', async () => {
    const { rerender } = renderNumber({ value: 10 })

    expect(await screen.findByText('10')).toBeTruthy()

    rerender(
      <LazyMotion features={domAnimation} strict>
        <AnimatedNumber value={25} />
      </LazyMotion>
    )

    expect(await screen.findByText('25')).toBeTruthy()
  })

  it('muestra el valor final de inmediato con movimiento reducido', () => {
    motionState.reduced = true
    renderNumber({ value: 99 })

    expect(screen.getByText('99')).toBeTruthy()
  })
})
