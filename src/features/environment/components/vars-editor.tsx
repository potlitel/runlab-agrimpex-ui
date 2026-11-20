import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EnvVar } from '@/types/contract'

type VarsEditorProps = {
  vars: EnvVar[]
  onChange: (vars: EnvVar[]) => void
  disabled?: boolean
}

function normalize(vars: EnvVar[]): EnvVar[] {
  return vars.map((v) =>
    v.isComment ? { isComment: true, comment: v.comment ?? '' } : { key: v.key ?? '', value: v.value ?? '' }
  )
}

export function VarsEditor({ vars, onChange, disabled }: VarsEditorProps) {
  const rows = normalize(vars)
  const [pendingDelete, setPendingDelete] = useState<{ index: number; label: string } | null>(null)

  function update(index: number, patch: Partial<EnvVar>) {
    const next = rows.slice()
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  function requestRemove(index: number) {
    const row = rows[index]
    const label = row?.isComment
      ? `el comentario${row.comment ? ` "${row.comment}"` : ''}`
      : `la variable${row?.key ? ` "${row.key}"` : ''}`
    setPendingDelete({ index, label })
  }

  function confirmRemove() {
    if (pendingDelete == null) return
    const { index } = pendingDelete
    onChange(rows.filter((_, i) => i !== index))
    setPendingDelete(null)
  }

  function addVar() {
    onChange([...rows, { key: '', value: '' }])
  }

  function addComment() {
    onChange([...rows, { isComment: true, comment: '' }])
  }

  return (
    <div className='space-y-2'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[220px]'>Clave / Comentario</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className='w-[60px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className='py-8 text-center text-sm text-muted-foreground'>
                  No hay variables. Añade una clave o un comentario.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {row.isComment ? (
                      <Input
                        value={row.comment ?? ''}
                        onChange={(e) => update(index, { comment: e.target.value })}
                        placeholder='# comentario'
                        disabled={disabled}
                        className='font-mono text-xs'
                      />
                    ) : (
                      <Input
                        value={row.key ?? ''}
                        onChange={(e) => update(index, { key: e.target.value })}
                        placeholder='NOMBRE'
                        disabled={disabled}
                        className='font-mono text-xs'
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {row.isComment ? (
                      <span className='text-xs text-muted-foreground'>Comentario</span>
                    ) : (
                      <Input
                        value={row.value ?? ''}
                        onChange={(e) => update(index, { value: e.target.value })}
                        placeholder='valor'
                        disabled={disabled}
                        className='font-mono text-xs'
                      />
                    )}
                  </TableCell>
                  <TableCell className='text-end'>
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      disabled={disabled}
                      onClick={() => requestRemove(index)}
                      aria-label='Eliminar fila'
                    >
                      <Trash2 className='size-4 text-muted-foreground' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex gap-2'>
        <Button type='button' size='sm' variant='outline' onClick={addVar} disabled={disabled}>
          <Plus className='size-4' /> Variable
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={addComment} disabled={disabled}>
          <Plus className='size-4' /> Comentario
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title='Eliminar elemento'
        desc={
          pendingDelete
            ? `¿Eliminar ${pendingDelete.label}? Esta acción quitará el elemento (Clave/Comentario y Valor) del listado.`
            : ''
        }
        confirmText='Eliminar'
        cancelBtnText='Cancelar'
        destructive
        handleConfirm={confirmRemove}
      />
    </div>
  )
}

// intentionally no extra exports (react-refresh prefers component-only modules)
