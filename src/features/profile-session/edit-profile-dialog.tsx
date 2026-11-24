import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { profileAdminApi } from '@/lib/api'
import type { ProfileAvatar as ProfileAvatarValue } from '@/lib/profile-avatar'
import { profileStore } from '@/stores/profileStore'
import type { Profile } from '@/types/contract'
import { ProfileAvatarField } from './profile-avatar-field'

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile | null
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
}: EditProfileDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(() => profile?.name ?? '')
  const [avatar, setAvatar] = useState<ProfileAvatarValue | null>(
    () => profile?.avatar ?? null
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!profile || saving) return
    const trimmed = name.trim()
    if (!trimmed || !avatar) {
      setError('Introduce un nombre y elige un avatar para continuar.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await profileAdminApi.update(profile.id, {
        name: trimmed,
        avatar,
      })
      profileStore.getState().update(updated)
      toast.success(`Perfil actualizado: ${updated.name}`)
      await queryClient.invalidateQueries({ queryKey: ['profiles'] })
      onOpenChange(false)
    } catch (err) {
      const message = errorMessage(err, 'No se pudo actualizar el perfil')
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Actualiza el nombre y el avatar del perfil. Ambos campos son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='edit-profile-name'>Nombre del perfil</Label>
            <Input
              id='edit-profile-name'
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder='Nombre del perfil'
            />
          </div>
          <ProfileAvatarField
            name={name || profile?.name || 'Perfil'}
            profileId={profile?.id}
            value={avatar}
            onChange={setAvatar}
          />
          {error ? (
            <p role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant='outline' disabled={saving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || !name.trim() || !avatar}
          >
            {saving ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Save className='size-4' />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
