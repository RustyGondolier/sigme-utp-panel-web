import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Modal sobre @radix-ui/react-dialog. Radix aporta el focus trap, el cierre con
 * Escape, el bloqueo de scroll del body y los roles ARIA; aqui solo esta el
 * estilo. Es la base de ConfirmDialog.
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancho = 'md',
}: {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  children: ReactNode
  pie?: ReactNode
  ancho?: 'sm' | 'md' | 'lg'
}) {
  const anchos = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  } as const

  return (
    <Dialog.Root open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={cn(
            'bg-surface fixed top-1/2 left-1/2 z-50 max-h-[calc(100vh-4rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-5 shadow-lg',
            anchos[ancho],
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-slate-900">
                {titulo}
              </Dialog.Title>
              {descripcion ? (
                <Dialog.Description className="mt-1 text-sm text-slate-500">
                  {descripcion}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              className="-mt-1 -mr-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {children}

          {pie ? <div className="mt-5 flex justify-end gap-2">{pie}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
