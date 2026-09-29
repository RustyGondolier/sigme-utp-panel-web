import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** Etiqueta de estado. Los tonos son semanticos, no decorativos. */
const tonos = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tono: {
        neutro: 'bg-slate-100 text-slate-700',
        marca: 'bg-brand-50 text-brand-800',
        exito: 'bg-accent-50 text-accent-800',
        alerta: 'bg-amber-50 text-amber-800',
        error: 'bg-brand-100 text-brand-900',
        oscuro: 'bg-slate-800 text-slate-100',
      },
    },
    defaultVariants: { tono: 'neutro' },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof tonos> {}

export function Badge({ tono, className, ...props }: BadgeProps) {
  return <span className={cn(tonos({ tono }), className)} {...props} />
}

/**
 * Punto de estado. Acompana a la etiqueta en tablas donde la columna es
 * estrecha. Lleva texto oculto para lectores de pantalla, porque un punto de
 * color no es información accesible por sí solo.
 */
export function StatusDot({
  color,
  etiqueta,
  className,
}: {
  color: 'exito' | 'alerta' | 'error' | 'neutro' | 'marca'
  etiqueta: string
  className?: string
}) {
  const colores = {
    exito: 'bg-accent-600',
    alerta: 'bg-amber-500',
    error: 'bg-brand-600',
    neutro: 'bg-slate-400',
    marca: 'bg-brand-500',
  } as const

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', colores[color])} />
      <span className="sr-only">{etiqueta}</span>
    </span>
  )
}
