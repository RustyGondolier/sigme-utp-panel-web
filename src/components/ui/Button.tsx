import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Boton. Unico punto de la app donde se decide el peso visual de una accion
 * primaria, asi que las 12 vistas no negocian colores distintos.
 *
 * El foco visible lo aporta `:focus-visible` en globals.css, no cada boton.
 */
const variantes = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variante: {
        primario: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
        secundario: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
        fantasma: 'text-slate-700 hover:bg-slate-100',
        peligro: 'bg-brand-700 text-white hover:bg-brand-800',
        enlace: 'text-brand-700 underline-offset-4 hover:underline',
      },
      tamano: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icono: 'h-9 w-9 p-0',
      },
      ancho: {
        auto: '',
        completo: 'w-full',
      },
    },
    defaultVariants: { variante: 'primario', tamano: 'md', ancho: 'auto' },
  },
)

export type ButtonVariants = VariantProps<typeof variantes>

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  izquierda?: ReactNode
  derecha?: ReactNode
  /** Spinner y bloqueo de clics mientras la accion esta en vuelo. */
  cargando?: boolean
}

export function Button({
  variante,
  tamano,
  ancho,
  className,
  izquierda,
  derecha,
  cargando = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(variantes({ variante, tamano, ancho }), className)}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        izquierda
      )}
      {children}
      {derecha}
    </button>
  )
}
