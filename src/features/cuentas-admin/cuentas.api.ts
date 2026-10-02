import { get, patch, post } from '@/lib/api-client'
import type { CuentaAdmin, EstadoAdmin, Rol } from '@/lib/types/dominio'

/**
 * Cuentas de administrador del panel (RFA12).
 *
 * Es la primera feature que escribe, asi que estas funciones son la referencia
 * de como se hace: la vista no toca fetch, y un `invalidateQueries` sobre la
 * lista recarga despues de cada mutacion en vez de mantener una copia local que
 * se desincroniza de lo que el servidor acaba de decidir.
 *
 * No hay paginacion ni filtros: el paso 2 del flujo pide la lista completa y las
 * cuentas se cuentan con una mano. Cuando haga falta, el cambio es agregar `query`
 * como en `features/accesos`.
 */

/** Lo que se envia al crear. La contrasena viaja una vez y no se vuelve a pedir. */
export interface AltaCuenta {
  usuario: string
  correo: string
  rol: Rol
  contrasena: string
}

/** Lo que se puede cambiar de una cuenta existente (paso 5 y desactivacion). */
export interface CambioCuenta {
  correo?: string
  rol?: Rol
  estado?: EstadoAdmin
  /** Obligatorio al desactivar: `ConfirmDialog` lo exige y lo lleva al audit log. */
  motivo?: string
}

export function consultarCuentasAdmin(): Promise<{ items: CuentaAdmin[] }> {
  return get<{ items: CuentaAdmin[] }>('/cuentas-admin')
}

export function crearCuenta(alta: AltaCuenta): Promise<CuentaAdmin> {
  return post<CuentaAdmin>('/cuentas-admin', alta)
}

export function editarCuenta(id: string, cambio: CambioCuenta): Promise<CuentaAdmin> {
  return patch<CuentaAdmin>(`/cuentas-admin/${id}`, cambio)
}
