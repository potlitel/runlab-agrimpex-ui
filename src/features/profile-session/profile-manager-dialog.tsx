import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { profileAdminApi } from '@/lib/api'
import { profileStore, useProfileStore } from '@/stores/profileStore'
import type { Profile } from '@/types/contract'
import { ConfirmDialog } from '@/components/confirm-dialog'
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
  const [busy, setBusy] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] })
  }

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    setBusy('create')
    try {
      const profile = await profileAdminApi.create(name)
      profileStore.getState().add(profile)
      setNewName('')
      toast.success(`Perfil creado: ${profile.name}`)
      await refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function handleRename(profile: Profile) {
    const name = editName.trim()
    if (!name || name === profile.name) {
      setEditingId(null)
      return
    }
    setBusy(`rename:${profile.id}`)
    try {
      await profileAdminApi.rename(profile.id, name)
      profileStore.getState().update({ ...profile, name })
      setEditingId(null)
      toast.success('Perfil renombrado')
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
              Crea, renombra, duplica o elimina perfiles del dashboard.
            </DialogDescription>
          </DialogHeader>

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
              disabled={!newName.trim() || busy === 'create'}
            >
              {busy === 'create' ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <Plus className='size-4' />
              )}
              Crear
            </Button>
          </div>

          <Separator />

          <div className='max-h-72 space-y-2 overflow-y-auto pe-1'>
            {profiles.length === 0 && (
              <p className='text-sm text-muted-foreground'>No hay perfiles.</p>
            )}
            {profiles.map((profile) => {
              const isEditing = editingId === profile.id
              const isActive = profile.id === activeProfileId
              return (
                <div
                  key={profile.id}
                  className='flex items-center gap-2 rounded-md border p-2'
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className='h-8'
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleRename(profile)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                      />
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => void handleRename(profile)}
                        disabled={busy === `rename:${profile.id}`}
                      >
                        {busy === `rename:${profile.id}` ? (
                          <Loader2 className='size-4 animate-spin' />
                        ) : (
                          <Check className='size-4' />
                        )}
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => setEditingId(null)}
                      >
                        <X className='size-4' />
                      </Button>
                    </>
                  ) : (
                    <>
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
                        title='Renombrar'
                        onClick={() => {
                          setEditingId(profile.id)
                          setEditName(profile.name)
                        }}
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
                    </>
                  )}
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
