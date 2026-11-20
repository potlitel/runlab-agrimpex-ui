import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { useProfileStore } from '@/stores/profileStore'
import { JsonDataPanel } from './components/json-data-panel'
import { TxtDataPanel } from './components/txt-data-panel'
import { useJsonData } from './use-json-data'
import { useTxtData } from './use-txt-data'

export function TestDataPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <TestDataPageView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function TestDataPageView({ profileName }: { profileName?: string }) {
  const txt = useTxtData()
  const json = useJsonData()

  const txtAvailable = txt.enabled && !txt.unavailable
  const jsonAvailable = json.enabled && !json.unavailable
  const defaultTab = txtAvailable ? 'txt' : jsonAvailable ? 'json' : 'none'

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Datos de prueba</h1>
            <p className='text-sm text-muted-foreground'>
              Fuentes TXT y JSON configuradas para el perfil activo
            </p>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <ProfileHeaderBadge profileName={profileName} />
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        {!txtAvailable && !jsonAvailable ? (
          <Card>
            <CardContent className='p-6 text-sm text-muted-foreground'>
              Las fuentes de datos de prueba no están disponibles para el perfil activo
              (deshabilitadas o acceso rechazado). Verifica los feature flags y la configuración.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={defaultTab} className='space-y-4'>
            <TabsList>
              {txtAvailable && <TabsTrigger value='txt'>TXT</TabsTrigger>}
              {jsonAvailable && <TabsTrigger value='json'>JSON</TabsTrigger>}
            </TabsList>
            {txtAvailable && (
              <TabsContent value='txt'>
                <TxtDataPanel
                  data={txt.data}
                  loading={txt.loading}
                  error={txt.error}
                  onRefresh={txt.refresh}
                />
              </TabsContent>
            )}
            {jsonAvailable && (
              <TabsContent value='json'>
                <JsonDataPanel
                  tree={json.tree}
                  treeLoading={json.treeLoading}
                  treeError={json.treeError}
                  selection={json.selection}
                  onSelect={json.select}
                  fileData={json.fileData}
                  fileLoading={json.fileLoading}
                  fileError={json.fileError}
                  snapshots={json.snapshots}
                  snapshotsLoading={json.snapshotsLoading}
                  snapshotsError={json.snapshotsError}
                  savingFile={json.savingFile}
                  savingSnapshot={json.savingSnapshot}
                  deletingSnapshot={json.deletingSnapshot}
                  onRefreshTree={json.refreshTree}
                  onRefetchFile={json.refetchFile}
                  onSaveFile={json.saveFile}
                  onSaveSnapshot={json.saveSnapshot}
                  onDeleteSnapshot={json.deleteSnapshot}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </Main>
    </>
  )
}
