import { ExternalLink, RefreshCw } from 'lucide-react'
import { dockerApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import { DockerActions } from './components/docker-actions'
import { DockerContainers } from './components/docker-containers'
import { DockerLogs } from './components/docker-logs'
import { DockerStatusPanel } from './components/docker-status-panel'
import { useDocker } from './use-docker'

export function DockerPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <DockerPageView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function DockerPageView({ profileName }: { profileName?: string }) {
  const docker = useDocker()

  return (
    <>
      <Header>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Docker</h1>
            <p className='text-sm text-muted-foreground'>
              Infraestructura, grid y acciones de ejecución
            </p>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <Badge variant='secondary'>{profileName ?? 'Sin perfil activo'}</Badge>
            <Button size='sm' variant='outline' onClick={docker.refresh}>
              <RefreshCw className='size-4' /> Actualizar
            </Button>
            {docker.status?.hasReport ? (
              <Button size='sm' variant='outline' asChild>
                <a href={dockerApi.reportUrl()} target='_blank' rel='noreferrer'>
                  <ExternalLink className='size-4' /> Reporte
                </a>
              </Button>
            ) : null}
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        {docker.unavailable ? (
          <Card>
            <CardContent className='p-6 text-sm text-muted-foreground'>
              El módulo Docker no está disponible para el perfil activo o el acceso fue
              rechazado. Verifica los feature flags y la configuración.
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            <div className='grid gap-4 xl:grid-cols-2'>
              <DockerStatusPanel
                check={docker.check}
                checkLoading={docker.checkLoading}
                checkError={docker.checkError}
                status={docker.status}
                statusLoading={docker.statusLoading}
                statusError={docker.statusError}
                startingDesktop={docker.startingDesktop}
                onStartDesktop={docker.startDesktop}
              />
              <DockerActions
                running={docker.running}
                runningAction={docker.runningAction}
                stopping={docker.stopping}
                onRun={docker.runAction}
                onStop={docker.stop}
              />
            </div>
            <DockerContainers
              data={docker.containers}
              loading={docker.containersLoading}
              error={docker.containersError}
            />
            <DockerLogs logs={docker.logs} onClear={docker.clearLogs} />
          </div>
        )}
      </Main>
    </>
  )
}
