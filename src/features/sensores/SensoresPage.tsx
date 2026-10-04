import { useState } from 'react'
import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Pencil,
  Plus,
  RadioTower,
  RefreshCw,
  Trash2,
  TriangleAlert,
  Wifi,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  Card,
  DataTable,
  EmptyState,
  FilterBar,
  SearchInput,
  Select,
  type Columna,
} from '@/components/ui'
import { SensorFormModal } from './components/SensorFormModal'
import { useSensores } from '@/features/sensores/hooks/useSensores'
import type {
  CrearSensorDTO,
  EstadoConexion,
  EstadoSensor,
  Sensor,
} from '@/features/sensores/types/sensor.types'

/**
 * Gestion de sensores (RFA04).
 *
 * Etapa 2: filtros y paginacion en cliente sobre el estado local de
 * `useSensores`. Al conectar la API, esta logica pasa al servidor igual que
 * en UsuariosPage.
 */

const TAMANIO_PAGINA = 10

const ESTADOS_SENSOR: EstadoSensor[] = ['ACTIVO', 'INACTIVO', 'SIN_SEÑAL']

const NOMBRE_ESTADO: Record<EstadoSensor, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  SIN_SEÑAL: 'Sin señal',
}

const CLASES_ESTADO: Record<EstadoSensor, string> = {
  ACTIVO: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  INACTIVO: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  SIN_SEÑAL: 'bg-red-50 text-red-700 ring-red-600/20',
}

const CONEXION: Record<EstadoConexion, { etiqueta: string; clases: string; Icono: LucideIcon }> = {
  CONECTADO: {
    etiqueta: 'WebSocket Conectado',
    clases: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Icono: Wifi,
  },
  REINTENTANDO: {
    etiqueta: 'WebSocket Reintentando…',
    clases: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Icono: RefreshCw,
  },
  DESCONECTADO: {
    etiqueta: 'WebSocket Desconectado',
    clases: 'bg-red-50 text-red-700 ring-red-600/20',
    Icono: WifiOff,
  },
}

type EstadoModal = { modo: 'crear' } | { modo: 'editar'; sensor: Sensor } | null

