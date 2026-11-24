import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@/types/contract'
import { ProfileSwitcher } from './profile-switcher'

const mocks = vi.hoisted(() => ({
  activate: vi.fn(),
  setActive: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  state: {
    profiles: [] as unknown[],
    activeProfileId: 'perfil-1' as string | null,
    statuses: [] as unknown[],
    loading: false,
    error: null as string | null,
  },
}))

vi.mock('@/lib/api', () => ({
  profileAdminApi: { activate: mocks.activate },
}))

vi.mock('@/stores/profileStore', () => ({
  profileStore: { getState: () => ({ setActive: mocks.setActive }) },
  useProfileStore: (selector: (state: typeof mocks.state) => unknown) =>
    selector(mocks.state),
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

vi.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({ isMobile: false }),
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    children,
    ...props
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <button type='button' {...props}>
      {children}
    </button>
  ),
}))

vi.mock('./profile-manager-dialog', () => ({
  ProfileManagerDialog: () => null,
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

function renderSwitcher() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileSwitcher />
    </QueryClientProvider>
  )
}

describe('ProfileSwitcher', () => {
  beforeEach(() => {
    mocks.state.profiles = [PROFILE_1, PROFILE_2]
    mocks.state.activeProfileId = 'perfil-1'
    mocks.state.statuses = []
    mocks.state.loading = false
    mocks.state.error = null
    for (const fn of [mocks.activate, mocks.setActive, mocks.success, mocks.error]) {
      fn.mockReset()
    }
  })

  it('muestra el avatar del perfil activo y lo actualiza al cambiar de perfil', () => {
    const { container, rerender } = renderSwitcher()
    expect(container.querySelector('[data-slot="avatar"]')?.getAttribute('title')).toBe(
      'Perfil QA'
    )

    mocks.state.activeProfileId = 'perfil-2'
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <ProfileSwitcher />
      </QueryClientProvider>
    )
    expect(container.querySelector('[data-slot="avatar"]')?.getAttribute('title')).toBe(
      'Perfil Producción'
    )
  })

  it('mantiene un fallback con iniciales cuando no hay avatar', () => {
    mocks.state.profiles = [{ id: 'perfil-legacy', name: 'Perfil Heredado' }]
    mocks.state.activeProfileId = 'perfil-legacy'
    const { container, getByText } = renderSwitcher()
    expect(container.querySelector('[data-slot="avatar"]')?.getAttribute('title')).toBe(
      'Perfil Heredado'
    )
    expect(getByText('PH')).toBeTruthy()
  })
})
