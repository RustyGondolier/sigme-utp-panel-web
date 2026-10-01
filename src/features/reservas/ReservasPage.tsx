import { useEffect, useState } from 'react'
import { DataTable, type Columna } from '@/components/ui/DataTable'
import type { Reserva } from '@/lib/types/dominio'
import { listarReservas } from './reservas.api'

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
    celda: (reserva) => new Date(reserva.solicitadaEn).toLocaleString(),
  },
  {
    id: 'venceEn',
    encabezado: 'Vence',
    celda: (reserva) => new Date(reserva.venceEn).toLocaleTimeString(),
  },
  {
    id: 'estado',
    encabezado: 'Estado',
    celda: (reserva) => reserva.estado,
  },
]

export function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [cargando, setCargando] = useState(true)

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
