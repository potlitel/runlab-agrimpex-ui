import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@/types/contract'
import { ProfileHeaderBadge } from './profile-header-badge'

const mocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  state: {
    profiles: [] as unknown[],
    activeProfileId: 'perfil-1' as string | null,
  },
}))

vi.mock('@/lib/api', () => ({
  configApi: { get: mocks.getConfig },
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (selector: (state: typeof mocks.state) => unknown) =>
    selector(mocks.state),
}))

const PROFILE_1: Profile = {
  id: 'perfil-1',
  name: 'Perfil QA',
  avatar: { style: 'bottts', seed: 'semilla-1' },
}
const PROFILE_2: Profile = {
  id: 'perfil-2',
  name: 'Perfil Producción',
  avatar: { style: 'lorelei', seed: 'semilla-2' },
}

function renderBadge() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileHeaderBadge />
    </QueryClientProvider>
  )
}

describe('ProfileHeaderBadge', () => {
  beforeEach(() => {
    mocks.getConfig.mockReset()
    mocks.getConfig.mockResolvedValue({ projectPath: '/proyectos/qa' })
    mocks.state.profiles = [PROFILE_1, PROFILE_2]
    mocks.state.activeProfileId = 'perfil-1'
  })

  it('muestra el avatar del perfil activo y lo cambia al activar otro', () => {
    const { container, rerender } = renderBadge()
    expect(container.querySelector('[data-slot="avatar"]')?.getAttribute('title')).toBe(
      'Perfil QA'
    )

    mocks.state.activeProfileId = 'perfil-2'
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ProfileHeaderBadge />
      </QueryClientProvider>
    )
    expect(container.querySelector('[data-slot="avatar"]')?.getAttribute('title')).toBe(
      'Perfil Producción'
    )
  })

  it('usa el fallback de iniciales en perfiles heredados sin avatar', () => {
    mocks.state.profiles = [{ id: 'perfil-legacy', name: 'Perfil Heredado' }]
    mocks.state.activeProfileId = 'perfil-legacy'
    const { container, getByText } = renderBadge()
    expect(container.querySelector('[data-slot="avatar"]')?.getAttribute('title')).toBe(
      'Perfil Heredado'
    )
    expect(getByText('PH')).toBeTruthy()
  })
})
