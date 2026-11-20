import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Loader2, Pencil, Play, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { profileAdminApi } from '@/lib/api'
import { profileStore, useProfileStore } from '@/stores/profileStore'
import type { Profile } from '@/types/contract'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function msg(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export function ProfileAdminSection() {
  const queryClient = useQueryClient()
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  const listQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profileAdminApi.list(),
    retry: false,
  })

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] })
  }

  const createMutation = useMutation({
    mutationFn: (name: string) => profileAdminApi.create(name),
    onSuccess: (profile) => {
      profileStore.getState().add(profile)
      setNewName('')
      toast.success(`Perfil creado: ${profile.name}`)
      void refresh()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo crear el perfil')),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => profileAdminApi.rename(id, name),
    onSuccess: (_, vars) => {
      const current = profiles.find((p) => p.id === vars.id)
      if (current) profileStore.getState().update({ ...current, name: vars.name })
      setEditingId(null)
      toast.success('Perfil renombrado')
      void refresh()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo renombrar el perfil')),
  })

  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => profileAdminApi.duplicate(id, name),
    onSuccess: (copy) => {
      profileStore.getState().add(copy)
      toast.success(`Perfil duplicado: ${copy.name}`)
      void refresh()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo duplicar el perfil')),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => profileAdminApi.activate(id),
    onSuccess: (res) => {
      if (res.activeProfileId) profileStore.getState().setActive(res.activeProfileId)
      toast.success('Perfil activado')
      void refresh()
      void queryClient.invalidateQueries()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo activar el perfil')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => profileAdminApi.delete(id),
    onSuccess: (res, id) => {
      profileStore.getState().remove(id)
      if (res.activeProfileId) profileStore.getState().setActive(res.activeProfileId)
      setDeleteTarget(null)
      toast.success('Perfil eliminado')
      void refresh()
      void queryClient.invalidateQueries()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo eliminar el perfil')),
  })

  const busy = createMutation.isPending || renameMutation.isPending || duplicateMutation.isPending || activateMutation.isPending || deleteMutation.isPending

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <CardTitle>Perfiles del dashboard</CardTitle>
              <CardDescription>
                Administra perfiles, activa el contexto de trabajo y mantén la consistencia con la sesión global.
              </CardDescription>
            </div>
            <Button variant='outline' size='sm' onClick={() => void refresh()} disabled={listQuery.isFetching}>
              <RefreshCw className={listQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
            <div className='flex-1 space-y-1.5'>
              <Label htmlFor='settings-new-profile'>Nuevo perfil</Label>
              <Input
                id='settings-new-profile'
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder='Nombre del perfil'
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) createMutation.mutate(newName.trim())
                }}
              />
            </div>
            <Button onClick={() => createMutation.mutate(newName.trim())} disabled={!newName.trim() || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className='size-4 animate-spin' /> : <Plus className='size-4' />} Crear
            </Button>
          </div>

          {listQuery.isError ? (
            <p className='text-sm text-destructive'>{msg(listQuery.error, 'No se pudieron cargar los perfiles')}</p>
          ) : (
            <div className='space-y-2'>
              {profiles.length === 0 && <p className='text-sm text-muted-foreground'>No hay perfiles.</p>}
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId
                const isEditing = editingId === profile.id
                return (
                  <div key={profile.id} className='flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center'>
                    {isEditing ? (
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className='h-9 flex-1'
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const name = editName.trim()
                              if (name && name !== profile.name) renameMutation.mutate({ id: profile.id, name })
                              else setEditingId(null)
                            }
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                        <div className='flex gap-1'>
                          <Button
                            size='icon'
                            variant='ghost'
                            onClick={() => {
                              const name = editName.trim()
                              if (name && name !== profile.name) renameMutation.mutate({ id: profile.id, name })
                              else setEditingId(null)
                            }}
                            disabled={renameMutation.isPending}
                          >
                            {renameMutation.isPending ? <Loader2 className='size-4 animate-spin' /> : <Check className='size-4' />}
                          </Button>
                          <Button size='icon' variant='ghost' onClick={() => setEditingId(null)}>
                            <X className='size-4' />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className='min-w-0 flex-1'>
                          <div className='flex flex-wrap items-center gap-2'>
                            <span className='font-medium'>{profile.name}</span>
                            {isActive && <Badge>Activo</Badge>}
                          </div>
                          <p className='truncate font-mono text-xs text-muted-foreground'>{profile.id}</p>
                        </div>
                        <div className='flex flex-wrap gap-1'>
                          {!isActive && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => activateMutation.mutate(profile.id)}
                              disabled={busy}
                              title='Activar'
                            >
                              {activateMutation.isPending ? <Loader2 className='size-4 animate-spin' /> : <Play className='size-4' />} Activar
                            </Button>
                          )}
                          <Button
                            size='icon'
                            variant='ghost'
                            title='Renombrar'
                            onClick={() => {
                              setEditingId(profile.id)
                              setEditName(profile.name)
                            }}
                            disabled={busy}
                          >
                            <Pencil className='size-4' />
                          </Button>
                          <Button
                            size='icon'
                            variant='ghost'
                            title='Duplicar'
                            onClick={() => duplicateMutation.mutate({ id: profile.id, name: `${profile.name} (copia)` })}
                            disabled={busy}
                          >
                            {duplicateMutation.isPending ? <Loader2 className='size-4 animate-spin' /> : <Copy className='size-4' />}
                          </Button>
                          <Button size='icon' variant='ghost' title='Eliminar' onClick={() => setDeleteTarget(profile)} disabled={busy}>
                            <Trash2 className='size-4' />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null)
        }}
        title='Eliminar perfil'
        desc={deleteTarget ? `¿Eliminar el perfil "${deleteTarget.name}"? Esta acción no se puede deshacer.` : ''}
        destructive
        confirmText='Eliminar'
        handleConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}
