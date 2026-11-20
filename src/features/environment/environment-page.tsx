import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import { EnvFilePanel } from './components/env-file-panel'
import { SavedEntornosPanel } from './components/saved-entornos-panel'
import { useEnvironment } from './use-environment'

export function EnvironmentPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <EnvironmentPageView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function EnvironmentPageView({ profileName }: { profileName?: string }) {
  const env = useEnvironment()

  return (
    <>
      <Header>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Entornos</h1>
            <p className='text-sm text-muted-foreground'>
              Variables de entorno y configuraciones guardadas por perfil
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>{profileName ?? 'Sin perfil activo'}</Badge>
            <Button size='sm' variant='outline' onClick={env.refresh} disabled={env.filesLoading || env.savedLoading}>
              <RefreshCw className={env.filesLoading || env.savedLoading ? 'size-4 animate-spin' : 'size-4'} />
              Actualizar
            </Button>
          </div>
        </div>
      </Header>
      <Main>
        {env.unavailable ? (
          <Card>
            <CardContent className='p-6 text-sm text-muted-foreground'>
              El módulo de variables/entornos no está disponible para el perfil activo o el
              acceso fue rechazado. Verifica los feature flags y la configuración.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue='files' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='files'>Archivos .env</TabsTrigger>
              <TabsTrigger value='saved'>Entornos guardados</TabsTrigger>
            </TabsList>
            <TabsContent value='files'>
              <EnvFilePanel
                files={env.files}
                selectedFile={env.selectedFile}
                onSelectFile={env.selectFile}
                vars={env.envData?.vars ?? []}
                path={env.envData?.path}
                loading={env.filesLoading || env.envLoading}
                error={env.filesError ?? env.envError}
                saving={env.savingEnv}
                onSave={env.saveEnv}
              />
            </TabsContent>
            <TabsContent value='saved'>
              <SavedEntornosPanel
                entornos={env.savedEntornos}
                selectedName={env.selectedEnvName}
                onSelectName={env.selectEnvName}
                loading={env.savedLoading}
                error={env.savedError}
                saving={env.savingEntorno}
                renaming={env.renamingEntorno}
                deletingName={env.deletingEntorno}
                onSave={env.saveEntorno}
                onRename={env.renameEntorno}
                onDelete={env.deleteEntorno}
              />
            </TabsContent>
          </Tabs>
        )}
      </Main>
    </>
  )
}
