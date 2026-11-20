import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Database, FolderOpen, Loader2, Pencil, Play, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { configApi, profileAdminApi } from '@/lib/api'
import { profileStore, useProfileStore } from '@/stores/profileStore'
import type { CreateProfileTestDataMode, Profile } from '@/types/contract'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

type CreateSource = 'global' | CreateProfileTestDataMode

function msg(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

const MODE_LABEL: Record<CreateProfileTestDataMode, string> = {
  defaults: 'Rutas globales por defecto',
  template: 'Copiar del perfil plantilla',
  active: 'Copiar del perfil activo',
  none: 'Sin datos (vacío)',
}

export function ProfileAdminSection() {
  const queryClient = useQueryClient()
  const profiles = useProfileStore((s) => s.profiles)
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  const [newName, setNewName] = useState('')
  const [newDataSource, setNewDataSource] = useState<CreateSource>('global')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  const [settingsForm, setSettingsForm] = useState<{
    createProfileTestDataMode: CreateProfileTestDataMode
    templateProfileId: string | null
    testDataDefaults: { txtFolderPath: string; jsonDataPath: string }
  }>({
    createProfileTestDataMode: 'none',
    templateProfileId: null,
    testDataDefaults: { txtFolderPath: '', jsonDataPath: '' },
  })
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [browsing, setBrowsing] = useState<'txt' | 'json' | null>(null)

  const listQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profileAdminApi.list(),
    retry: false,
  })

  useEffect(() => {
    if (!listQuery.data) return
    setSettingsForm({
      createProfileTestDataMode: listQuery.data.createProfileTestDataMode ?? 'none',
      templateProfileId: listQuery.data.templateProfileId ?? null,
      testDataDefaults: {
        txtFolderPath: listQuery.data.testDataDefaults?.txtFolderPath ?? '',
        jsonDataPath: listQuery.data.testDataDefaults?.jsonDataPath ?? '',
      },
    })
    setSettingsDirty(false)
  }, [listQuery.data])

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] })
  }

  const createMutation = useMutation({
    mutationFn: ({ name, source }: { name: string; source: CreateSource }) =>
      profileAdminApi.create(name, source === 'global' ? undefined : { testDataSource: source }),
    onSuccess: (profile) => {
      profileStore.getState().add(profile)
      setNewName('')
      setNewDataSource('global')
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

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      profileAdminApi.updateSettings({
        createProfileTestDataMode: settingsForm.createProfileTestDataMode,
        templateProfileId: settingsForm.templateProfileId,
        testDataDefaults: settingsForm.testDataDefaults,
      }),
    onSuccess: () => {
      toast.success('Configuración de datos de prueba guardada')
      setSettingsDirty(false)
      void refresh()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo guardar la configuración')),
  })

  async function browseDefault(which: 'txt' | 'json') {
    const key = which === 'txt' ? 'txtFolderPath' : 'jsonDataPath'
    try {
      setBrowsing(which)
      const res = await configApi.browse('folder', settingsForm.testDataDefaults[key] || undefined)
      if (res.path) {
        setSettingsForm((p) => ({ ...p, testDataDefaults: { ...p.testDataDefaults, [key]: res.path } }))
        setSettingsDirty(true)
      }
    } catch (e) {
      toast.error(msg(e, 'No se pudo abrir el explorador'))
    } finally {
      setBrowsing(null)
    }
  }

  function submitCreate() {
    const name = newName.trim()
    if (!name) return
    createMutation.mutate({ name, source: newDataSource })
  }

  const busy =
    createMutation.isPending ||
    renameMutation.isPending ||
    duplicateMutation.isPending ||
    activateMutation.isPending ||
    deleteMutation.isPending ||
    saveSettingsMutation.isPending

  const globalModeLabel = MODE_LABEL[settingsForm.createProfileTestDataMode]
  const templateProfileId = listQuery.data?.templateProfileId ?? settingsForm.templateProfileId

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <CardTitle>Perfiles del dashboard</CardTitle>
              <CardDescription>
                Administra perfiles, activa el contexto de trabajo y define de dónde obtienen sus datos de prueba los perfiles nuevos.
              </CardDescription>
            </div>
            <Button variant='outline' size='sm' onClick={() => void refresh()} disabled={listQuery.isFetching}>
              <RefreshCw className={listQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} /> Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3 rounded-md border p-3'>
            <div className='grid gap-3 md:grid-cols-[1fr_260px_auto] md:items-end'>
              <div className='space-y-1.5'>
                <Label htmlFor='settings-new-profile'>Nuevo perfil</Label>
                <Input
                  id='settings-new-profile'
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder='Nombre del perfil'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitCreate()
                  }}
                />
              </div>
              <div className='space-y-1.5'>
                <Label>Datos de prueba al crear</Label>
                <Select value={newDataSource} onValueChange={(v) => setNewDataSource(v as CreateSource)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='global'>Usar modo global ({globalModeLabel})</SelectItem>
                    <SelectItem value='defaults'>Rutas globales por defecto</SelectItem>
                    <SelectItem value='template'>Copiar del perfil plantilla</SelectItem>
                    <SelectItem value='active'>Copiar del perfil activo</SelectItem>
                    <SelectItem value='none'>Sin datos (vacío)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={submitCreate} disabled={!newName.trim() || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className='size-4 animate-spin' /> : <Plus className='size-4' />} Crear
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Los perfiles duplicados conservan la configuración (incluidas las rutas de datos) del perfil de origen.
            </p>
          </div>

          {listQuery.isError ? (
            <p className='text-sm text-destructive'>{msg(listQuery.error, 'No se pudieron cargar los perfiles')}</p>
          ) : (
            <div className='space-y-2'>
              {profiles.length === 0 && <p className='text-sm text-muted-foreground'>No hay perfiles.</p>}
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId
                const isTemplate = profile.id === templateProfileId
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
                            {isTemplate && <Badge variant='secondary'>Plantilla de datos</Badge>}
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

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Database className='size-5 text-muted-foreground' />
            <div>
              <CardTitle>Datos de prueba para perfiles nuevos</CardTitle>
              <CardDescription>
                Define cómo obtienen sus rutas de datos (TXT/JSON) los perfiles que se creen desde cero. Las tres estrategias pueden coexistir: elige un modo global y, si quieres, sobreescríbelo al crear cada perfil.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label>Modo global por defecto</Label>
              <Select
                value={settingsForm.createProfileTestDataMode}
                onValueChange={(v) => {
                  setSettingsForm((p) => ({ ...p, createProfileTestDataMode: v as CreateProfileTestDataMode }))
                  setSettingsDirty(true)
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='defaults'>Rutas globales por defecto</SelectItem>
                  <SelectItem value='template'>Copiar del perfil plantilla</SelectItem>
                  <SelectItem value='active'>Copiar del perfil activo</SelectItem>
                  <SelectItem value='none'>Sin datos (vacío)</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Se aplica al crear un perfil cuando eliges “Usar modo global”.
              </p>
            </div>

            <div className='space-y-1.5'>
              <Label>Perfil plantilla</Label>
              <Select
                value={settingsForm.templateProfileId ?? 'none'}
                onValueChange={(v) => {
                  setSettingsForm((p) => ({ ...p, templateProfileId: v === 'none' ? null : v }))
                  setSettingsDirty(true)
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Sin plantilla' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Sin plantilla</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                Sus rutas de datos (TXT/JSON) se copiarán a los perfiles nuevos creados con el modo “Perfil plantilla”.
              </p>
            </div>
          </div>

          <Separator />

          <div className='space-y-3'>
            <div>
              <p className='text-sm font-medium'>Rutas globales por defecto</p>
              <p className='text-xs text-muted-foreground'>
                Se aplican a los perfiles nuevos creados con el modo “Rutas globales por defecto”. Apunta a una carpeta compartida para que todos los perfiles (presentes y futuros) usen los mismos datos.
              </p>
            </div>
            <div className='grid gap-3 md:grid-cols-[1fr_auto] md:items-end'>
              <div className='space-y-1.5'>
                <Label htmlFor='default-txt-path'>Carpeta de datos TXT (global)</Label>
                <Input
                  id='default-txt-path'
                  value={settingsForm.testDataDefaults.txtFolderPath}
                  onChange={(e) => {
                    const value = e.target.value
                    setSettingsForm((p) => ({ ...p, testDataDefaults: { ...p.testDataDefaults, txtFolderPath: value } }))
                    setSettingsDirty(true)
                  }}
                  placeholder='/ruta/compartida/datos-txt'
                />
              </div>
              <Button type='button' variant='outline' onClick={() => void browseDefault('txt')} disabled={browsing === 'txt'}>
                {browsing === 'txt' ? <Loader2 className='size-4 animate-spin' /> : <FolderOpen className='size-4' />} Explorar
              </Button>
            </div>
            <div className='grid gap-3 md:grid-cols-[1fr_auto] md:items-end'>
              <div className='space-y-1.5'>
                <Label htmlFor='default-json-path'>Carpeta de datos JSON (global)</Label>
                <Input
                  id='default-json-path'
                  value={settingsForm.testDataDefaults.jsonDataPath}
                  onChange={(e) => {
                    const value = e.target.value
                    setSettingsForm((p) => ({ ...p, testDataDefaults: { ...p.testDataDefaults, jsonDataPath: value } }))
                    setSettingsDirty(true)
                  }}
                  placeholder='/ruta/compartida/datos-json'
                />
              </div>
              <Button type='button' variant='outline' onClick={() => void browseDefault('json')} disabled={browsing === 'json'}>
                {browsing === 'json' ? <Loader2 className='size-4 animate-spin' /> : <FolderOpen className='size-4' />} Explorar
              </Button>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button onClick={() => saveSettingsMutation.mutate()} disabled={!settingsDirty || saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending ? <Loader2 className='size-4 animate-spin' /> : <Save className='size-4' />} Guardar configuración de datos
            </Button>
          </div>
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
