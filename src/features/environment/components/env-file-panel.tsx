import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

type EnvFilePanelProps = {
  files: string[]
  selectedFile: string
  onSelectFile: (file: string) => void
  vars: EnvVar[]
  path?: string
  loading: boolean
  error: string | null
  saving: boolean
  onSave: (vars: EnvVar[], file?: string) => void
}

export function EnvFilePanel({
  files,
  selectedFile,
  onSelectFile,
  vars,
  path,
  loading,
  error,
  saving,
  onSave,
}: EnvFilePanelProps) {
  if (files.length === 0) {
    return (
      <Card>
        <CardHeader className='border-b pb-4'>
          <CardTitle>Archivos .env</CardTitle>
        </CardHeader>
        <CardContent className='p-6 text-sm text-muted-foreground'>
          No se encontraron archivos <code>.env</code> en el proyecto. Configura la ruta del
          proyecto en Ajustes o crea un archivo de entorno en el repositorio de pruebas.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='gap-4 border-b pb-4'>
        <div className='space-y-1.5'>
          <Label htmlFor='env-file-select'>Archivo</Label>
          <Select value={selectedFile || undefined} onValueChange={onSelectFile}>
            <SelectTrigger id='env-file-select' className='w-full min-w-56 sm:w-80'>
              <SelectValue placeholder='Selecciona un archivo' />
            </SelectTrigger>
            <SelectContent>
              {files.map((file) => (
                <SelectItem key={file} value={file}>
                  {file}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {path && <p className='truncate font-mono text-xs text-muted-foreground'>{path}</p>}
      </CardHeader>
      <CardContent className='p-4'>
        {loading ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>Cargando variables…</p>
        ) : error ? (
          <p className='rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
            {error}
          </p>
        ) : (
          <EnvFileEditor
            key={`${selectedFile}|${path ?? ''}`}
            vars={vars}
            selectedFile={selectedFile}
            saving={saving}
            onSave={onSave}
          />
        )}
      </CardContent>
    </Card>
  )
}

function EnvFileEditor({
  vars,
  selectedFile,
  saving,
  onSave,
}: {
  vars: EnvVar[]
  selectedFile: string
  saving: boolean
  onSave: (vars: EnvVar[], file?: string) => void
}) {
  const [draft, setDraft] = useState<EnvVar[]>(vars)

  return (
    <div className='space-y-3'>
      <div className='flex justify-end'>
        <Button
          onClick={() => onSave(draft, selectedFile || undefined)}
          disabled={saving || !selectedFile}
        >
          <Save className='size-4' /> {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
      <VarsEditor vars={draft} onChange={setDraft} disabled={saving} />
    </div>
  )
}
