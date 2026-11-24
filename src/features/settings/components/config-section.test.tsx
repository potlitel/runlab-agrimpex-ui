import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  EVIDENCE_DEFAULTS,
  type Config,
  type ConfigSaveResponse,
} from '@/types/contract'
import type { UseConfigSettingsReturn } from '../use-config-settings'

// Radix Select necesita APIs de puntero no disponibles en jsdom: se sustituye
// por un <select> nativo que recibe el id del trigger para asociar el label.
vi.mock('@/components/ui/select', async () => {
  const { Children, cloneElement, isValidElement } = await import('react')

  function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
    return <option value={value}>{children}</option>
  }
  function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }
  function SelectTrigger({ id, value, onChange, children }: {
    id?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
    children: React.ReactNode
  }) {
    return <select id={id} value={value} onChange={onChange}>{children}</select>
  }

  return {
    Select: ({ value, onValueChange, children }: {
      value?: string
      onValueChange: (value: string) => void
      children: React.ReactNode
    }) => {
      type Part = React.ReactElement<{
        children?: React.ReactNode
        value?: string
        onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
      }>
      const parts = Children.toArray(children).filter(
        (p): p is Part => isValidElement(p),
      )
      const trigger = parts.find((p) => p.type === SelectTrigger)
      const content = parts.find((p) => p.type === SelectContent)
      if (!trigger) return <div>{children}</div>
      const options = content?.props.children
      return (
        <div>
          {cloneElement(
            trigger,
            {
              value: value ?? '',
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
                onValueChange(e.target.value),
            },
            options,
          )}
        </div>
      )
    },
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue: ({ placeholder }: { placeholder?: string }) => (
      <option value=''>{placeholder}</option>
    ),
  }
})

import { ConfigSection } from './config-section'

function makeSettings(config: Config, onSave: (payload: Config) => void) {
  const settings = {
    config,
    loading: false,
    error: null,
    refetch: vi.fn(),
    save: vi.fn(async (payload: Config): Promise<ConfigSaveResponse> => {
      onSave(payload)
      return { success: true, config: payload }
    }),
    saving: false,
    validate: vi.fn(),
    validating: false,
    validation: null,
    clearValidation: vi.fn(),
    detectEnv: vi.fn(),
    detecting: false,
    browse: vi.fn(),
    browsing: null,
  }
  return settings as unknown as UseConfigSettingsReturn
}

describe('ConfigSection — opciones de evidencia', () => {
  it('guarda formato, calidad y escala y los muestra tras recargar el perfil', async () => {
    const savedRef: { config?: Config } = {}
    const initial: Config = { projectPath: '/proyecto' }
    const view = render(
      <ConfigSection settings={makeSettings(initial, (payload) => { savedRef.config = payload })} />,
    )

    fireEvent.change(screen.getByLabelText('Formato de captura'), { target: { value: 'jpeg' } })
    fireEvent.change(screen.getByLabelText('Calidad JPEG (1–100)'), { target: { value: '72' } })
    fireEvent.change(screen.getByLabelText('Escala del screenshot'), { target: { value: 'device' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar configuración/ }))

    await vi.waitFor(() => expect(savedRef.config).toBeDefined())
    expect(savedRef.config?.evidence).toEqual({
      imageFormat: 'jpeg',
      imageQuality: 72,
      scale: 'device',
    })

    // Simula la recarga: la API devuelve la config persistida.
    view.unmount()
    render(<ConfigSection settings={makeSettings(savedRef.config as Config, vi.fn())} />)
    expect((screen.getByLabelText('Formato de captura') as HTMLSelectElement).value).toBe('jpeg')
    expect((screen.getByLabelText('Calidad JPEG (1–100)') as HTMLInputElement).value).toBe('72')
    expect((screen.getByLabelText('Escala del screenshot') as HTMLSelectElement).value).toBe('device')
  })

  it('muestra los defaults del contrato cuando el perfil no define opciones', () => {
    render(<ConfigSection settings={makeSettings({}, vi.fn())} />)
    expect(screen.getByText(`Predeterminado (${EVIDENCE_DEFAULTS.imageFormat})`)).toBeTruthy()
    expect(screen.getByText(`Predeterminada (${EVIDENCE_DEFAULTS.scale})`)).toBeTruthy()
    expect(
      (screen.getByLabelText('Calidad JPEG (1–100)') as HTMLInputElement).placeholder,
    ).toContain(String(EVIDENCE_DEFAULTS.imageQuality))
  })
})
