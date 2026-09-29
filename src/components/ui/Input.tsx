import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const campoBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

/** Etiqueta + control. Envuelve cualquier campo para que el grupo tenga el mismo ritmo. */
export function Field({
  etiqueta,
  htmlFor,
  error,
  ayuda,
  requerido = false,
  children,
  className,
}: {
  etiqueta: string
  htmlFor: string
  error?: string
  ayuda?: string
  /** Marca el campo como obligatorio. El asterisco es decorativo: el control
      lleva el atributo `required`, que es el que un lector de pantalla lee. */
  requerido?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {etiqueta}
        {requerido ? (
          <span aria-hidden="true" className="text-brand-700 ml-0.5">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-brand-700 text-xs">
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${htmlFor}-ayuda`} className="text-xs text-slate-500">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(campoBase, 'h-10', error && 'border-brand-600', className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${props.id}-error` : undefined}
      {...props}
    />
  )
}

/**
 * Select nativo estilizado. Se elige nativo y no @radix-ui/react-select a
 * proposito: en filtros de tabla un select nativo es mas rapido de usar con
 * teclado y no requiere dependencias. Si alguna vez hace falta algo mas
 * (multiples, busqueda), el swap reemplaza este componente, no las vistas.
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export function Select({ className, error, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        campoBase,
        'h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9',
        error && 'border-brand-600',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")",
      }}
      aria-invalid={error ? true : undefined}
      {...props}
    >
      {children}
    </select>
  )
}

/** Area de texto multilinea. Los motivos de RFA06 y RFA12 van aqui. */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        campoBase,
        'resize-y py-2 leading-relaxed',
        error && 'border-brand-600',
        className,
      )}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && props.id ? `${props.id}-error` : undefined}
      {...props}
    />
  )
}
