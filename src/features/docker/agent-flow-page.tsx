import { Workflow } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { AgentFlowOnboarding } from './components/agent-flow-onboarding'

export function AgentFlowPage() {
  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Workflow className='size-5 text-muted-foreground' />
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>Flujo del agente</h1>
              <p className='text-sm text-muted-foreground'>
                Arquitectura distribuida del módulo Docker: workstation → agente → API → UI
              </p>
            </div>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <ProfileHeaderBadge />
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <AgentFlowOnboarding />
      </Main>
    </>
  )
}
