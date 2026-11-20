import { useMemo, useState } from 'react'
import { AlertCircle, FileJson, FolderOpen, RefreshCw, Save, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import type { JsonDataTreeResponse } from '@/types/contract'
import type { JsonSelection } from '../use-json-data'

type Props = {
  tree: JsonDataTreeResponse | null
  treeLoading: boolean
  treeError: string | null
  selection: JsonSelection
  onSelect: (folder: string, file: string) => void
  fileData: { data: unknown; path: string } | null
  fileLoading: boolean
  fileError: string | null
  snapshots: Record<string, unknown>
  snapshotsLoading: boolean
  snapshotsError: string | null
  savingFile: boolean
  savingSnapshot: boolean
  deletingSnapshot: boolean
  onRefreshTree: () => void
  onRefetchFile: () => void
  onSaveFile: (folder: string, file: string, data: unknown) => Promise<unknown>
  onSaveSnapshot: (folder: string, file: string, name: string, data: unknown) => Promise<unknown>
  onDeleteSnapshot: (folder: string, file: string, name: string) => void
}

export function JsonDataPanel(props: Props) {
  const { tree, treeLoading, treeError, selection } = props

  return (
    <div className='grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]'>
      <Card className='h-fit'>
        <CardHeader className='border-b pb-4'>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle>Archivos JSON</CardTitle>
            <Button size='sm' variant='outline' onClick={props.onRefreshTree} disabled={treeLoading}>
              <RefreshCw className={treeLoading ? 'size-4 animate-spin' : 'size-4'} />
            </Button>
          </div>
          {tree?.base ? (
            <p className='mt-1 truncate font-mono text-xs text-muted-foreground'>{tree.base}</p>
          ) : null}
        </CardHeader>
        <CardContent className='p-2'>
          {treeLoading ? (
            <div className='space-y-2 p-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className='h-7 animate-pulse rounded bg-muted' />
              ))}
            </div>
          ) : treeError ? (
            <p className='p-3 text-sm text-destructive'>{treeError}</p>
          ) : tree && !tree.configured ? (
            <div className='p-4 text-sm text-muted-foreground'>
              <FolderOpen className='mb-2 size-8 opacity-50' />
              <p>La fuente JSON no está configurada. Define la carpeta en Ajustes.</p>
            </div>
          ) : tree?.error ? (
            <p className='p-3 text-sm text-destructive'>{String(tree.error)}</p>
          ) : (tree?.tree ?? []).every((g) => (g.files ?? []).length === 0) ? (
            <p className='p-4 text-sm text-muted-foreground'>No se encontraron archivos .json.</p>
          ) : (
            <ScrollArea className='h-[420px]'>
              <div className='space-y-3 p-2'>
                {(tree?.tree ?? []).map((group) => (
                  <div key={group.folder || '__root__'}>
                    <div className='mb-1 px-1 text-xs font-medium text-muted-foreground'>
                      {group.folder || '(raíz)'}
                    </div>
                    <div className='space-y-1'>
                      {(group.files ?? []).map((file) => {
                        const active = selection?.folder === group.folder && selection?.file === file
                        return (
                          <button
                            key={file}
                            type='button'
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted ${
                              active ? 'bg-muted font-medium' : ''
                            }`}
                            onClick={() => props.onSelect(group.folder, file)}
                          >
                            <FileJson className='size-4 shrink-0 text-muted-foreground' />
                            <span className='truncate'>{file}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className='space-y-4'>
        {!selection ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground'>
              <FileJson className='size-10 opacity-40' />
              <p className='text-sm'>Selecciona un archivo del árbol para ver y editar su contenido.</p>
            </CardContent>
          </Card>
        ) : (
          <JsonEditorAndSnapshots
            key={`${selection.folder}/${selection.file}|${props.fileLoading ? 'loading' : 'ready'}|${JSON.stringify(props.fileData?.data ?? null)}`}
            {...props}
            selection={selection}
          />
        )}
      </div>
    </div>
  )
}

function JsonEditorAndSnapshots(props: Props & { selection: { folder: string; file: string } }) {
  const { selection, fileData, fileLoading, fileError, snapshots, snapshotsLoading, snapshotsError } = props
  const initialText = useMemo(() => {
    if (!fileData) return ''
    try {
      return JSON.stringify(fileData.data, null, 2)
    } catch {
      return String(fileData.data ?? '')
    }
  }, [fileData])

  const [text, setText] = useState(initialText)
  const [parseError, setParseError] = useState<string | null>(null)
  const [snapshotName, setSnapshotName] = useState('')

  function parseCurrent(): unknown | null {
    try {
      const parsed = JSON.parse(text)
      setParseError(null)
      return parsed
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'JSON inválido')
      return null
    }
  }

  async function handleSaveFile() {
    const parsed = parseCurrent()
    if (parsed === null) return
    await props.onSaveFile(selection.folder, selection.file, parsed)
  }

  async function handleSaveSnapshot() {
    const name = snapshotName.trim()
    if (!name) return
    const parsed = parseCurrent()
    if (parsed === null) return
    await props.onSaveSnapshot(selection.folder, selection.file, name, parsed)
    setSnapshotName('')
  }

  function loadSnapshot(data: unknown) {
    try {
      setText(JSON.stringify(data, null, 2))
      setParseError(null)
    } catch {
      setText(String(data ?? ''))
    }
  }

  const snapshotNames = Object.keys(snapshots)

  return (
    <>
      <Card>
        <CardHeader className='border-b pb-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <CardTitle className='truncate font-mono text-sm'>
                {selection.folder ? `${selection.folder}/` : ''}{selection.file}
              </CardTitle>
              {fileData?.path ? (
                <p className='mt-1 truncate font-mono text-xs text-muted-foreground'>{fileData.path}</p>
              ) : null}
            </div>
            <div className='flex gap-2'>
              <Button size='sm' variant='outline' onClick={props.onRefetchFile} disabled={fileLoading}>
                <RefreshCw className={fileLoading ? 'size-4 animate-spin' : 'size-4'} /> Recargar
              </Button>
              <Button size='sm' onClick={handleSaveFile} disabled={props.savingFile || fileLoading || !!fileError}>
                <Save className='size-4' /> {props.savingFile ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-3 p-4'>
          {fileLoading ? (
            <div className='h-64 animate-pulse rounded bg-muted' />
          ) : fileError ? (
            <div className='space-y-3'>
              <p className='flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'>
                <AlertCircle className='mt-0.5 size-4 shrink-0' /> {fileError}
              </p>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} className='min-h-[320px] font-mono text-xs' />
            </div>
          ) : (
            <>
              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setParseError(null)
                }}
                className='min-h-[320px] font-mono text-xs'
                spellCheck={false}
              />
              {parseError ? (
                <p className='text-sm text-destructive'>JSON inválido: {parseError}</p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='border-b pb-4'>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle>Snapshots</CardTitle>
            <Badge variant='secondary'>{snapshotNames.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className='space-y-4 p-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
            <div className='flex-1 space-y-1.5'>
              <Label htmlFor='snapshot-name'>Guardar contenido actual como snapshot</Label>
              <Input
                id='snapshot-name'
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder='Nombre del snapshot'
              />
            </div>
            <Button onClick={handleSaveSnapshot} disabled={!snapshotName.trim() || props.savingSnapshot || !!fileError}>
              <Save className='size-4' /> {props.savingSnapshot ? 'Guardando…' : 'Guardar snapshot'}
            </Button>
          </div>

          <Separator />

          {snapshotsLoading ? (
            <p className='text-sm text-muted-foreground'>Cargando snapshots…</p>
          ) : snapshotsError ? (
            <p className='text-sm text-destructive'>{snapshotsError}</p>
          ) : snapshotNames.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No hay snapshots para este archivo.</p>
          ) : (
            <div className='space-y-2'>
              {snapshotNames.sort().map((name) => (
                <div key={name} className='flex items-center justify-between gap-2 rounded-md border px-3 py-2'>
                  <span className='truncate font-mono text-xs'>{name}</span>
                  <div className='flex gap-1'>
                    <Button size='sm' variant='outline' onClick={() => loadSnapshot(snapshots[name])}>
                      Cargar
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='text-destructive hover:text-destructive'
                      disabled={props.deletingSnapshot}
                      onClick={() => {
                        const ok = window.confirm(`¿Eliminar el snapshot "${name}"?`)
                        if (ok) props.onDeleteSnapshot(selection.folder, selection.file, name)
                      }}
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
