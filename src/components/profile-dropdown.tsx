import { ProfileAvatar } from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProfileStore } from '@/stores/profileStore'

export function ProfileDropdown() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <ProfileAvatar
            name={activeProfile?.name ?? 'Sin perfil'}
            avatar={activeProfile?.avatar}
            profileId={activeProfile?.id}
            className='size-8'
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-1.5'>
            <p className='text-sm leading-none font-medium'>
              {activeProfile?.name ?? 'Sin perfil activo'}
            </p>
            <p className='text-xs leading-none text-muted-foreground'>
              {activeProfile?.id ?? 'Sin ID'}
            </p>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
