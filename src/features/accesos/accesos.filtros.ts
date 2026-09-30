/**
 * Estado de los filtros de RFA07 y su traduccion al query string.
 *
 * Va en un `.ts` al lado de la vista (regla 4: un archivo con componente no
 * exporta funciones) y sin JSX, porque ademas se prueba solo.
 *
 * LO MAS IMPORTANTE DE ESTE ARCHIVO: los inputs de fecha devuelven `YYYY-MM-DD`
 * sin zona horaria, asi que "el 5 de septiembre" es un dia del calendario del
 * administrador, no un instante. El backend no puede compararlo sin saber en que
 * huso esta la pantalla, asi que la conversion a instante la hace esta vista, en
 * hora local, y lo que viaja por la red ya es un ISO inequivoco. Si se mandara
 * `2026-09-05` tal cual, el servidor lo leeria como medianoche UTC y en Lima
 * (UTC-5) el filtro arrancaria cinco horas tarde: el 5 por la tarde ya quedaria
 * fuera del rango que el administrador acaba de pedir.
 */

/** Filtros tal como los controla la vista: ids y el texto crudo de los inputs. */
export interface FiltrosAccesosVista {
  busqueda: string
  cocheraId: string
  plazaId: string
  /** `YYYY-MM-DD` del input de fecha, o '' si no se eligio ninguna. */
  desde: string
  hasta: string
}

export const FILTROS_INICIALES: FiltrosAccesosVista = {
  busqueda: '',
  cocheraId: '',
  plazaId: '',
  desde: '',
  hasta: '',
}

/** Un filtro cuenta como activo si el administrador toco alguno de los cinco. */
export function hayFiltros(filtros: FiltrosAccesosVista): boolean {
  return Object.values(filtros).some((valor) => valor !== '')
}

/**
 * El rango esta invertido: se eligio una fecha desde posterior a la hasta.
 *
 * No se corrige en silencio. Reordenar las fechas devolveria resultados que no
 * corresponden a lo que los dos inputs muestran, que es peor que un mensaje:
 * el administrador veria el 10 al 5 y pensaria que el historial esta mal.
 */
export function rangoInvertido(filtros: FiltrosAccesosVista): boolean {
  if (filtros.desde === '' || filtros.hasta === '') return false
  return filtros.desde > filtros.hasta
}

/**
 * Los dos dias elegidos, convertidos a instantes ISO que cubren el dia entero en
 * hora local: `desde` a las 00:00:00.000 y `hasta` a las 23:59:59.999.
 *
 * Un input de fecha no se parsea con `new Date('2026-09-05')` a proposito: el
 * constructor de una cadena `AAAA-MM-DD` la interpreta como UTC, no como hora
 * local, que es justo el error que este archivo existe para no cometer. Se
 * descompone la cadena y se pasa al constructor numerico, que si usa hora local.
 *
 * Un dia sin escribir no acota nada: se devuelve `undefined` y `query()` lo omite,
 * de modo que el backend no recibe un limite inventado.
 */
export function rangoDelDia(desde: string, hasta: string): { desde?: string; hasta?: string } {
  return {
    desde: instanteDelDia(desde, 0),
    hasta: instanteDelDia(hasta, 23, 59, 59, 999),
  }
}

/** Instante ISO del dia `dia` a las `hora` dados, en hora local. */
function instanteDelDia(dia: string, hora: number, minuto = 0, segundo = 0, milisegundo = 0) {
  if (dia === '') return undefined

  const [anio, mes, numero] = dia.split('-').map(Number)
  if (!anio || !mes || !numero) return undefined

  return new Date(anio, mes - 1, numero, hora, minuto, segundo, milisegundo).toISOString()
}
