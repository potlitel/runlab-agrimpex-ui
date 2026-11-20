import { useQuery } from '@tanstack/react-query'
import { FileCode2 } from 'lucide-react'
import { testsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

type TestFileDialogProps = {
  file: string | null
  onOpenChange: (open: boolean) => void
}

export function TestFileDialog({ file, onOpenChange }: TestFileDialogProps) {
  const open = !!file
  const query = useQuery({
    queryKey: ['tests', 'file', file],
    queryFn: () => testsApi.getFile(file as string),
    enabled: open,
    retry: false,
  })

  const errorMessage =
    query.error instanceof Error ? query.error.message : 'No se pudo cargar el archivo.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileCode2 className='size-4 text-muted-foreground' />
            {file?.split('/').pop() ?? 'Archivo de test'}
          </DialogTitle>
          <DialogDescription className='truncate font-mono text-xs'>
            {file}
          </DialogDescription>
        </DialogHeader>

        {query.isPending ? (
          <div className='space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-4 w-full' />
          </div>
        ) : query.isError ? (
          <p className='rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
            {errorMessage}
          </p>
        ) : (
          <>
            <ScrollArea className='max-h-[60vh] rounded-md border bg-muted/30'>
              <pre className='p-4 font-mono text-xs whitespace-pre'>
                {query.data?.content}
              </pre>
            </ScrollArea>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Badge variant='secondary'>
                {query.data?.size ?? query.data?.content.length ?? 0} bytes
              </Badge>
              {query.data?.mtime && <span>Modificado: {query.data.mtime}</span>}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
