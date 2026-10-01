import { useEffect, useState } from 'react'
import { DataTable, type Columna } from '@/components/ui/DataTable'
import type { Reserva } from '@/lib/types/dominio'
import { listarReservas } from './reservas.api'
import { cuentaRegresiva, fechaHora } from '@/lib/formatters'
import { useTic } from '@/lib/hooks/useTic'

export function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [cargando, setCargando] = useState(true)
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
      />
    </div>
  )
}
