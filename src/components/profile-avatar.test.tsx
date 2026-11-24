import { fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ProfileAvatar } from './profile-avatar'

const completeDescriptor = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  'complete'
)
const widthDescriptor = Object.getOwnPropertyDescriptor(
  HTMLImageElement.prototype,
  'naturalWidth'
)

afterEach(() => {
  if (completeDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', completeDescriptor)
  }
  if (widthDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', widthDescriptor)
  }
})

describe('ProfileAvatar', () => {
  it('renderiza el data URI del avatar indicado', () => {
    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
      configurable: true,
      get: () => true,
    })
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get: () => 64,
    })
    const { container } = render(
      <ProfileAvatar
        name='Perfil QA'
        profileId='perfil-1'
        avatar={{ style: 'bottts', seed: 'semilla' }}
      />
    )
    const image = container.querySelector('img')
    expect(image).toBeTruthy()
    expect(image?.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
    expect(image?.getAttribute('alt')).toBe('Perfil QA')
  })

  it('muestra las iniciales cuando no hay imagen disponible', () => {
    const { container, getByText } = render(
      <ProfileAvatar name='Perfil Sin Avatar' profileId='perfil-2' />
    )
    const image = container.querySelector('img')
    if (image) fireEvent.error(image)
    expect(getByText('PS')).toBeTruthy()
  })
})
