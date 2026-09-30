import type { EstadoUsuario, TipoUsuario } from '@/lib/types/dominio'

/**
 * Etiquetas legibles de los enumerados de usuario. RFA01 los muestra en la
 * tabla y los ofrece como opciones de filtro: si el valor crudo del enum se
 * mostrara en pantalla, pareceria un dato de base de datos.
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

export function nombreTipo(tipo: TipoUsuario): string {
  return TIPO_LEGIBLE[tipo]
}

export function nombreEstadoUsuario(estado: EstadoUsuario): string {
  return ESTADO_LEGIBLE[estado]
}
