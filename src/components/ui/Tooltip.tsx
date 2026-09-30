import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

/**
 * Tooltip. Lo usa el sidebar cuando esta colapsado a iconos: sin esto el
 * administrador tendria que adivinar que significa cada icono.
 *
 * Radix maneja posicion, Escape y el retardo de apertura.
 */
export function Tooltip({
  contenido,
  children,
  lado = 'right',
}: {
  contenido: string
  children: ReactNode
  lado?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <TooltipPrimitive.Root delayDuration={300}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={lado}
          sideOffset={8}
          className="z-50 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-md"
        >
          {contenido}
          <TooltipPrimitive.Arrow className="fill-slate-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/** Envuelve el arbol una vez en la raiz de la app. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider skipDelayDuration={300}>{children}</TooltipPrimitive.Provider>
}
