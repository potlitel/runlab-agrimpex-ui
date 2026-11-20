import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import { RealtimeExecutionOnboarding } from './components/realtime-onboarding'

export function LiveFlowPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Flujo en vivo</h1>
            <p className='text-sm text-muted-foreground'>
              Guía visual de la ejecución en tiempo real con Playwright y Socket.io
            </p>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <Badge variant='secondary'>
              {activeProfile?.name ?? 'Sin perfil activo'}
            </Badge>
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <RealtimeExecutionOnboarding />
      </Main>
    </>
  )
}
