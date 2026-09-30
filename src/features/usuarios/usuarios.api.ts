import { get, query } from '@/lib/api-client'
import type { EstadoUsuario, Pagina, TipoUsuario, Usuario } from '@/lib/types/dominio'

/**
 * Consulta de usuarios registrados (RFA01).
 *
 * Los filtros se envian al servidor: la vista solo elige que quiere ver y el
 * backend pagina y filtra. Asi el mock y la API real comparten el mismo
 * contrato y RFA01 no depende del orden de llegada de los datos.
 */

export interface FiltrosUsuarios {
  /** Barre nombre completo y codigo institucional. */
  busqueda?: string
  tipo?: TipoUsuario | ''
  estado?: EstadoUsuario | ''
  pagina?: number
  pageSize?: number
}

export function consultarUsuarios(filtros: FiltrosUsuarios): Promise<Pagina<Usuario>> {
  return get<Pagina<Usuario>>(
    `/usuarios${query({
      busqueda: filtros.busqueda,
      tipo: filtros.tipo,
      estado: filtros.estado,
      pagina: filtros.pagina,
      pageSize: filtros.pageSize,
    })}`,
  )
}
