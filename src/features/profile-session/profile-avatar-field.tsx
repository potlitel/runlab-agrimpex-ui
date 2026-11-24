import { useState } from 'react'
import { ProfileAvatar } from '@/components/profile-avatar'
import { Button } from '@/components/ui/button'
import type { ProfileAvatar as ProfileAvatarValue } from '@/lib/profile-avatar'
import { AvatarPickerDialog } from './avatar-picker-dialog'

interface ProfileAvatarFieldProps {
  id?: string
  name: string
  profileId?: string
  value?: ProfileAvatarValue | null
  onChange: (avatar: ProfileAvatarValue) => void
  required?: boolean
}

export function ProfileAvatarField({
  id = 'profile-avatar-field',
  name,
  profileId,
  value,
  onChange,
  required = true,
}: ProfileAvatarFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className='space-y-2'>
      <span className='text-sm font-medium'>Avatar del perfil</span>
      <div className='flex items-center gap-3'>
        <ProfileAvatar name={name} profileId={profileId} avatar={value} className='size-10' />
        <Button id={id} type='button' variant='outline' size='sm' onClick={() => setOpen(true)}>
          {value ? 'Cambiar avatar' : 'Elegir avatar'}
        </Button>
      </div>
      {required && !value ? (
        <p role='alert' className='text-xs text-destructive'>
          Debes elegir un avatar para continuar.
        </p>
      ) : null}
      {open ? (
        <AvatarPickerDialog
          open
          onOpenChange={setOpen}
          value={value}
          profileId={profileId}
          onConfirm={onChange}
        />
      ) : null}
    </div>
  )
}
