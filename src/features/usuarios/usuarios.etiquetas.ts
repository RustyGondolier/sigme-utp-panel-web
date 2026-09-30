import type { BadgeProps } from '@/components/ui'
import type { EstadoReserva, EstadoUsuario, TipoUsuario } from '@/lib/types/dominio'

/**
 * Etiquetas legibles de los enumerados de usuario. RFA01 los muestra en la
 * tabla y los ofrece como opciones de filtro: si el valor crudo del enum se
 * mostrara en pantalla, pareceria un dato de base de datos.
 *
 * RFA02 reutiliza este archivo para los estados de reserva que aparecen en su
 * historial: son los mismos datos que RFA05 pinta en su vista, y un estado
 * legible distinto entre pantallas se nota. El estado de acceso no esta aqui
 * porque lo comparten con RFA07 y vive en `components/shared/estadoAcceso`.
 */

export const TIPOS_USUARIO: TipoUsuario[] = ['ALUMNO', 'DOCENTE', 'ADMINISTRATIVO', 'VISITANTE']

export const ESTADOS_USUARIO: EstadoUsuario[] = ['ACTIVO', 'BLOQUEADO']

const TIPO_LEGIBLE: Record<TipoUsuario, string> = {
  ALUMNO: 'Alumno',
  DOCENTE: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
  VISITANTE: 'Visitante',
}

const ESTADO_LEGIBLE: Record<EstadoUsuario, string> = {
  ACTIVO: 'Activo',
  BLOQUEADO: 'Bloqueado',
}

const RESERVA_LEGIBLE: Record<EstadoReserva, string> = {
  ACTIVA: 'Activa',
  COMPLETADA: 'Completada',
  EXPIRADA: 'Expirada',
  // Se nombra al autor de la cancelacion y no solo al resultado: el usuario
  // necesita distinguirla de una cancelacion suya, y el motivo va en RFA06.
  CANCELADA_POR_ADMIN: 'Cancelada por el administrador',
}

const RESERVA_TONO: Record<EstadoReserva, BadgeProps['tono']> = {
  ACTIVA: 'exito',
  COMPLETADA: 'marca',
  EXPIRADA: 'neutro',
  CANCELADA_POR_ADMIN: 'alerta',
}

export function nombreTipo(tipo: TipoUsuario): string {
  return TIPO_LEGIBLE[tipo]
}

export function nombreEstadoUsuario(estado: EstadoUsuario): string {
  return ESTADO_LEGIBLE[estado]
}

export function nombreEstadoReserva(estado: EstadoReserva): string {
  return RESERVA_LEGIBLE[estado]
}

export function tonoEstadoReserva(estado: EstadoReserva): BadgeProps['tono'] {
  return RESERVA_TONO[estado]
}
