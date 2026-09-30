import type { BadgeProps } from '@/components/ui'
import type { EstadoAcceso } from '@/lib/types/dominio'

/**
 * Etiquetas del estado de un acceso, compartidas por las dos vistas que lo
 * muestran: el historial global (RFA07) y la pestana de accesos del perfil
 * (RFA02). Vive en `components/shared` y no en una feature porque las features
 * no se importan entre si, y un estado que se lea distinto en el perfil y en el
 * historial del panel es justo el tipo de detalle que se nota en una demo.
 *
 * ACCESIBILIDAD (regla 6): ningun estado se distingue solo por color. El texto va
 * en la variante `-ink` de su fondo para pasar 4.5:1, nunca en el color de marca.
 */

const ETIQUETA: Record<EstadoAcceso, string> = {
  DENTRO: 'Dentro',
  FUERA: 'Finalizado',
}

const TONO: Record<EstadoAcceso, BadgeProps['tono']> = {
  // "Finalizado" no es un estado de error: es el 99 % de las filas del historial.
  DENTRO: 'exito',
  FUERA: 'neutro',
}

export function nombreEstadoAcceso(estado: EstadoAcceso): string {
  return ETIQUETA[estado]
}

export function tonoEstadoAcceso(estado: EstadoAcceso): BadgeProps['tono'] {
  return TONO[estado]
}
