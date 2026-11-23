import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type SectionOption<T extends string> = {
  id: T
  label: string
  description?: string
}

type ExportPdfDialogProps<T extends string> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  sections: SectionOption<T>[]
  defaultSections: T[]
  onConfirm: (sections: T[]) => Promise<void> | void
}

export function ExportPdfDialog<T extends string>({
  open,
  onOpenChange,
  title,
  description,
  sections,
  defaultSections,
  onConfirm,
}: ExportPdfDialogProps<T>) {
  const [selected, setSelected] = useState<T[]>(defaultSections)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (id: T, checked: boolean) => {
    setSelected((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((s) => s !== id)
    })
  }

  const handleConfirm = async () => {
    if (selected.length === 0) {
      setError('Selecciona al menos una sección.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(selected)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el PDF')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {sections.map((section) => {
            const checked = selected.includes(section.id)
            return (
              <label
                key={section.id}
                className='flex items-start gap-3 rounded-md border p-3 text-sm'
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => toggle(section.id, v === true)}
                  disabled={busy}
                />
                <div className='space-y-0.5'>
                  <Label className='text-sm font-medium'>{section.label}</Label>
                  {section.description && (
                    <p className='text-xs text-muted-foreground'>{section.description}</p>
                  )}
                </div>
              </label>
            )
          })}
          {error && <p className='text-sm text-destructive'>{error}</p>}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={busy}>
            {busy ? 'Generando…' : 'Generar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
