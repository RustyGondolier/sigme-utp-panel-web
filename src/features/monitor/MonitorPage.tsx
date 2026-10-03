import { useState } from 'react'
import { Car } from 'lucide-react'
import { Card, EmptyState } from '@/components/ui'
import { PlazaCard } from './components/PlazaCard'
import { PlazaDetailModal } from './components/PlazaDetailModal'
import { PlazaFiltros } from './components/PlazaFiltros'
import { usePlazas } from './hooks/usePlazas'
import { CONFIG_ESTADO_PLAZA, ESTADOS_PLAZA } from './plazas.etiquetas'

/**
 * Monitoreo del estacionamiento (RFA03).
 *
 * Etapa 2: grid de plazas con filtros y modal de detalle sobre el estado local
 * de `usePlazas`. Se guarda solo el id seleccionado: el modal lee la plaza del
 * hook, asi que refleja los cambios en tiempo real cuando se conecte el socket.
 */
export function MonitorPage() {
  const {
    plazas,
    plazasFiltradas,
    sotanos,
    isLoading,
    filtros,
    actualizarFiltros,
    limpiarFiltros,
    obtenerPlaza,
  } = usePlazas()

  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const seleccionada = seleccionadaId === null ? undefined : obtenerPlaza(seleccionadaId)

  const hayFiltros =
    filtros.busqueda.trim() !== '' || filtros.sotano !== 'TODOS' || filtros.estado !== 'TODOS'

  const conteo = { LIBRE: 0, OCUPADA: 0, RESERVADA: 0, FUERA_DE_SERVICIO: 0 }
  for (const p of plazas) conteo[p.estado]++

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Monitoreo del estacionamiento (RFA03)
        </h2>
        <p className="text-sm text-slate-500">
          Estado de cada plaza por sótano y zona. Selecciona una plaza para ver su detalle.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-white">
          Total: {plazas.length}
        </span>
        {ESTADOS_PLAZA.map((e) => (
          <span
            key={e}
            className={`rounded-full px-2.5 py-1 ring-1 ring-inset ${CONFIG_ESTADO_PLAZA[e].insignia}`}
          >
            {CONFIG_ESTADO_PLAZA[e].plural}: {conteo[e]}
          </span>
        ))}
      </div>

      <Card>
        <PlazaFiltros
          filtros={filtros}
          sotanos={sotanos}
          hayFiltros={hayFiltros}
          onCambio={actualizarFiltros}
          onLimpiar={limpiarFiltros}
        />

        <div className="p-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : plazasFiltradas.length === 0 ? (
            <EmptyState
              titulo="No hay plazas con esos filtros"
              descripcion="Quita la búsqueda o cambia el sótano y el estado para ver más resultados."
              icono={<Car className="size-8" aria-hidden="true" />}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {plazasFiltradas.map((p) => (
                <PlazaCard
                  key={p.id}
                  plaza={p}
                  onSeleccionar={(plaza) => setSeleccionadaId(plaza.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {seleccionada !== undefined && (
        <PlazaDetailModal plaza={seleccionada} onClose={() => setSeleccionadaId(null)} />
      )}
    </div>
  )
}
