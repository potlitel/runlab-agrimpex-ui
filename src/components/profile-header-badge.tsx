import { useQuery } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import { configApi } from '@/lib/api'
import { useProfileStore } from '@/stores/profileStore'
import { Badge } from '@/components/ui/badge'
import { ProfileAvatar } from '@/components/profile-avatar'

type Props = {
  profileName?: string
}

export function ProfileHeaderBadge({ profileName }: Props) {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )
  const resolvedName = profileName ?? activeProfile?.name

  const configQuery = useQuery({
    queryKey: ['config', activeProfileId],
    queryFn: () => configApi.get(),
    enabled: !!activeProfileId,
    staleTime: 30_000,
    retry: false,
  })

  const projectPath = configQuery.data?.projectPath?.trim() || ''

  const title = projectPath
    ? `Perfil: ${resolvedName ?? 'Sin perfil activo'}\nProyecto: ${projectPath}`
    : `Perfil: ${resolvedName ?? 'Sin perfil activo'}`

  return (
    <Badge
      variant='secondary'
      className='flex max-w-[min(100%,34rem)] flex-col items-start gap-1 py-1.5'
      title={title}
    >
      <span className='flex w-full min-w-0 items-center gap-1.5'>
        <ProfileAvatar
          name={resolvedName ?? 'Sin perfil activo'}
          avatar={activeProfile?.avatar}
          profileId={activeProfile?.id}
          className='size-5'
        />
        <span className='truncate'>{resolvedName ?? 'Sin perfil activo'}</span>
      </span>
      {projectPath ? (
        <span className='flex w-full min-w-0 items-center gap-1.5'>
          <FolderOpen className='size-3.5 shrink-0 opacity-80' />
          <span className='truncate font-mono text-[11px]'>{projectPath}</span>
        </span>
      ) : null}
    </Badge>
  )
}
