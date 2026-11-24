import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ProfileAvatar } from '@/components/profile-avatar'
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
import { Separator } from '@/components/ui/separator'
import { profileAdminApi } from '@/lib/api'
import type { ProfileAvatar as ProfileAvatarValue } from '@/lib/profile-avatar'
import { profileStore, useProfileStore } from '@/stores/profileStore'
import type { Profile } from '@/types/contract'
import { EditProfileDialog } from './edit-profile-dialog'
import { ProfileAvatarField } from './profile-avatar-field'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Operación fallida'
}

export function ProfileManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState<ProfileAvatarValue | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] })
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name || !newAvatar) return
    setBusy('create')
    try {
      const profile = await profileAdminApi.create(name, { avatar: newAvatar })
      profileStore.getState().add(profile)
      setNewName('')
      setNewAvatar(null)
      toast.success(`Perfil creado: ${profile.name}`)
      await refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function handleDuplicate(profile: Profile) {
    setBusy(`duplicate:${profile.id}`)
    try {
      const copy = await profileAdminApi.duplicate(
        profile.id,
        `${profile.name} (copia)`
      )
      profileStore.getState().add(copy)
      toast.success(`Perfil duplicado: ${copy.name}`)
      await refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete(profile: Profile) {
    setBusy(`delete:${profile.id}`)
    try {
      const result = await profileAdminApi.delete(profile.id)
      profileStore.getState().remove(profile.id)
      if (result.activeProfileId) {
        profileStore.getState().setActive(result.activeProfileId)
      }
      setDeleteTarget(null)
      toast.success('Perfil eliminado')
      await refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Gestionar perfiles</DialogTitle>
            <DialogDescription>
              Crea, edita, duplica o elimina perfiles del dashboard. Cada perfil necesita un avatar.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3'>
            <div className='flex items-end gap-2'>
              <div className='grid flex-1 gap-2'>
                <Label htmlFor='new-profile-name'>Nuevo perfil</Label>
                <Input
                  id='new-profile-name'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder='Nombre del perfil'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreate()
                  }}
                />
              </div>
              <Button
                onClick={() => void handleCreate()}
                disabled={!newName.trim() || !newAvatar || busy === 'create'}
              >
                {busy === 'create' ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Plus className='size-4' />
                )}
                Crear
              </Button>
            </div>
            <ProfileAvatarField
              name={newName || 'Nuevo perfil'}
              value={newAvatar}
              onChange={setNewAvatar}
            />
          </div>

          <Separator />

          <div className='max-h-72 space-y-2 overflow-y-auto pe-1'>
            {profiles.length === 0 && (
              <p className='text-sm text-muted-foreground'>No hay perfiles.</p>
            )}
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId
              return (
                <div
                  key={profile.id}
                  className='flex items-center gap-2 rounded-md border p-2'
                >
                  <ProfileAvatar
                    name={profile.name}
                    avatar={profile.avatar}
                    profileId={profile.id}
                    className='size-8'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span className='truncate text-sm font-medium'>
                        {profile.name}
                      </span>
                      {isActive && (
                        <span className='rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary'>
                          activo
                        </span>
                      )}
                    </div>
                    <p className='truncate text-xs text-muted-foreground'>
                      {profile.id}
                    </p>
                  </div>
                  <Button
                    size='icon'
                    variant='ghost'
                    title='Editar'
                    onClick={() => setEditingProfile(profile)}
                  >
                    <Pencil className='size-4' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    title='Duplicar'
                    onClick={() => void handleDuplicate(profile)}
                    disabled={busy === `duplicate:${profile.id}`}
                  >
                    {busy === `duplicate:${profile.id}` ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Copy className='size-4' />
                    )}
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    title='Eliminar'
                    onClick={() => setDeleteTarget(profile)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingProfile ? (
        <EditProfileDialog
          open
          onOpenChange={(next) => {
            if (!next) setEditingProfile(null)
          }}
          profile={editingProfile}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null)
        }}
        title='Eliminar perfil'
        desc={
          deleteTarget
            ? `¿Eliminar el perfil "${deleteTarget.name}"? Esta acción no se puede deshacer.`
            : ''
        }
        destructive
        confirmText='Eliminar'
        handleConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget)
        }}
        isLoading={
          deleteTarget ? busy === `delete:${deleteTarget.id}` : false
        }
      />
    </>
  )
}
