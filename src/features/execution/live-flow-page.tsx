import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { RealtimeExecutionOnboarding } from './components/realtime-onboarding'

export function LiveFlowPage() {
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
            <ProfileHeaderBadge />
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
