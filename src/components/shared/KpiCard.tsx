import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Tarjeta de indicador. Es la unidad de lectura del dashboard (RFA11) y se
 * repite en las vistas de resumen. El valor usa `tabular-nums` para que las
 * cifras no bailen cuando cambian en tiempo real.
 */
export function KpiCard({
  etiqueta,
  valor,
  detalle,
  icono,
  tendencia,
  className,
}: {
  etiqueta: string
  valor: string | number
  detalle?: string
  icono?: ReactNode
  /** Solo cambia el color del icono. El valor nunca se tiñe: debe contrastar. */
  tendencia?: 'marca' | 'acento' | 'alerta' | 'neutro'
  className?: string
}) {
  const acentos = {
    marca: 'text-brand-700',
    acento: 'text-accent-600',
    alerta: 'text-amber-600',
    neutro: 'text-slate-400',
  } as const

  return (
    <div className={cn('bg-surface rounded-xl border border-slate-200 p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{etiqueta}</p>
        {icono ? (
          <span className={cn('shrink-0', acentos[tendencia ?? 'neutro'])}>{icono}</span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{valor}</p>
      {detalle ? <p className="mt-1 text-xs text-slate-500">{detalle}</p> : null}
    </div>
  )
}

/** Fila de KPIs. Responsive: 1 columna en movil, 4 en escritorio. */
export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  )
}
