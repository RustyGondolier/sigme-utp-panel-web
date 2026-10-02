import { useEffect, useState } from 'react'
import { DataTable, type Columna } from '@/components/ui/DataTable'
import { fechaHora } from '@/lib/formatters'
import type { EntradaAuditoria } from '@/lib/types/dominio'
import { listarAuditoria } from './auditoria.api'

const columnas: Columna<EntradaAuditoria>[] = [
  {
    id: 'administrador',
    encabezado: 'Administrador',
    celda: (entrada) => entrada.adminNombre,
  },
  {
    id: 'accion',
    encabezado: 'Accion',
    celda: (entrada) => entrada.accion,
  },
  {
    id: 'elemento',
    encabezado: 'Elemento afectado',
    celda: (entrada) => entrada.elemento,
  },
  {
    id: 'fecha',
    encabezado: 'Fecha y hora',
    celda: (entrada) => fechaHora(entrada.ocurridoEn),
  },
]

export function AuditoriaPage() {
  const [entradas, setEntradas] = useState<EntradaAuditoria[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    listarAuditoria()
      .then((respuesta) => setEntradas(respuesta.items))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro de acciones administrativas del sistema.
        </p>
      </div>

      <DataTable
        columnas={columnas}
        datos={entradas}
        claveFila={(entrada) => entrada.id}
        cargando={cargando}
        vacio="No hay registros de auditoria."
      />
    </div>
  )
}
