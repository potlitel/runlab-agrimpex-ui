import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Workflow } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { useProfileStore } from '@/stores/profileStore'
import { ExecutionConsole } from './components/execution-console'
import { ResultsTable } from './components/results-table'
import { useExecution } from './use-execution'

export function ExecutionDashboard() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <ExecutionDashboardView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function ExecutionDashboardView({ profileName }: { profileName?: string }) {
  const execution = useExecution()

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <LayoutDashboard className='size-5 text-muted-foreground' />
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>Dashboard</h1>
              <p className='text-sm text-muted-foreground'>
                Consola de ejecución en vivo
              </p>
            </div>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <ProfileHeaderBadge profileName={profileName} />
            {execution.running && <Badge>En ejecución</Badge>}
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <div className='space-y-4'>
          <div className='flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Workflow className='size-4 text-primary' />
              <span>Consulta la guía visual de cómo funciona la ejecución en tiempo real.</span>
            </div>
            <Button variant='outline' size='sm' asChild>
              <Link to='/live-flow'>Ver flujo en vivo</Link>
            </Button>
          </div>
          <ExecutionConsole
            logs={execution.logs}
            progress={execution.progress}
            running={execution.running}
            summary={execution.summary}
          />
          <ResultsTable results={execution.results} />
        </div>
      </Main>
    </>
  )
}
