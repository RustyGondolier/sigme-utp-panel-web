import type { EstadoPlaza } from '@/lib/types/dominio'
import { ESTADOS, clasesEstadoPlaza } from '@/components/shared/estadoPlaza'

/**
 * Presentacion de los cuatro estados de plaza (RFA03).
 *
 * Vive en `components/shared` y no en `components/ui` porque ya sabe que es una
 * "plaza": eso lo hace dominio. Lo usan el Monitor (RFA03), el dashboard
 * (RFA11) y el detalle de reserva (RFA06).
 *
 * La tabla de clases esta en `estadoPlaza.ts` para que este archivo exporte solo
 * componentes y el fast refresh siga funcionando.
 */
export function EstadoPlazaChip({ estado }: { estado: EstadoPlaza }) {
  const { etiqueta, relleno, tinta, borde, Icono } = clasesEstadoPlaza(estado)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${relleno} ${tinta} ${borde}`}
    >
      <Icono className="size-3.5 shrink-0" aria-hidden="true" />
      {etiqueta}
    </span>
  )
}

/** Leyenda de los cuatro estados. La usan el Monitor y el dashboard. */
export function LeyendaEstados({ className }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className ?? ''}`}>
      {(Object.keys(ESTADOS) as EstadoPlaza[]).map((estado) => {
        const { etiqueta, relleno, borde } = ESTADOS[estado]
        return (
          <li key={estado} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              aria-hidden="true"
              className={`size-3 shrink-0 rounded border ${relleno} ${borde}`}
            />
            {etiqueta}
          </li>
        )
      })}
    </ul>
  )
}
