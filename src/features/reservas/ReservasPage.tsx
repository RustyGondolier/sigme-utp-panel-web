import { useEffect, useState } from 'react'
import { DataTable, type Columna } from '@/components/ui/DataTable'
import type { Reserva } from '@/lib/types/dominio'
import { listarReservas } from './reservas.api'
import { cuentaRegresiva, fechaHora } from '@/lib/formatters'
import { useTic } from '@/lib/hooks/useTic'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [cargando, setCargando] = useState(true)
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null)
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false)
  const ahora = useTic()

  const columnas: Columna<Reserva>[] = [
    {
      id: 'usuario',
      encabezado: 'Usuario',
      celda: (reserva) => (
        <div>
          <div className="font-medium text-slate-900">{reserva.nombreUsuario}</div>
          <div className="text-xs text-slate-500">{reserva.codigoUsuario}</div>
        </div>
      ),
    },
    {
      id: 'cochera',
      encabezado: 'Cochera',
      celda: (reserva) => reserva.cocheraId,
    },
    {
      id: 'plaza',
      encabezado: 'Plaza',
      celda: (reserva) => reserva.codigoPlaza,
    },
    {
      id: 'solicitadaEn',
      encabezado: 'Solicitada',
      celda: (reserva) => fechaHora(reserva.solicitadaEn),
    },
    {
      id: 'tiempoRestante',
      encabezado: 'Tiempo restante',
      celda: (reserva) => (
        <span className="font-mono font-semibold text-slate-900">
          {cuentaRegresiva(reserva.venceEn, ahora)}
        </span>
      ),
    },
    {
      id: 'estado',
      encabezado: 'Estado',
      celda: (reserva) => reserva.estado,
    },
  ]

  useEffect(() => {
    listarReservas()
      .then((respuesta) => setReservas(respuesta.items))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reservas activas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consulta las reservas activas del estacionamiento.
        </p>
      </div>

      <DataTable
        columnas={columnas}
        datos={reservas}
        claveFila={(reserva) => reserva.id}
        cargando={cargando}
        vacio="No hay reservas activas."
        alClickFila={setReservaSeleccionada}
        filaActivaId={reservaSeleccionada?.id}
      />

      {reservaSeleccionada ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Detalle de la reserva</h2>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="font-medium text-slate-700">Usuario:</span>{' '}
              {reservaSeleccionada.nombreUsuario}
            </div>

            <div>
              <span className="font-medium text-slate-700">Codigo:</span>{' '}
              {reservaSeleccionada.codigoUsuario}
            </div>

            <div>
              <span className="font-medium text-slate-700">Cochera:</span>{' '}
              {reservaSeleccionada.cocheraId}
            </div>

            <div>
              <span className="font-medium text-slate-700">Plaza:</span>{' '}
              {reservaSeleccionada.codigoPlaza}
            </div>

            <div>
              <span className="font-medium text-slate-700">Solicitada:</span>{' '}
              {fechaHora(reservaSeleccionada.solicitadaEn)}
            </div>

            <div>
              <span className="font-medium text-slate-700">Tiempo restante:</span>{' '}
              {cuentaRegresiva(reservaSeleccionada.venceEn, ahora)}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variante="peligro" onClick={() => setConfirmarCancelacion(true)}>
              Cancelar reserva
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        abierto={confirmarCancelacion}
        onCerrar={() => setConfirmarCancelacion(false)}
        onConfirmar={(motivo) => {
          console.log('Cancelar reserva:', reservaSeleccionada?.id, motivo)
        }}
        titulo="Cancelar reserva"
        descripcion="Esta accion cancelara la reserva seleccionada."
        etiquetaConfirmar="Cancelar reserva"
      />
    </div>
  )
}
