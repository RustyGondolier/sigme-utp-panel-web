import { get, query } from '@/lib/api-client'
import type {
  Acceso,
  DetalleUsuario,
  EstadoUsuario,
  Pagina,
  Reserva,
  TipoUsuario,
  Usuario,
} from '@/lib/types/dominio'

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

/**
 * Perfil completo de un usuario (RFA02).
 *
 * El perfil y los vehiculos viajan en una sola respuesta porque RFA02 los
 * presenta juntos y dividirlos obligaria a la vista a esperar dos peticiones
 * para pintar la cabecera.
 */
export function consultarDetalleUsuario(id: string): Promise<DetalleUsuario> {
  return get<DetalleUsuario>(`/usuarios/${id}`)
}

/**
 * Historial de accesos de un usuario, paginado en el servidor.
 *
 * RFA02 lo muestra en una pestana, no en la vista de historial de RFA07: son
 * el mismo dato filtrado por usuario, asi que comparte tipo y forma de
 * respuesta y no necesita un endpoint nuevo con otro nombre.
 */
export function consultarAccesosDeUsuario(
  id: string,
  pagina: number,
  pageSize: number,
): Promise<Pagina<Acceso>> {
  return get<Pagina<Acceso>>(`/usuarios/${id}/accesos${query({ pagina, pageSize })}`)
}

/** Historial de reservas de un usuario, paginado en el servidor (RFA02). */
export function consultarReservasDeUsuario(
  id: string,
  pagina: number,
  pageSize: number,
): Promise<Pagina<Reserva>> {
  return get<Pagina<Reserva>>(`/usuarios/${id}/reservas${query({ pagina, pageSize })}`)
}
