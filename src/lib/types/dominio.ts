/**
 * Tipos del dominio SIGME-UTP.
 *
 * Son el contrato compartido entre las 12 vistas, los mocks y (a futuro) la
 * API. Si un dev necesita un campo nuevo, lo agrega aqui y no en su vista: de
 * esa forma las demas features lo pueden consumir sin duplicar el tipo.
 *
 * Los nombres siguen el vocabulario de la matriz de requerimientos (RFA).
 */

/** Unico rol del panel en el MVP (RFA09). La union deja el acompanante listo. */
export type Rol = 'ADMINISTRADOR'

/** Estados de una plaza. Los cuatro son exigidos por RFA03. */
export type EstadoPlaza = 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'FUERA_DE_SERVICIO'

/** Estados posibles de una reserva activa (RFA05). */
export type EstadoReserva = 'ACTIVA' | 'CANCELADA_POR_ADMIN' | 'EXPIRADA' | 'COMPLETADA'

/** Estados de un sensor (RFA04). */
export type EstadoSensor = 'ACTIVO' | 'INACTIVO' | 'FUERA_DE_SERVICIO'

export type EstadoAdmin = 'ACTIVO' | 'BLOQUEADO'

export type TipoUsuario = 'ALUMNO' | 'DOCENTE' | 'ADMINISTRATIVO' | 'VISITANTE'

export interface Cochera {
  id: string
  nombre: string
  /** RNF11: el numero de plazas viene de la configuracion, no del codigo. */
  totalPlazas: number
}

export interface Plaza {
  id: string
  codigo: string
  cocheraId: string
  estado: EstadoPlaza
  /** Presente solo si la plaza esta ocupada. */
  ocupante?: {
    usuarioId: string
    nombre: string
    codigoUsuario: string
    vehiculo: string
    ingresoEn: string
  }
  sensorId?: string
}

export interface Sesion {
  token: string
  adminId: string
  nombre: string
  usuario: string
  correo: string
  rol: Rol
  /** RNF05: los tokens vencen a las 8 horas. */
  expiraEn: string
}

export interface Reserva {
  id: string
  usuarioId: string
  codigoUsuario: string
  nombreUsuario: string
  cocheraId: string
  plazaId: string
  codigoPlaza: string
  estado: EstadoReserva
  solicitadaEn: string
  /** RFA05: la reserva caduca 30 minutos despues de solicitarse. */
  venceEn: string
}

export interface Sensor {
  id: string
  identificador: string
  plazaId: string
  codigoPlaza: string
  cocheraId: string
  estado: EstadoSensor
  ultimoReporteEn: string
}

export interface Usuario {
  id: string
  codigo: string
  nombre: string
  correo: string
  tipo: TipoUsuario
  registradoEn: string
}

export interface Acceso {
  id: string
  usuarioId: string
  codigoUsuario: string
  nombreUsuario: string
  cocheraId: string
  codigoPlaza: string
  vehiculo: string
  ingresoEn: string
  salidaEn?: string
  estado: 'DENTRO' | 'FUERA'
}

export interface CuentaAdmin {
  id: string
  usuario: string
  correo: string
  rol: Rol
  estado: EstadoAdmin
  creadoEn: string
  ultimoAccesoEn?: string
}

export interface EntradaAuditoria {
  id: string
  adminId: string
  adminNombre: string
  accion: string
  elemento: string
  /** RFA10: el audit log se guarda en UTC. */
  ocurridoEn: string
}

/** Respuesta paginada de la API. RFA01 y RFA07 piden paginacion server-side. */
export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  pageSize: number
}
