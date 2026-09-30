import { get, query } from '@/lib/api-client'
import type { Acceso, Cochera, Pagina, Plaza } from '@/lib/types/dominio'

/**
 * Historial de accesos (RFA07).
 *
 * Los cuatro filtros del paso 3 viajan al servidor y la paginacion tambien: la
 * vista no ordena ni recorta filas, es una espejo de lo que devuelve la API.
 */

/** Filtros del paso 3 de RFA07, ya traducidos a lo que espera el backend. */
export interface FiltrosAccesos {
  /** Barre nombre y codigo institucional del usuario. */
  busqueda?: string
  cocheraId?: string
  plazaId?: string
  /** Instantes ISO en UTC. Los arma `accesos.filtros` desde los inputs de fecha. */
  desde?: string
  hasta?: string
  pagina?: number
  pageSize?: number
}

export function consultarAccesos(filtros: FiltrosAccesos): Promise<Pagina<Acceso>> {
  return get<Pagina<Acceso>>(
    `/accesos${query({
      busqueda: filtros.busqueda,
      cocheraId: filtros.cocheraId,
      plazaId: filtros.plazaId,
      desde: filtros.desde,
      hasta: filtros.hasta,
      pagina: filtros.pagina,
      pageSize: filtros.pageSize,
    })}`,
  )
}

/**
 * Catalogo de cocheras para el filtro de cochera. RNF11: el listado viene de la
 * configuracion, asi que agregar una cochera no obliga a tocar esta vista.
 */
export function consultarCocheras(): Promise<{ items: Cochera[] }> {
  return get<{ items: Cochera[] }>('/cocheras')
}

/**
 * Catalogo de plazas para el filtro de plaza.
 *
 * Comparte endpoint con el Monitor (RFA03), que lo consulta para el mapa. Hoy es
 * el unico consumidor desde esta feature; cuando el Monitor lo pida tambien, la
 * funcion sube a `lib` en vez de duplicarse. Ojo: `/plazas` responde el estado
 * actual de cada plaza, que es lo que RFA03 necesita y aqui solo se leen `id`,
 * `codigo` y `cocheraId`.
 */
export function consultarPlazas(): Promise<{ items: Plaza[] }> {
  return get<{ items: Plaza[] }>('/plazas')
}
