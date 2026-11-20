import { useQuery } from '@tanstack/react-query'
import { FolderOpen, User } from 'lucide-react'
import { configApi } from '@/lib/api'
import { useProfileStore } from '@/stores/profileStore'
import { Badge } from '@/components/ui/badge'

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
      className='flex max-w-[min(100%,34rem)] items-center gap-1.5'
      title={title}
    >
      <User className='size-3.5 shrink-0 opacity-80' />
      <span className='max-w-[12rem] truncate sm:max-w-[14rem]'>
        {resolvedName ?? 'Sin perfil activo'}
      </span>
      {projectPath ? (
        <>
          <span className='shrink-0 text-muted-foreground/50'>•</span>
          <FolderOpen className='size-3.5 shrink-0 opacity-80' />
          <span className='min-w-0 max-w-[10rem] truncate font-mono text-[11px] sm:max-w-[16rem]'>
            {projectPath}
          </span>
        </>
      ) : null}
    </Badge>
  )
}
