import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Estados de carga, vacio y error. Casi todas las vistas los necesitan y los
 * tres aparecen en el mismo lugar: dentro de la tarjeta que reemplaza al
 * contenido mientras la consulta corre. Verlos iguales en todas las pantallas
 * es parte de la percepcion de calidad ante el jurado.
 */

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      {...props}
    />
  )
}

/** Bloque de esqueleto con la forma aproximada de una tabla. */
export function SkeletonTabla({ filas = 6, columnas = 5 }: { filas?: number; columnas?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Cargando">
      {Array.from({ length: filas }, (_, f) => (
        <div key={f} className="flex gap-3">
          {Array.from({ length: columnas }, (_, c) => (
            <Skeleton key={c} className={cn('h-9', c === 0 ? 'w-1/4' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  titulo,
  descripcion,
  icono,
  accion,
  className,
}: {
  titulo: string
  descripcion?: string
  icono?: ReactNode
  accion?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center',
        className,
      )}
    >
      {icono ? <div className="text-slate-400">{icono}</div> : null}
      <p className="text-sm font-medium text-slate-700">{titulo}</p>
      {descripcion ? <p className="max-w-sm text-sm text-slate-500">{descripcion}</p> : null}
      {accion ? <div className="mt-2">{accion}</div> : null}
    </div>
  )
}

/**
 * Estado de error con reintento. RFA01, RFA03, RFA07, RFA09, RFA11 y RFA13
 * exigen mensaje de error CON opcion de reintentar: este componente es la
 * pieza que lo cumple en todas.
 */
export function ErrorState({
  titulo = 'No se pudieron cargar los datos',
  descripcion,
  onReintentar,
  className,
}: {
  titulo?: string
  descripcion?: string
  onReintentar?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'border-brand-200 bg-brand-50 flex flex-col items-center justify-center gap-2 rounded-lg border px-6 py-10 text-center',
        className,
      )}
    >
      <p className="text-brand-900 text-sm font-semibold">{titulo}</p>
      {descripcion ? <p className="text-brand-800 max-w-sm text-sm">{descripcion}</p> : null}
      {onReintentar ? (
        <button
          type="button"
          onClick={onReintentar}
          className="bg-brand-500 hover:bg-brand-600 mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  )
}
