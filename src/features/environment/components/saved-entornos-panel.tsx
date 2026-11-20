import { useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EnvVar } from '@/types/contract'
import { VarsEditor } from './vars-editor'

type SavedEntornosPanelProps = {
  entornos: Record<string, EnvVar[]>
  selectedName: string
  onSelectName: (name: string) => void
  loading: boolean
  error: string | null
  saving: boolean
  renaming: boolean
  deletingName: string | null
  onSave: (name: string, vars: EnvVar[]) => void
  onRename: (name: string, newName: string) => void
  onDelete: (name: string) => void
}

export function SavedEntornosPanel({
  entornos,
  selectedName,
  onSelectName,
  loading,
  error,
  saving,
  renaming,
  deletingName,
  onSave,
  onRename,
  onDelete,
}: SavedEntornosPanelProps) {
  const names = Object.keys(entornos)
  const [newName, setNewName] = useState('')

  function handleCreate() {
    const name = newName.trim()
    if (!name) return
    onSave(name, [])
    setNewName('')
  }

  function handleRename() {
    if (!selectedName) return
    const next = window.prompt('Nuevo nombre del entorno', selectedName)
    if (!next || !next.trim() || next.trim() === selectedName) return
    onRename(selectedName, next.trim())
  }

  function handleDelete() {
    if (!selectedName) return
    const ok = window.confirm(
      `¿Eliminar el entorno "${selectedName}"? Esta acción no se puede deshacer.`
    )
    if (ok) onDelete(selectedName)
  }

  return (
    <Card>
      <CardHeader className='gap-4 border-b pb-4'>
        <CardTitle>Entornos guardados</CardTitle>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
          <div className='flex-1 space-y-1.5'>
            <Label htmlFor='new-entorno-name'>Crear nuevo entorno</Label>
            <Input
              id='new-entorno-name'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Nombre del entorno'
            />
          </div>
          <Button
            type='button'
            variant='outline'
            onClick={handleCreate}
            disabled={!newName.trim() || saving}
          >
            <Plus className='size-4' /> Crear
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        {loading ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>Cargando entornos…</p>
        ) : error ? (
          <p className='rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
            {error}
          </p>
        ) : names.length === 0 ? (
          <p className='py-6 text-sm text-muted-foreground'>
            No hay entornos guardados. Crea uno para reutilizar conjuntos de variables en ejecuciones.
          </p>
        ) : (
          <>
            <div className='space-y-1.5'>
              <Label htmlFor='saved-entorno-select'>Entorno</Label>
              <Select value={selectedName || undefined} onValueChange={onSelectName}>
                <SelectTrigger id='saved-entorno-select' className='w-full min-w-56 sm:w-80'>
                  <SelectValue placeholder='Selecciona un entorno' />
                </SelectTrigger>
                <SelectContent>
                  {names.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SavedEntornoEditor
              key={selectedName}
              name={selectedName}
              vars={entornos[selectedName] ?? []}
              saving={saving}
              renaming={renaming}
              deleting={deletingName === selectedName}
              onSave={onSave}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SavedEntornoEditor({
  name,
  vars,
  saving,
  renaming,
  deleting,
  onSave,
  onRename,
  onDelete,
}: {
  name: string
  vars: EnvVar[]
  saving: boolean
  renaming: boolean
  deleting: boolean
  onSave: (name: string, vars: EnvVar[]) => void
  onRename: () => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<EnvVar[]>(vars)

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button type='button' variant='outline' size='sm' onClick={onRename} disabled={!name || renaming}>
          <Pencil className='size-4' /> Renombrar
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='text-destructive hover:text-destructive'
          onClick={onDelete}
          disabled={!name || deleting}
        >
          <Trash2 className='size-4' /> Eliminar
        </Button>
        <Button type='button' size='sm' onClick={() => onSave(name, draft)} disabled={!name || saving}>
          <Save className='size-4' /> {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
      <VarsEditor vars={draft} onChange={setDraft} disabled={saving} />
    </div>
  )
}
