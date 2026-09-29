import { cn } from '@/lib/cn'
import { clasesEstadoPlaza } from '@/components/shared/estadoPlaza'
import type { Plaza } from '@/lib/types/dominio'
import { tiempoTranscurrido } from '@/lib/formatters'

/**
 * Grilla de plazas del Monitor (RFA03). Es el diferenciador del panel, asi que
 * se construye aqui una sola vez y no dentro de la vista: cuando el backend
 * mande mas de una cochera (RNF11), el componente ya acepta listas de varias.
 *
 * El tamano de celda es fijo (w-40). Con 8 plazas se ven grandes; con 120 se
 * mantienen legibles y la grilla simplemente crece. No se estira para llenar
 * el ancho porque eso deformaria la proportion cuando cambie el numero.
 */
export function PlazaGrid({
  plazas,
  alSeleccionar,
  seleccionadaId,
  ahora,
  className,
}: {
  plazas: Plaza[]
  alSeleccionar?: (plaza: Plaza) => void
  seleccionadaId?: string
  /** Se pasa desde el padre para que todas las celdas compartan un solo reloj. */
  ahora?: Date
  className?: string
}) {
  return (
    <div
      role="list"
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {plazas.map((plaza) => (
        <PlazaCard
          key={plaza.id}
          plaza={plaza}
          seleccionada={plaza.id === seleccionadaId}
          alSeleccionar={alSeleccionar}
          ahora={ahora}
        />
      ))}
    </div>
  )
}

function PlazaCard({
  plaza,
  seleccionada,
  alSeleccionar,
  ahora,
}: {
  plaza: Plaza
  seleccionada: boolean
  alSeleccionar?: (plaza: Plaza) => void
  ahora?: Date
}) {
  const { etiqueta, relleno, tinta, borde, Icono } = clasesEstadoPlaza(plaza.estado)
  const interactiva = Boolean(alSeleccionar)

  return (
    <div
      role="listitem"
      onClick={interactiva ? () => alSeleccionar?.(plaza) : undefined}
      onKeyDown={
        interactiva
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                alSeleccionar?.(plaza)
              }
            }
          : undefined
      }
      tabIndex={interactiva ? 0 : undefined}
      data-plaza={plaza.codigo}
      data-estado={plaza.estado}
      data-activa={seleccionada ? 'true' : undefined}
      className={cn(
        'rounded-xl border-2 p-3 transition-shadow',
        relleno,
        tinta,
        borde,
        interactiva && 'cursor-pointer hover:shadow-md',
        seleccionada && 'ring-brand-500 ring-2 ring-offset-2',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold">{plaza.codigo}</span>
        <Icono className="size-4 shrink-0 opacity-80" aria-hidden="true" />
      </div>

      <p className="mt-1 text-xs font-medium">{etiqueta}</p>

      {plaza.ocupante ? (
        <div className="mt-2 border-t border-current/20 pt-2 text-xs">
          <p className="truncate font-medium">{plaza.ocupante.nombre}</p>
          <p className="truncate opacity-80">{plaza.ocupante.vehiculo}</p>
          <p className="mt-0.5 opacity-80">{tiempoTranscurrido(plaza.ocupante.ingresoEn, ahora)}</p>
        </div>
      ) : null}
    </div>
  )
}
