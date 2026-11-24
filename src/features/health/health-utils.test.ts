import { describe, expect, it } from 'vitest'
import {
  formatRelativeTime,
  sanitizeCheckMessage,
  secondsUntilNextPoll,
} from './health-utils'

describe('health-utils', () => {
  it('conserva el texto genérico y elimina errores crudos y secretos', () => {
    const detail = sanitizeCheckMessage(
      'Error: ENOENT\n    at /home/potlitel/app/routes/health.js:42 TOKEN=abc123 process.env.SECRET_KEY=xyz',
      'unhealthy'
    )

    expect(detail).toContain('ENOENT')
    expect(detail).not.toContain('Error:')
    expect(detail).not.toContain('/home/')
    expect(detail).not.toContain('health.js')
    expect(detail).not.toContain('TOKEN')
    expect(detail).not.toContain('SECRET_KEY')
  })

  it('usa un mensaje genérico cuando no queda texto seguro', () => {
    expect(sanitizeCheckMessage(undefined, 'not_configured')).toBe(
      'Configuración pendiente.'
    )
    expect(sanitizeCheckMessage('Bearer eyJhbGciOi.SECRET.SIG', 'unhealthy')).toBe(
      'Sin detalles adicionales.'
    )
  })

  it('limita la cuenta regresiva a 30 s y a 0 s', () => {
    expect(secondsUntilNextPoll(undefined, 1000)).toBe(30)
    expect(secondsUntilNextPoll(1000, 1000)).toBe(30)
    expect(secondsUntilNextPoll(1000, 16_000)).toBe(15)
    expect(secondsUntilNextPoll(1000, 40_000)).toBe(0)
  })

  it('formatea tiempos relativos en segundos, minutos y horas', () => {
    expect(formatRelativeTime(undefined, 5000)).toBe('Hace un momento')
    expect(formatRelativeTime(1000, 6000)).toBe('Hace 5 s')
    expect(formatRelativeTime(1000, 121_000)).toBe('Hace 2 min')
    expect(formatRelativeTime(1000, 3_601_000)).toBe('Hace 1 h')
  })
})
