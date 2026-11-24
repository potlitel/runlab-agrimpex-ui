import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AvatarPickerDialog } from './avatar-picker-dialog'

const CURRENT = { style: 'notionists' as const, seed: 'semilla-actual' }

function renderDialog() {
  const onConfirm = vi.fn()
  const onOpenChange = vi.fn()
  render(
    <AvatarPickerDialog
      open
      value={CURRENT}
      profileId='perfil-1'
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  )
  return { onConfirm, onOpenChange }
}

function candidates() {
  return screen.getAllByRole('button', { name: /^Avatar \d+$/ })
}

describe('AvatarPickerDialog', () => {
  it('abre con 24 candidatos y resalta el avatar actual', () => {
    renderDialog()
    expect(candidates()).toHaveLength(24)
    expect(candidates()[0].getAttribute('aria-pressed')).toBe('true')
    expect(candidates()[0].getAttribute('data-seed')).toBe(CURRENT.seed)
  })

  it('genera otros candidatos sin perder la selección confirmada', () => {
    renderDialog()
    const before = candidates()[0].getAttribute('data-seed')
    fireEvent.click(screen.getByRole('button', { name: 'Generar otros' }))
    expect(candidates()).toHaveLength(24)
    expect(candidates()[0].getAttribute('data-seed')).not.toBe(before)
    expect(screen.getByRole('button', { name: 'Confirmar' }).hasAttribute('disabled')).toBe(false)
  })

  it('regenera los candidatos al cambiar de estilo y limpia la selección', () => {
    renderDialog()
    const tab = screen.getByRole('tab', { name: 'Bottts' })
    fireEvent.mouseDown(tab, { button: 0 })
    fireEvent.click(tab)
    expect(candidates().every((button) => button.getAttribute('data-style') === 'bottts')).toBe(true)
    expect(screen.getByRole('button', { name: 'Confirmar' }).hasAttribute('disabled')).toBe(true)
  })

  it('confirma solo después de elegir un avatar', () => {
    const { onConfirm, onOpenChange } = renderDialog()
    fireEvent.click(candidates()[1])
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalledWith({
      style: 'notionists',
      seed: candidates()[1].getAttribute('data-seed'),
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('cancelar no notifica ninguna selección', () => {
    const { onConfirm, onOpenChange } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
