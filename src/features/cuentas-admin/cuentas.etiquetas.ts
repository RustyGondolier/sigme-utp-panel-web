import type { BadgeProps } from '@/components/ui'
import type { EstadoAdmin } from '@/lib/types/dominio'

/**
 * Etiquetas de las cuentas de administrador (RFA12).
 *
 * Solo las usa esta vista, asi que vive aqui y no en `components/shared`: el
 * estado de un acceso lo comparten RFA02 y RFA07, el de una cuenta no. El rol no
 * se traduce aqui porque `nombreRol` de `@/lib/formatters` ya lo hace y lo usan
 * la cabecera y la pagina de acceso denegado.
 *
 * ACCESIBILIDAD (regla 6): el estado no se distingue solo por el color del badge.
 * El texto va en la variante `-ink` de su fondo para pasar 4.5:1.
 */

const ESTADO_LEGIBLE: Record<EstadoAdmin, string> = {
  ACTIVO: 'Activo',
  BLOQUEADO: 'Bloqueado',
}

/**
 * `exito` para el activo y `alerta` para el bloqueado. El tono communicates la
 * consecuencia, no la gravedad: una cuenta bloqueada es un estado normal de la
 * lista (se puede reactivar), no un error.
 */
const ESTADO_TONO: Record<EstadoAdmin, BadgeProps['tono']> = {
  ACTIVO: 'exito',
  BLOQUEADO: 'alerta',
}

export function nombreEstadoAdmin(estado: EstadoAdmin): string {
  return ESTADO_LEGIBLE[estado]
}

export function tonoEstadoAdmin(estado: EstadoAdmin): BadgeProps['tono'] {
  return ESTADO_TONO[estado]
}
