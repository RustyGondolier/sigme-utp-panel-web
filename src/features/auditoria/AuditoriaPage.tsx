import { useEffect, useState } from 'react'
import { DataTable, type Columna } from '@/components/ui/DataTable'
import { fechaHora } from '@/lib/formatters'
import type { EntradaAuditoria } from '@/lib/types/dominio'
import { listarAuditoria } from './auditoria.api'
import { FilterBar, SearchInput } from '@/components/ui/SearchInput'
import { Input, Select } from '@/components/ui/Input'

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
  const [filtroAdmin, setFiltroAdmin] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroElemento, setFiltroElemento] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  useEffect(() => {
    listarAuditoria({
      adminId: filtroAdmin,
      accion: filtroAccion,
      elemento: filtroElemento,
      desde: filtroDesde || undefined,
      hasta: filtroHasta || undefined,
    })
      .then((respuesta) => setEntradas(respuesta.items))
      .finally(() => setCargando(false))
  }, [filtroAdmin, filtroAccion, filtroElemento, filtroDesde, filtroHasta])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro de acciones administrativas del sistema.
        </p>
      </div>

      <FilterBar
        hayFiltros={Boolean(
          filtroAdmin || filtroAccion || filtroElemento || filtroDesde || filtroHasta,
        )}
        onLimpiar={() => {
          setFiltroAdmin('')
          setFiltroAccion('')
          setFiltroElemento('')
          setFiltroDesde('')
          setFiltroHasta('')
        }}
      >
        <Select
          aria-label="Filtrar por administrador"
          value={filtroAdmin}
          onChange={(e) => setFiltroAdmin(e.target.value)}
        >
          <option value="">Todos los administradores</option>
          <option value="adm-001">Administrador</option>
        </Select>

        <Select
          aria-label="Filtrar por accion"
          value={filtroAccion}
          onChange={(e) => setFiltroAccion(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          <option value="CANCELAR_RESERVA">Cancelar reserva</option>
          <option value="CREAR_CATEGORIA_FAQ">Crear categoria FAQ</option>
          <option value="EDITAR_PREGUNTA_FAQ">Editar pregunta FAQ</option>
        </Select>

        <SearchInput
          valor={filtroElemento}
          onCambio={setFiltroElemento}
          etiqueta="Filtrar por elemento afectado"
          placeholder="Elemento afectado..."
          className="min-w-64 flex-1"
        />

        <Input
          type="date"
          value={filtroDesde}
          onChange={(e) => setFiltroDesde(e.target.value)}
          aria-label="Fecha desde"
        />

        <Input
          type="date"
          value={filtroHasta}
          onChange={(e) => setFiltroHasta(e.target.value)}
          aria-label="Fecha hasta"
        />
      </FilterBar>

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
