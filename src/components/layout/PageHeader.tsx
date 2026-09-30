import type { ReactNode } from 'react'
import { ETIQUETA_GRUPO, type GrupoMenu } from '@/app/navItems'
import { cn } from '@/lib/cn'

/**
 * Cabecera de pagina. Va en el layout y no en cada vista para que las 11
 * secciones compartan el mismo ritmo: codigo del requerimiento, grupo, titulo,
 * descripcion y el espacio de acciones a la derecha.
 *
 * `acciones` es opcional y se alinea a la derecha; los botones de cada vista
 * (nuevo usuario, recargar sensores) van aqui en vez de improvisar su propia
 * fila, que es lo que desalinea los titulos entre vistas.
 */
export function PageHeader({
  titulo,
  descripcion,
  rfa,
  grupo,
  acciones,
}: {
  titulo: string
  descripcion: string
  rfa: string
  grupo: GrupoMenu
  acciones?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-brand-700 font-mono text-[11px] font-semibold tracking-wide">
            {rfa}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            /
          </span>
          <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
            {ETIQUETA_GRUPO[grupo]}
          </span>
        </div>
        <h1 className="mt-1 text-xl font-bold text-slate-900">{titulo}</h1>
        <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>
      </div>
      {acciones ? <div className={cn('flex shrink-0 items-center gap-2')}>{acciones}</div> : null}
    </div>
  )
}