function formatearEmision(iso: string | null): string {
  if (iso === null) return 'Sin emisión'
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

function CeldaBateria({ bateria }: { bateria?: number }) {
  if (bateria === undefined) return <span className="text-slate-400">—</span>
  const Icono = bateria < 20 ? BatteryLow : bateria < 60 ? BatteryMedium : BatteryFull
  const color = bateria < 20 ? 'text-red-600' : 'text-slate-600'
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${color}`}>
      <Icono className="size-4" aria-hidden="true" />
      {bateria}%
    </span>
  )
}

export function SensoresPage() {
  const {
    sensores,
    isLoading,
    alertas,
    descartarAlerta,
    estadoConexion,
    simularEvento,
    agregarSensor,
    actualizarSensor,
    eliminarSensor,
  } = useSensores()

  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<EstadoSensor | 'TODOS'>('TODOS')
  const [pagina, setPagina] = useState(1)
  const [modal, setModal] = useState<EstadoModal>(null)
  const [idSimulado, setIdSimulado] = useState('')
  const sensorSimulado = sensores.find((s) => s.id === idSimulado) ?? sensores[0]

  const termino = busqueda.trim().toLowerCase()
  const hayFiltros = termino !== '' || estado !== 'TODOS'

  const filtrados = sensores.filter(
    (s) =>
      (estado === 'TODOS' || s.estado === estado) &&
      (termino === '' ||
        [s.codigo, s.plazaId, s.ubicacion].some((v) => v.toLowerCase().includes(termino))),
  )

  // Si se elimina el ultimo item de la ultima pagina, no se queda en una pagina vacia.
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANIO_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice(
    (paginaActual - 1) * TAMANIO_PAGINA,
    paginaActual * TAMANIO_PAGINA,
  )

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor)
    setPagina(1)
  }

  function cambiarEstado(valor: EstadoSensor | 'TODOS') {
    setEstado(valor)
    setPagina(1)
  }

  function limpiarFiltros() {
    setBusqueda('')
    setEstado('TODOS')
    setPagina(1)
  }

  function guardar(datos: CrearSensorDTO) {
    if (modal?.modo === 'editar') {
      actualizarSensor(modal.sensor.id, datos)
    } else {
      agregarSensor(datos)
    }
    setModal(null)
  }

  function eliminar(sensor: Sensor) {
    if (window.confirm(`¿Eliminar el sensor ${sensor.codigo}? Esta acción no se puede deshacer.`)) {
      eliminarSensor(sensor.id)
    }
  }

  function simularSinSenal() {
    if (sensorSimulado === undefined) return
    simularEvento({
      tipo: 'sensor:alerta_sin_senal',
      payload: {
        id: sensorSimulado.id,
        codigo: sensorSimulado.codigo,
        plazaId: sensorSimulado.plazaId,
      },
    })
  }

  function simularActualizacion() {
    if (sensorSimulado === undefined) return
    simularEvento({
      tipo: 'sensor:actualizado',
      payload: {
        id: sensorSimulado.id,
        estado: 'ACTIVO',
        ultimaEmision: new Date().toISOString(),
        bateria: Math.max(0, (sensorSimulado.bateria ?? 100) - 10),
      },
    })
  }

  const columnas: Columna<Sensor>[] = [
    {
      id: 'codigo',
      encabezado: 'Código',
      ancho: '120px',
      celda: (s) => <span className="font-mono text-xs">{s.codigo}</span>,
    },
    {
      id: 'plaza',
      encabezado: 'Plaza / Ubicación',
      celda: (s) => (
        <div>
          <span className="font-medium text-slate-800">{s.plazaId}</span>
          <span className="block text-xs text-slate-500">{s.ubicacion}</span>
        </div>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (s) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CLASES_ESTADO[s.estado]}`}
        >
          {NOMBRE_ESTADO[s.estado]}
        </span>
      ),
    },
    {
      id: 'ultimaEmision',
      encabezado: 'Última emisión',
      celda: (s) => formatearEmision(s.ultimaEmision),
    },
    {
      id: 'bateria',
      encabezado: 'Batería',
      celda: (s) => <CeldaBateria bateria={s.bateria} />,
    },
    {
      id: 'acciones',
      encabezado: 'Acciones',
      ancho: '110px',
      celda: (s) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setModal({ modo: 'editar', sensor: s })}
            aria-label={`Editar sensor ${s.codigo}`}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => eliminar(s)}
            aria-label={`Eliminar sensor ${s.codigo}`}
            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Gestión de Sensores (RFA04)</h2>
          <p className="text-sm text-slate-500">
            Registra, edita y monitorea los sensores asignados a cada plaza del estacionamiento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            role="status"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${CONEXION[estadoConexion].clases}`}
          >
            {(() => {
              const { Icono } = CONEXION[estadoConexion]
              return (
                <Icono
                  className={`size-3.5 ${estadoConexion === 'REINTENTANDO' ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
              )
            })()}
            {CONEXION[estadoConexion].etiqueta}
          </span>
          <button
            type="button"
            onClick={() => setModal({ modo: 'crear' })}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nuevo Sensor
          </button>
        </div>
      </div>

      {import.meta.env.DEV && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3 text-sm">
          <span className="font-medium text-amber-800">Dev:</span>
          <select
            value={sensorSimulado?.id ?? ''}
            onChange={(e) => setIdSimulado(e.target.value)}
            aria-label="Sensor objetivo de la simulación"
            className="rounded-md border border-amber-300 bg-white px-2 py-1"
          >
            {sensores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.codigo}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={simularSinSenal}
            disabled={sensorSimulado === undefined}
            className="rounded-md bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            Simular Desconexión (SIN_SEÑAL)
          </button>
          <button
            type="button"
            onClick={simularActualizacion}
            disabled={sensorSimulado === undefined}
            className="rounded-md bg-slate-800 px-3 py-1 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Simular Cambio de Batería / Estado
          </button>
        </div>
      )}

      <Card>
        <FilterBar onLimpiar={limpiarFiltros} hayFiltros={hayFiltros}>
          <SearchInput
            valor={busqueda}
            onCambio={cambiarBusqueda}
            placeholder="Buscar por código, plaza o ubicación"
            etiqueta="Buscar sensores"
            className="sm:max-w-xs"
          />
          <Select
            value={estado}
            onChange={(e) => cambiarEstado(e.target.value as EstadoSensor | 'TODOS')}
            aria-label="Filtrar por estado de sensor"
            className="sm:w-44"
          >
            <option value="TODOS">Todos los estados</option>
            {ESTADOS_SENSOR.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </Select>
        </FilterBar>

        <DataTable<Sensor>
          columnas={columnas}
          datos={visibles}
          claveFila={(s) => s.id}
          cargando={isLoading}
          vacio={
            <EmptyState
              titulo="No hay sensores con esos filtros"
              descripcion="Quita la búsqueda o cambia el estado para ver más resultados."
              icono={<RadioTower className="size-8" aria-hidden="true" />}
            />
          }
          paginacion={{
            pagina: paginaActual,
            pageSize: TAMANIO_PAGINA,
            total: filtrados.length,
            onCambioPagina: setPagina,
          }}
        />
      </Card>

      {modal !== null && (
        <SensorFormModal
          key={modal.modo === 'editar' ? modal.sensor.id : 'nuevo'}
          sensor={modal.modo === 'editar' ? modal.sensor : undefined}
          onSubmit={guardar}
          onClose={() => setModal(null)}
        />
      )}

      {/* Toasts de alerta (sensor:alerta_sin_senal o paso a SIN_SEÑAL) */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2"
      >
        {alertas.map((a) => (
          <div
            key={a.sensorId}
            role="alert"
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-red-200 bg-white p-3 shadow-lg"
          >
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-slate-800">Sensor sin señal</p>
              <p className="text-slate-600">
                {a.codigo} · Plaza {a.plazaId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => descartarAlerta(a.sensorId)}
              aria-label={`Cerrar alerta del sensor ${a.codigo}`}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
