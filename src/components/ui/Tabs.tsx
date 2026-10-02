import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Pestanas. Es el patron que pide el plan para el detalle de usuario (RFA02) y
 * que se repetira en Reservas (RFA05), Accesos (RFA07) y Cuentas de
 * administrador (RFA12): una seccion que cambia de contenido sin cambiar de
 * ruta ni recargar la pagina.
 *
 * Implementa el patron de WAI-ARIA completo porque un `div` con `onClick` deja
 * fuera a quien navega con teclado: aqui las flechas mueven el foco entre
 * pestanas, como espera cualquier persona que ya uso un navegador.
 *
 * Controlado y no interno: la vista decide que pestana esta activa porque RFA02
 * necesita reiniciar la paginacion al cambiar de historial, y eso es estado de
 * la vista, no del primitivo.
 */
export interface PanelTab {
  id: string
  etiqueta: string
  /** Contador opcional. Acompana a la etiqueta, nunca la reemplaza. */
  conteo?: number
  contenido: ReactNode
}

export function Tabs({
  paneles,
  activa,
  onCambio,
  etiquetaGrupo,
  className,
}: {
  paneles: PanelTab[]
  activa: string
  onCambio: (id: string) => void
  /** Nombre del grupo para lectores de pantalla ("Historiales del usuario"). */
  etiquetaGrupo: string
  className?: string
}) {
  const idBase = useId()
  /**
   * Foco por id en un ref y no por selector CSS: el id de `useId` lleva dos
   * puntos, asi que `#${id}` no es un selector valido y habria que escaparlo.
   * Un Map de refs no depende de como se construya ese id.
   */
  const botonesRef = useRef(new Map<string, HTMLButtonElement>())

  function moverFoco(indice: number) {
    const destino = paneles[indice]
    if (!destino) return
    onCambio(destino.id)
    botonesRef.current.get(destino.id)?.focus()
  }

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>) {
    const indiceActual = Math.max(
      0,
      paneles.findIndex((p) => p.id === activa),
    )
    const ultimo = paneles.length - 1

    switch (evento.key) {
      case 'ArrowRight':
        evento.preventDefault()
        moverFoco(indiceActual === ultimo ? 0 : indiceActual + 1)
        break
      case 'ArrowLeft':
        evento.preventDefault()
        moverFoco(indiceActual === 0 ? ultimo : indiceActual - 1)
        break
      case 'Home':
        evento.preventDefault()
        moverFoco(0)
        break
      case 'End':
        evento.preventDefault()
        moverFoco(ultimo)
        break
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={etiquetaGrupo}
        onKeyDown={alTeclear}
        className="flex flex-wrap gap-1 border-b border-slate-200"
      >
        {paneles.map((panel) => {
          const seleccionado = panel.id === activa
          return (
            <button
              key={panel.id}
              ref={(nodo) => {
                if (nodo) botonesRef.current.set(panel.id, nodo)
                else botonesRef.current.delete(panel.id)
              }}
              id={`${idBase}-tab-${panel.id}`}
              type="button"
              role="tab"
              aria-selected={seleccionado}
              aria-controls={`${idBase}-panel-${panel.id}`}
              tabIndex={seleccionado ? 0 : -1}
              onClick={() => onCambio(panel.id)}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                seleccionado
                  ? 'border-brand-600 text-brand-800'
                  : 'text-slate-500 hover:border-slate-300 hover:text-slate-700',
              )}
            >
              {panel.etiqueta}
              {panel.conteo !== undefined ? (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                    seleccionado ? 'bg-brand-50 text-brand-800' : 'bg-slate-100 text-slate-600',
                  )}
                >
                  {panel.conteo}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {paneles.map((panel) => (
        <div
          key={panel.id}
          id={`${idBase}-panel-${panel.id}`}
          role="tabpanel"
          aria-labelledby={`${idBase}-tab-${panel.id}`}
          hidden={panel.id !== activa}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          {panel.id === activa ? panel.contenido : null}
        </div>
      ))}
    </div>
  )
}
