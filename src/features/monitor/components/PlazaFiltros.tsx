import { FilterBar, SearchInput, Select } from '@/components/ui'
import { CONFIG_ESTADO_PLAZA, ESTADOS_PLAZA } from '../plazas.etiquetas'
import type { EstadoPlaza, FiltrosPlaza } from '../types/plaza.types'

interface Props {
  filtros: FiltrosPlaza
  sotanos: string[]
  hayFiltros: boolean
  onCambio: (cambios: Partial<FiltrosPlaza>) => void
  onLimpiar: () => void
}

export function PlazaFiltros({ filtros, sotanos, hayFiltros, onCambio, onLimpiar }: Props) {
  return (
    <FilterBar onLimpiar={onLimpiar} hayFiltros={hayFiltros}>
      <SearchInput
        valor={filtros.busqueda}
        onCambio={(busqueda) => onCambio({ busqueda })}
        placeholder="Buscar por plaza, placa o usuario"
        etiqueta="Buscar plazas"
        className="sm:max-w-xs"
      />
      <Select
        value={filtros.sotano}
        onChange={(e) => onCambio({ sotano: e.target.value })}
        aria-label="Filtrar por sótano"
        className="sm:w-40"
      >
        <option value="TODOS">Todos los sótanos</option>
        {sotanos.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Select
        value={filtros.estado}
        onChange={(e) => onCambio({ estado: e.target.value as EstadoPlaza | 'TODOS' })}
        aria-label="Filtrar por estado de plaza"
        className="sm:w-48"
      >
        <option value="TODOS">Todos los estados</option>
        {ESTADOS_PLAZA.map((e) => (
          <option key={e} value={e}>
            {CONFIG_ESTADO_PLAZA[e].etiqueta}
          </option>
        ))}
      </Select>
    </FilterBar>
  )
}
