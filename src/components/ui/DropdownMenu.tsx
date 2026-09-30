import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Menu contextual. Lo usa el bloque de usuario del header (perfil, cerrar
 * sesion) y los menus de fila de las tablas.
 *
 * Se reexportan los primitives de Radix con el estilo ya puesto, para que las
 * vistas no repitan las clases de foco y de resaltado en cada menu.
 */

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  children,
  alinear = 'end',
  className,
}: {
  children: ReactNode
  alinear?: 'start' | 'center' | 'end'
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={alinear}
        sideOffset={6}
        className={cn(
          'bg-surface z-50 min-w-56 rounded-lg border border-slate-200 p-1 shadow-lg',
          className,
        )}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  children,
  onSelect,
  peligroso = false,
  className,
}: {
  children: ReactNode
  onSelect?: () => void
  /** Items de salida: cancelar reserva, desactivar cuenta. */
  peligroso?: boolean
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 outline-none select-none data-highlighted:bg-slate-100',
        peligroso && 'text-brand-700 data-highlighted:bg-brand-50',
        className,
      )}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="my-1 h-px bg-slate-100" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className="px-3 py-1.5 text-xs font-medium text-slate-500">
      {children}
    </DropdownMenuPrimitive.Label>
  )
}
