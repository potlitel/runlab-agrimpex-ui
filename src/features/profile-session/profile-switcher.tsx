import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProfileAvatar } from '@/components/profile-avatar'
import { profileAdminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { profileStore, useProfileStore } from '@/stores/profileStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ProfileManagerDialog } from './profile-manager-dialog'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Operación fallida'
}

export function ProfileSwitcher() {
  const queryClient = useQueryClient()
  const { isMobile } = useSidebar()
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const statuses = useProfileStore((s) => s.statuses)
  const loading = useProfileStore((s) => s.loading)
  const error = useProfileStore((s) => s.error)

  const [activating, setActivating] = useState<string | null>(null)
  const [managerOpen, setManagerOpen] = useState(false)

  const activeProfile = profiles.find((p) => p.id === activeProfileId)
  const activeStatus = statuses.find((s) => s.id === activeProfileId)

  async function handleActivate(id: string) {
    if (id === activeProfileId) return
    setActivating(id)
    try {
      await profileAdminApi.activate(id)
      profileStore.getState().setActive(id)
      const name = profiles.find((p) => p.id === id)?.name ?? id
      toast.success(`Perfil activo: ${name}`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActivating(null)
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <ProfileAvatar
                  name={activeProfile?.name ?? 'Sin perfil'}
                  avatar={activeProfile?.avatar}
                  profileId={activeProfile?.id}
                  className='size-8 rounded-lg'
                />
                <div className='grid flex-1 text-start text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {loading && !activeProfile
                      ? 'Cargando perfiles…'
                      : (activeProfile?.name ?? 'Sin perfil')}
                  </span>
                  <span
                    className={cn(
                      'truncate text-xs',
                      error
                        ? 'text-destructive'
                        : activeStatus?.running
                          ? 'text-emerald-600'
                          : 'text-muted-foreground'
                    )}
                  >
                    {error
                      ? 'Error al cargar perfiles'
                      : activeStatus?.running
                        ? `En ejecución (${activeStatus.kinds.join(', ')})`
                        : 'Perfil activo'}
                  </span>
                </div>
                {activating ? (
                  <Loader2 className='ms-auto size-4 animate-spin' />
                ) : (
                  <ChevronsUpDown className='ms-auto' />
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-xs text-muted-foreground'>
                Perfiles
              </DropdownMenuLabel>
              {profiles.length === 0 && (
                <DropdownMenuItem disabled>No hay perfiles</DropdownMenuItem>
              )}
              {profiles.map((profile) => {
                const status = statuses.find((s) => s.id === profile.id)
                return (
                  <DropdownMenuItem
                    key={profile.id}
                    onClick={() => void handleActivate(profile.id)}
                    disabled={!!activating}
                    className='gap-2 p-2'
                  >
                    <ProfileAvatar
                      name={profile.name}
                      avatar={profile.avatar}
                      profileId={profile.id}
                      className='size-6'
                    />
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        status?.running
                          ? 'bg-emerald-500'
                          : 'bg-muted-foreground/30'
                      )}
                    />
                    <span className='flex-1 truncate'>{profile.name}</span>
                    {status?.running && (
                      <span className='text-[10px] font-medium text-emerald-600'>
                        en ejecución
                      </span>
                    )}
                    {profile.id === activeProfileId && (
                      <Check className='size-4 shrink-0' />
                    )}
                    {activating === profile.id && (
                      <Loader2 className='size-4 shrink-0 animate-spin' />
                    )}
                  </DropdownMenuItem>
                )
              })}
              {error && (
                <DropdownMenuItem
                  onClick={() =>
                    void queryClient.invalidateQueries({ queryKey: ['profiles'] })
                  }
                >
                  Reintentar carga
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='gap-2 p-2'
                onClick={() => setManagerOpen(true)}
              >
                <Settings2 className='size-4' />
                Gestionar perfiles
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <ProfileManagerDialog open={managerOpen} onOpenChange={setManagerOpen} />
    </>
  )
}
