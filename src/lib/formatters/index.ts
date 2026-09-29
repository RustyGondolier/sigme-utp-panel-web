import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formateo de datos para la vista. Centralizado para que el dashboard, el
 * monitor y el historial no inventen formatos distintos: ante el jurado, dos
 * vistas que muestran la misma fecha con formatos diferentes se notan.
 *
 * Nota RFA10: el audit log se guarda en UTC. Para las pantallas de operacion
 * mostramos hora local de Lima, pero el valor crudo siempre viaja en ISO.
 */

const parse = (iso: string): Date => {
  const d = parseISO(iso)
  return isValid(d) ? d : new Date(0)
}

/** 27 sep 2026, 14:35 */
export function fechaHora(iso: string): string {
  return format(parse(iso), 'd MMM y, HH:mm', { locale: es })
}

/** 27 sep 2026 */
export function fecha(iso: string): string {
  return format(parse(iso), 'd MMM y', { locale: es })
}

/** 14:35 */
export function hora(iso: string): string {
  return format(parse(iso), 'HH:mm', { locale: es })
}

/** "hace 4 minutos" */
export function tiempoRelativo(iso: string): string {
  return formatDistanceToNowStrict(parse(iso), { addSuffix: true, locale: es })
}

/**
 * Tiempo transcurrido desde un ingreso, en la unidad mas grande que se lea
 * sin decimales: "2 h 15 min", "38 min", "12 s". RFA03 pide mostrarlo junto a
 * cada plaza ocupada.
 */
export function tiempoTranscurrido(desde: string, ahora: Date = new Date()): string {
  const segundos = Math.max(0, Math.floor((ahora.getTime() - parse(desde).getTime()) / 1000))
  if (segundos < 60) return `${segundos} s`
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const restoMin = minutos % 60
  if (horas < 24) return restoMin === 0 ? `${horas} h` : `${horas} h ${restoMin} min`
  const dias = Math.floor(horas / 24)
  return `${dias} d ${horas % 24} h`
}

/** Cuenta regresiva mm:ss. RFA05: el temporizador de 30 minutos de cada reserva. */
export function cuentaRegresiva(hasta: string, ahora: Date = new Date()): string {
  const ms = parse(hasta).getTime() - ahora.getTime()
  const expirada = ms <= 0
  const total = Math.floor(Math.abs(ms) / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${expirada ? '-' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Porcentaje redondeado a un decimal. 38.3 -> "38.3 %" */
export function porcentaje(valor: number, decimales = 1): string {
  return `${valor.toFixed(decimales)} %`
}

/** Fecha ISO en UTC, que es como viaja todo dato por la API. */
export function aIsoUtc(fecha_: Date = new Date()): string {
  return fecha_.toISOString()
}

/** "hace un instante" / "hace 12 s": para el badge de "ultima actualizacion". */
export function haceCuanto(iso: string, ahora: Date = new Date()): string {
  const segundos = Math.max(0, Math.floor((ahora.getTime() - parse(iso).getTime()) / 1000))
  if (segundos < 5) return 'hace un instante'
  return `hace ${tiempoTranscurrido(iso, ahora)}`
}

/**
 * Rol legible: ADMINISTRADOR -> "administrador". El valor crudo del enum solo
 * aparece en la URL y en los logs; en pantalla nunca se muestra en MAYUSCULAS
 * con guion bajo, que es como se ve un valor de base de datos.
 */
export function nombreRol(valor: string): string {
  return valor.replace(/_/g, ' ').toLowerCase()
}
