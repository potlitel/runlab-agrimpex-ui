import { Blocks, Bot, FolderKanban, Server, ServerCog, Settings, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { useProfileStore } from '@/stores/profileStore'
import { AutomationSection } from './components/automation-section'
import { ConfigSection } from './components/config-section'
import { FeaturesSection } from './components/features-section'
import { ProfileAdminSection } from './components/profile-admin-section'
import { StackConfigSection } from './components/stack-config-section'
import { SystemSection } from './components/system-section'
import { useAutomationSettings } from './use-automation-settings'
import { useConfigSettings } from './use-config-settings'
import { useFeaturesSettings } from './use-features-settings'
import { useSystemSettings } from './use-system-settings'

export function SettingsPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return <SettingsPageView key={activeProfileId ?? 'none'} profileName={activeProfile?.name} />
}

function SettingsPageView({ profileName }: { profileName?: string }) {
  const config = useConfigSettings()
  const features = useFeaturesSettings()
  const automation = useAutomationSettings()
  const system = useSystemSettings()

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Settings className='size-5 text-muted-foreground' />
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>Ajustes</h1>
              <p className='text-sm text-muted-foreground'>
                Configuración del proyecto, módulos, automatización y sistema
              </p>
            </div>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <ProfileHeaderBadge profileName={profileName} />
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <Tabs defaultValue='project' className='space-y-4'>
          <TabsList className='flex h-auto flex-wrap justify-start gap-1'>
            <TabsTrigger value='project' className='gap-1.5'>
              <FolderKanban className='size-4' />
              Proyecto
            </TabsTrigger>
            <TabsTrigger value='features' className='gap-1.5'>
              <Blocks className='size-4' />
              Módulos
            </TabsTrigger>
            <TabsTrigger value='automation' className='gap-1.5'>
              <Bot className='size-4' />
              Automatización
            </TabsTrigger>
            <TabsTrigger value='profiles' className='gap-1.5'>
              <Users className='size-4' />
              Perfiles
            </TabsTrigger>
            <TabsTrigger value='stack' className='gap-1.5'>
              <Server className='size-4' />
              Stack
            </TabsTrigger>
            <TabsTrigger value='system' className='gap-1.5'>
              <ServerCog className='size-4' />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value='project' className='space-y-4'>
            <ConfigSection settings={config} />
          </TabsContent>

          <TabsContent value='features' className='space-y-4'>
            <FeaturesSection settings={features} />
          </TabsContent>

          <TabsContent value='automation' className='space-y-4'>
            <AutomationSection settings={automation} configProjectPath={config.config.projectPath} />
          </TabsContent>

          <TabsContent value='profiles' className='space-y-4'>
            <ProfileAdminSection />
          </TabsContent>

          <TabsContent value='stack' className='space-y-4'>
            <StackConfigSection />
          </TabsContent>

          <TabsContent value='system' className='space-y-4'>
            <SystemSection settings={system} />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
