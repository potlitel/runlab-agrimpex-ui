import { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  avatarInitials,
  avatarToDataUri,
  normalizeProfileAvatar,
  type ProfileAvatar as ProfileAvatarValue,
} from '@/lib/profile-avatar'
import { cn } from '@/lib/utils'

interface ProfileAvatarProps {
  name: string
  avatar?: ProfileAvatarValue | null
  profileId?: string
  className?: string
}

export function ProfileAvatar({
  name,
  avatar,
  profileId,
  className,
}: ProfileAvatarProps) {
  const normalized = useMemo(
    () => normalizeProfileAvatar(avatar, profileId ?? name),
    [avatar, profileId, name]
  )
  const src = useMemo(() => {
    try {
      return avatarToDataUri(normalized)
    } catch {
      return undefined
    }
  }, [normalized])

  return (
    <Avatar className={cn('size-8 shrink-0', className)} title={name}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className='text-xs font-medium'>
        {avatarInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
