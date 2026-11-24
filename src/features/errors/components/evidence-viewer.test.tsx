import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EvidenceItem } from '@/types/contract'
import { normalizeEvidenceMetadata } from '@/lib/evidence'
import { EvidencePreview } from './evidence-viewer'

const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='

function imageItem(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return normalizeEvidenceMetadata({
    id: 'report:r1:capture',
    name: 'screenshot-T1-01-registro-creado',
    displayName: 'screenshot-T1-01-registro-creado',
    kind: 'image',
    source: 'report',
    url: PNG_1X1,
    status: 'passed',
    evidenceSource: 'capture',
    captureName: 'screenshot-T1-01-registro-creado',
    contentType: 'image/png',
    width: 1280,
    height: 720,
    ...overrides,
  })
}

describe('EvidencePreview', () => {
  it('conserva la proporción y permite ampliar la imagen original', () => {
    render(<EvidencePreview item={imageItem()} />)
    const image = screen.getByAltText('screenshot-T1-01-registro-creado') as HTMLImageElement
    expect(image.className).toContain('object-contain')
    expect(image.style.width).toBe('100%')
    expect(image.style.aspectRatio).toBe('1280 / 720')

    fireEvent.click(screen.getByRole('button', { name: 'Ampliar zoom' }))
    expect(image.style.width).toBe('150%')
    fireEvent.click(screen.getByRole('button', { name: 'Reducir zoom' }))
    expect(image.style.width).toBe('100%')
  })

  it('muestra el error solo en la imagen que falla', () => {
    render(
      <div>
        <EvidencePreview item={imageItem({ id: 'rota', displayName: 'imagen-rota' })} />
        <EvidencePreview item={imageItem({ id: 'valida', displayName: 'imagen-valida' })} />
      </div>,
    )
    const broken = screen.getByAltText('imagen-rota') as HTMLImageElement
    fireEvent.error(broken)

    expect(screen.getByText('No se pudo cargar la imagen.')).toBeTruthy()
    expect(screen.queryByAltText('imagen-rota')).toBeNull()
    expect(screen.getByAltText('imagen-valida')).toBeTruthy()
  })

  it('no aplica zoom a vídeos ni a trazas', () => {
    const video = imageItem({ id: 'video', kind: 'video', displayName: 'video-fallo' })
    render(<EvidencePreview item={video} />)
    expect(screen.queryByRole('button', { name: 'Ampliar zoom' })).toBeNull()
    expect(document.querySelector('video')).toBeTruthy()
  })
})
