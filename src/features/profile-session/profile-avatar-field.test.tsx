import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProfileAvatarField } from './profile-avatar-field'

describe('ProfileAvatarField', () => {
  it('muestra la validación mientras no haya avatar', () => {
    render(<ProfileAvatarField name='Nuevo perfil' onChange={vi.fn()} />)
    expect(screen.getByRole('alert').textContent).toMatch(/elegir un avatar/i)
  })

  it('propaga el avatar confirmado al formulario', () => {
    const onChange = vi.fn()
    const view = render(<ProfileAvatarField name='Nuevo perfil' onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Elegir avatar' }))
    const firstCandidate = screen.getAllByRole('button', { name: /^Avatar \d+$/ })[0]
    fireEvent.click(firstCandidate)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    const avatar = onChange.mock.calls[0][0]
    expect(avatar).toEqual({
      style: 'notionists',
      seed: firstCandidate.getAttribute('data-seed'),
    })

    view.rerender(
      <ProfileAvatarField name='Nuevo perfil' value={avatar} onChange={onChange} />
    )
    expect(screen.getByRole('button', { name: 'Cambiar avatar' })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('cancelar el picker no muta el campo', () => {
    const onChange = vi.fn()
    render(<ProfileAvatarField name='Nuevo perfil' onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Elegir avatar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Elegir avatar' })).toBeTruthy()
  })
})
